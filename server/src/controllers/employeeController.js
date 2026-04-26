import { Employee } from "../models/index.js";
import { sendError } from "../utils/http.js";

export const getEmployees = async (_req, res) => {
  try {
    const employees = await Employee.findAll({ order: [["name", "ASC"]] });
    return res.json(employees);
  } catch (error) {
    return sendError(res, error, "Failed to fetch employees");
  }
};

export const createEmployee = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name?.trim()) {
      return res.status(400).json({ message: "Employee name is required" });
    }

    const employee = await Employee.create({ name: name.trim() });
    return res.status(201).json(employee);
  } catch (error) {
    return sendError(res, error, "Failed to create employee");
  }
};

export const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByPk(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    await employee.destroy();
    return res.json({ message: "Employee removed successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete employee");
  }
};
