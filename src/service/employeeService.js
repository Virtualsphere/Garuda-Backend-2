import Employee from "../model/employeeModel.js";
import RefreshToken from "../model/refreshTokenModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET;
const REFRESH_TOKEN_SECRET = process.env.REFRESH_SECRET;

const ACCESS_TOKEN_EXPIRY = "60m";
const REFRESH_TOKEN_EXPIRY_DAYS = 60;

/* =========================
   GENERATE TOKENS
========================= */

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

/* =========================
   SIGNUP
========================= */

export const signup = async (data) => {
  const { name, email, phone, password, role, secondary_role, other_phone, blood_group, about, status, aadhar_number, aadhar_photo, bank_name, account_number, ifsc_code, phone_pe_number, google_pay_number, upi_id, address, shirt_size, work_state, work_district, work_mandal, work_village, salary_package } = data;

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
    salary_package
  });

  return employee;
};

/* =========================
   LOGIN
========================= */

export const login = async ({ email, password }) => {
  const employee = await Employee.findOne({ where: { email } });

  if (!employee) throw new Error("Invalid credentials");

  const isMatch = await bcrypt.compare(password, employee.password);
  if (!isMatch) throw new Error("Invalid credentials");

  const accessToken = generateAccessToken(employee);
  const refreshToken = await generateRefreshToken(employee);

  return {
    employee,
    accessToken,
    refreshToken,
  };
};

/* =========================
   REFRESH TOKEN
========================= */

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

/* =========================
   UPDATE Employee
========================= */

export const updateEmployee = async (id, data) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  await employee.update(data);
  return employee;
};

/* =========================
   DELETE Employee
========================= */

export const deleteEmployee = async (id) => {
  const employee = await Employee.findByPk(id);
  if (!employee) throw new Error("Employee not found");

  await employee.destroy();
  return true;
};

/* =========================
   LOGOUT (DELETE TOKEN)
========================= */

export const logout = async (refreshToken) => {
  await RefreshToken.destroy({
    where: { token: refreshToken },
  });

  return true;
};