import * as employeeService from "../service/employeeService.js";

export const signup = async (req, res) => {
  try {
    const employee = await employeeService.signup(req.body);

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: employee,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { employee, accessToken, refreshToken } =
      await employeeService.login(req.body);

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: employee,
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    const data = await employeeService.refreshAccessToken(refreshToken);

    res.status(200).json({
      success: true,
      accessToken: data.accessToken,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeProfile = async (req, res) => {
  try {
    const id = req.user?.id;

    if (!id) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Employee ID not found",
      });
    }

    const profile = await employeeService.getEmployeeProfile(id);

    res.status(200).json({
      success: true,
      message: "Employee profile fetched successfully",
      data: profile,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await employeeService.getEmployeeById(id);

    res.status(200).json({
      success: true,
      message: "Employee fetched successfully",
      data: employee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getAllEmployees = async (req, res) => {
  try {
    const employees = await employeeService.getAllEmployees();

    res.status(200).json({
      success: true,
      message: "Employees fetched successfully",
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.id;

    // Allow users to update their own profile or admins to update any
    const targetId = id || employeeId;

    if (!targetId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Employee ID not found",
      });
    }

    const updatedEmployee = await employeeService.updateEmployee(
      targetId,
      req.body
    );

    res.status(200).json({
      success: true,
      message: "Employee updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employeeId = req.user?.id;

    const targetId = id || employeeId;

    if (!targetId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: Employee ID not found",
      });
    }

    await employeeService.deleteEmployee(targetId);

    res.status(200).json({
      success: true,
      message: "Employee deleted successfully",
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        message: "Refresh token required",
      });
    }

    await employeeService.logout(refreshToken);

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateSalaryPackage = async (req, res) => {
  try {
    const { id } = req.params;
    const { new_land_price, verification_price, buyer_visit_price, referal_price } = req.body;

    const updatedEmployee = await employeeService.updateSalaryPackage(
      id,
      {
        new_land_price,
        verification_price,
        buyer_visit_price,
        referal_price
      }
    );

    res.status(200).json({
      success: true,
      message: "Salary package updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateWorkLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { work_state, work_district, work_mandal, work_village } = req.body;

    const updatedEmployee = await employeeService.updateWorkLocation(
      id,
      {
        work_state,
        work_district,
        work_mandal,
        work_village
      }
    );

    res.status(200).json({
      success: true,
      message: "Work location updated successfully",
      data: updatedEmployee,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};