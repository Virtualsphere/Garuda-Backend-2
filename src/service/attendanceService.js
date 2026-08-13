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

/* =====================================================
   DEPARTMENT PRESENCE REGISTRY
   (used by the HR/Department "Attendance" screens —
   filters employees by a role keyword, e.g. "call center")
===================================================== */

const getDeptEmployees = async (role) => {
  const where = {};
  if (role) {
    where.role = { [Op.iLike]: `%${role}%` };
  }
  return await Employee.findAll({
    where,
    attributes: ["id", "name", "role", "photo", "phone", "status", "created_at"],
    order: [["id", "ASC"]],
  });
};

const toMissionHours = (checkIn, checkOut) => {
  if (!checkIn || !checkOut) return null;
  const diffMs = new Date(checkOut) - new Date(checkIn);
  if (diffMs <= 0) return null;
  return Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
};

const shapeEmployee = (emp) => ({
  id: emp.id,
  name: emp.name,
  role: emp.role,
  photo: emp.photo,
  phone: emp.phone,
});

export const getDailyRegistry = async (role, date) => {
  const employees = await getDeptEmployees(role);
  const employeeIds = employees.map((e) => e.id);

  const records = await Attendance.findAll({
    where: { employee_id: { [Op.in]: employeeIds }, date },
  });
  const recordMap = {};
  records.forEach((r) => {
    recordMap[r.employee_id] = r;
  });

  return employees.map((emp) => {
    const r = recordMap[emp.id];
    return {
      ...shapeEmployee(emp),
      date,
      status: r?.status || "ABSENT",
      check_in: r?.check_in || null,
      check_out: r?.check_out || null,
      mission_hours: toMissionHours(r?.check_in, r?.check_out),
      verified: r?.verified || false,
      exit_type: r?.exit_type || null,
    };
  });
};

export const getWeeklyRegistry = async (role, startDate, endDate) => {
  const employees = await getDeptEmployees(role);
  const employeeIds = employees.map((e) => e.id);

  const records = await Attendance.findAll({
    where: {
      employee_id: { [Op.in]: employeeIds },
      date: { [Op.between]: [startDate, endDate] },
    },
  });

  const recordMap = {};
  records.forEach((r) => {
    if (!recordMap[r.employee_id]) recordMap[r.employee_id] = {};
    recordMap[r.employee_id][r.date] = {
      status: r.status,
      check_in: r.check_in,
      check_out: r.check_out,
      mission_hours: toMissionHours(r.check_in, r.check_out),
    };
  });

  const dates = [];
  let cursor = new Date(startDate);
  const end = new Date(endDate);
  while (cursor <= end) {
    dates.push(cursor.toISOString().split("T")[0]);
    cursor.setDate(cursor.getDate() + 1);
  }

  return {
    dates,
    employees: employees.map((emp) => ({
      ...shapeEmployee(emp),
      days: dates.reduce((acc, d) => {
        acc[d] = recordMap[emp.id]?.[d] || { status: "ABSENT", check_in: null, check_out: null, mission_hours: null };
        return acc;
      }, {}),
    })),
  };
};

export const getMonthlyRegistry = async (role, month, year) => {
  const employees = await getDeptEmployees(role);
  const employeeIds = employees.map((e) => e.id);
  const monthStr = String(month).padStart(2, "0");
  const startDate = `${year}-${monthStr}-01`;
  const endDate = new Date(year, month, 0).toISOString().split("T")[0];

  const records = await Attendance.findAll({
    where: {
      employee_id: { [Op.in]: employeeIds },
      date: { [Op.between]: [startDate, endDate] },
    },
  });

  const byEmployee = {};
  records.forEach((r) => {
    if (!byEmployee[r.employee_id]) byEmployee[r.employee_id] = [];
    byEmployee[r.employee_id].push(r);
  });

  return employees.map((emp) => {
    const empRecords = byEmployee[emp.id] || [];
    const presentDays = empRecords.filter((r) => r.status === "PRESENT").length;
    const leaveDays = empRecords.filter((r) => r.status === "LEAVE").length;
    const absentDays = empRecords.filter((r) => r.status === "ABSENT").length;
    const totalHours = empRecords.reduce((sum, r) => sum + (toMissionHours(r.check_in, r.check_out) || 0), 0);

    return {
      ...shapeEmployee(emp),
      presentDays,
      leaveDays,
      absentDays,
      totalHours: Math.round(totalHours * 100) / 100,
      days: empRecords.reduce((acc, r) => {
        acc[r.date] = r.status;
        return acc;
      }, {}),
    };
  });
};

export const bulkUpsertAttendance = async (date, records) => {
  const results = [];
  for (const rec of records) {
    const { employee_id, check_in, check_out, status } = rec;
    const recordDate = rec.date || date;
    const [record, created] = await Attendance.findOrCreate({
      where: { employee_id, date: recordDate },
      defaults: {
        status: status || "PRESENT",
        check_in: check_in || null,
        check_out: check_out || null,
        marked_by: "ADMIN",
        verified: !!check_in,
        exit_type: check_out ? "MANUAL" : null,
      },
    });

    if (!created) {
      const finalCheckIn = check_in !== undefined ? check_in : record.check_in;
      const finalCheckOut = check_out !== undefined ? check_out : record.check_out;
      await record.update({
        status: status || record.status,
        check_in: finalCheckIn,
        check_out: finalCheckOut,
        marked_by: "ADMIN",
        verified: !!finalCheckIn,
        exit_type: finalCheckOut ? "MANUAL" : null,
      });
    }

    results.push(record);
  }
  return results;
};