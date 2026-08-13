import Employee from "../model/employeeModel.js";
import * as myOperatorService from "../service/myOperatorService.js";
import * as callSignalService from "../service/callSignalService.js";

export const clickToCall = async (req, res) => {
  try {
    const { customerNumber, departmentType, missionContext, landId, callerName } = req.body;

    if (!customerNumber) {
      return res.status(400).json({ success: false, message: "customerNumber is required" });
    }
    if (!departmentType) {
      return res.status(400).json({ success: false, message: "departmentType is required" });
    }

    const employee = await Employee.findByPk(req.user.id);
    if (!employee?.phone) {
      return res.status(400).json({ success: false, message: "No phone number on file for this employee" });
    }

    const referenceId = `call_${req.user.id}_${Date.now()}`;

    const result = await myOperatorService.clickToCall({
      agentNumber: employee.phone,
      customerNumber,
      referenceId,
    });

    const signal = await callSignalService.createCallSignal({
      employee_id: req.user.id,
      department_type: departmentType,
      direction: "outbound",
      caller_name: callerName,
      caller_phone: customerNumber,
      mission_context: missionContext,
      land_id: landId,
      status: "initiated",
    });

    return res.status(200).json({ success: true, data: { referenceId, myOperator: result, callSignal: signal } });
  } catch (error) {
    return res.status(502).json({ success: false, message: error.message });
  }
};
