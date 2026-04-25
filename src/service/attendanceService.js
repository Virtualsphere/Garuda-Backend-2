import { Op } from "sequelize";
import { Attendance, Employee } from "../model/associationModel.js";
import Calendar from "../model/calendarModel.js";

export const getCalendarWithAttendance = async (
  employeeId,
  startDate,
  endDate
) => {
  // Build date filter dynamically
  const dateFilter = {};

  if (startDate && endDate) {
    dateFilter[Op.between] = [startDate, endDate];
  } else if (startDate) {
    dateFilter[Op.gte] = startDate; // greater than or equal
  } else if (endDate) {
    dateFilter[Op.lte] = endDate; // less than or equal
  }

  const calendarWhere = Object.keys(dateFilter).length
    ? { date: dateFilter }
    : {};

  const attendanceWhere = {
    employee_id: employeeId,
    ...(Object.keys(dateFilter).length && { date: dateFilter }),
  };

  const dates = await Calendar.findAll({
    where: calendarWhere,
  });

  const attendance = await Attendance.findAll({
    where: attendanceWhere,
  });

  const attendanceMap = {};
  attendance.forEach((a) => {
    attendanceMap[a.date] = a;
  });

  return dates.map((day) => ({
    date: day.date,
    type: day.type,
    status: attendanceMap[day.date]?.status || null,
  }));
};

export const markAttendance = async (employeeId, date, status) => {
  const calendarDay = await Calendar.findOne({ where: { date } });

  if (calendarDay?.type === "HOLIDAY" || calendarDay?.type === "WEEKEND") {
    throw new Error("Cannot mark attendance on holiday/weekend");
  }

  const [record, created] = await Attendance.findOrCreate({
    where: { employee_id: employeeId, date },
    defaults: {
      status,
      marked_by: "EMPLOYEE",
    },
  });

  if (!created) {
    await record.update({
      status,
      marked_by: "EMPLOYEE",
    });
  }

  return record;
};

export const adminUpdateAttendance = async (
  employeeId,
  date,
  status
) => {
  const record = await Attendance.findOne({
    where: { employee_id: employeeId, date },
  });

  if (!record) {
    return await Attendance.create({
      employee_id: employeeId,
      date,
      status,
      marked_by: "ADMIN",
    });
  }

  await record.update({
    status,
    marked_by: "ADMIN",
  });

  return record;
};

export const addHoliday = async (date, description) => {
  const [record, created] = await Calendar.findOrCreate({
    where: { date },
    defaults: {
      type: "HOLIDAY",
      description,
    },
  });

  if (!created) {
    await record.update({
      type: "HOLIDAY",
      description,
    });
  }

  return record;
};

export const markWeekends = async (startDate, endDate) => {
  const dates = [];
  let current = new Date(startDate);

  while (current <= new Date(endDate)) {
    const day = current.getDay();

    if (day === 0) { // Sunday
      dates.push({
        date: current.toISOString().split("T")[0],
        type: "WEEKEND",
        description: "Sunday",
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return await Calendar.bulkCreate(dates, {
    updateOnDuplicate: ["type", "description"],
  });
};

export const getMonthlyReport = async (employeeId, month, year) => {
  const startDate = `${year}-${month}-01`;
  const endDate = `${year}-${month}-31`;

  return await Attendance.findAll({
    where: {
      employee_id: employeeId,
      date: {
        [Op.between]: [startDate, endDate],
      },
    },
    order: [["date", "ASC"]],
  });
};