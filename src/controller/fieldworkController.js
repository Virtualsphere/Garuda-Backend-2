import * as landService from "../service/landService.js";

export const createAssignedVillage= async(req, res)=>{
    try {
        const { target, assignedStatus, assignedEmployeeId, village, mandal, physicalVerified } = req.body;
        const result= await landService.createAssignedVillage(target, assignedStatus, assignedEmployeeId, village, mandal, physicalVerified);
        return res.status(201).json({
            message: `Assigned Land Sucessfully with Employee Id: ${result.assigned_employee_id}`,
            result
        })
    } catch (error) {
        return res.status(500).json(error);
    }
}

export const getAssignedVillageByEmployee= async(req, res)=>{
    try {
        const { employeeId } = req.user?.id;
        const result= await landService.getAssignedVillagesByEmployee(employeeId);
        return res.status(200).json({
            message: "Assigned village fetched successfully",
            result
        })
    } catch (error) {
        return res.status(500).json(error);
    }
}

export const updateAssignedVillage= async(req, res)=>{
    try {
        const data = req.body;
        const result= await landService.updateAssignedVillage(data);
        return res.status(200).json({
            message: "Updage village successfully",
            result
        })
    } catch (error) {
        return res.status(500).json(error);
    }
}