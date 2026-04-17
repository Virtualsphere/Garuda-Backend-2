import Employee from "../model/employeeModel.js";
import RefreshToken from "../model/refreshTokenModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET;

const ACCESS_TOKEN_EXPIRY = "60m";
const REFRESH_TOKEN_EXPIRY_DAYS = 60;

const generateAccessToken = (employee) => {
  return jwt.sign(
    { id: employee.id, type: employee.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
};

const generateRefreshToken = async (employee) => {
  const token = jwt.sign(
    { id: employee.id, type: employee.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: `${REFRESH_TOKEN_EXPIRY_DAYS}d` }
  );

  await RefreshToken.create({
    user_id: employee.id,
    role: employee.role,
    token,
    expiry_date: new Date(
      Date.now() + REFRESH_TOKEN_EXPIRY_DAYS * 24 * 60 * 60 * 1000
    ),
  });

  return token;
};

export const signup = async (data) => {
  const {
    name,
    email,
    phone,
    password,
    role,
    secondary_role,
    other_phone,
    blood_group,
    about,
    status,
    aadhar_number,
    aadhar_photo,
    bank_name,
    account_number,
    ifsc_code,
    phone_pe_number,
    google_pay_number,
    upi_id,
    address,
    shirt_size,
    work_state,
    work_district,
    work_mandal,
    work_village,
    new_land_price,
    verification_price,
    buyer_visit_price,
    referal_price
  } = data;

  const existing = await Employee.findOne({ where: { email } });
  if (existing) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const employee = await Employee.create({
    name,
    role,
    password: hashedPassword,
    secondary_role,
    email,
    phone,
    other_phone,
    blood_group,
    about,
    status,
    aadhar_number,
    aadhar_photo,
    bank_name,
    account_number,
    ifsc_code,
    phone_pe_number,
    google_pay_number,
    upi_id,
    address,
    shirt_size,
    work_state,
    work_district,
    work_mandal,
    work_village,
    new_land_price,
    verification_price,
    buyer_visit_price,
    referal_price
  });

  const { password: _, ...employeeWithoutPassword } = employee.toJSON();
  return employeeWithoutPassword;
};

export const login = async ({ email, password }) => {
  const employee = await Employee.findOne({ where: { email } });

  if (!employee) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(employee);
  const refreshToken = await generateRefreshToken(employee);

  const { password: _, ...employeeWithoutPassword } = employee.toJSON();

  return {
    employee: employeeWithoutPassword,
    accessToken,
    refreshToken,
  };
};

export const refreshAccessToken = async (token) => {
  const storedToken = await RefreshToken.findOne({
    where: { token },
  });

  if (!storedToken) throw new Error("Invalid refresh token");

  if (new Date() > storedToken.expiry_date) {
    throw new Error("Refresh token expired");
  }

  const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

  const employee = await Employee.findByPk(decoded.id);
  if (!employee) throw new Error("User not found");

  const newAccessToken = generateAccessToken(employee);

  return { accessToken: newAccessToken };
};

export const getEmployeeById = async (id) => {
  const employee = await Employee.findByPk(id, {
    attributes: { exclude: ['password'] }
  });

  if (!employee) throw new Error("Employee not found");

  return employee;
};

export const getAllEmployees = async () => {
  const employees = await Employee.findAll({
    attributes: { exclude: ['password'] },
    order: [['created_at', 'DESC']]
  });

  return employees;
};

export const updateEmployee = async (id, data) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  // Remove password from update data if present
  const { password, ...updateData } = data;

  await employee.update(updateData);

  const { password: _, ...employeeWithoutPassword } = employee.toJSON();
  return employeeWithoutPassword;
};

export const deleteEmployee = async (id) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  // Also delete refresh tokens
  await RefreshToken.destroy({
    where: { user_id: id }
  });

  await employee.destroy();
  return true;
};

export const logout = async (refreshToken) => {
  await RefreshToken.destroy({
    where: { token: refreshToken },
  });

  return true;
};

// Get employee profile with formatted work location and salary package
export const getEmployeeProfile = async (id) => {
  const employee = await Employee.findByPk(id, {
    attributes: { exclude: ['password'] }
  });

  if (!employee) throw new Error("Employee not found");

  // Format the response as shown in the screenshot
  const profile = {
    id: employee.id,
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    photo: employee.photo,
    about: employee.about,
    blood_group: employee.blood_group,
    status: employee.status,
    other_phone: employee.other_phone,
    aadhar_number: employee.aadhar_number,
    aadhar_photo: employee.aadhar_photo,
    address: employee.address,
    shirt_size: employee.shirt_size,

    // Working Location (can be multiple)
    working_location: {
      state: employee.work_state,
      district: employee.work_district, // Can be array or single
      mandal: employee.work_mandal,     // Can be array or single
      village: employee.work_village    // Can be array or single
    },

    // Salary Package
    salary_package: {
      new_land_price: employee.new_land_price || 0,
      verification_price: employee.verification_price || 0,
      buyer_visit_price: employee.buyer_visit_price || 0,
      referral_price: employee.referal_price || 0
    },

    // Bank Details
    bank_details: {
      bank_name: employee.bank_name,
      account_number: employee.account_number,
      ifsc_code: employee.ifsc_code,
      upi_id: employee.upi_id,
      phone_pe_number: employee.phone_pe_number,
      google_pay_number: employee.google_pay_number
    },

    created_at: employee.created_at,
    updated_at: employee.updated_at
  };

  return profile;
};

// Update only salary package
export const updateSalaryPackage = async (id, salaryData) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  await employee.update({
    new_land_price: salaryData.new_land_price,
    verification_price: salaryData.verification_price,
    buyer_visit_price: salaryData.buyer_visit_price,
    referal_price: salaryData.referal_price
  });

  const { password: _, ...employeeWithoutPassword } = employee.toJSON();
  return employeeWithoutPassword;
};

// Update only work location
export const updateWorkLocation = async (id, locationData) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  await employee.update({
    work_state: locationData.work_state,
    work_district: locationData.work_district,
    work_mandal: locationData.work_mandal,
    work_village: locationData.work_village
  });

  const { password: _, ...employeeWithoutPassword } = employee.toJSON();
  return employeeWithoutPassword;
};