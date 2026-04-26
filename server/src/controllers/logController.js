import { Employee, Project, WorkLog } from "../models/index.js";
import { sendError } from "../utils/http.js";
import { getTodayDate } from "../utils/date.js";

const getLogWithRelations = async (id) =>
  WorkLog.findByPk(id, {
    include: [
      { model: Employee, attributes: ["id", "name"] },
      { model: Project, attributes: ["id", "name"] },
    ],
  });

const validateLogPayload = async ({ date, projectId, employeeId, hours }) => {
  if (!projectId || !employeeId || !hours) {
    return {
      status: 400,
      message: "Date, employee, project, and hours are required",
    };
  }

  const [employee, project] = await Promise.all([
    Employee.findByPk(employeeId),
    Project.findByPk(projectId),
  ]);

  if (!employee || !project) {
    return {
      status: 400,
      message: "Invalid employee or project selected",
    };
  }

  return {
    payload: {
      date: date || getTodayDate(),
      projectId,
      employeeId,
      hours,
    },
  };
};

export const createLog = async (req, res) => {
  try {
    const { date, projectId, employeeId, hours } = req.body;
    const validation = await validateLogPayload({ date, projectId, employeeId, hours });

    if (!validation.payload) {
      return res.status(validation.status).json({ message: validation.message });
    }

    const log = await WorkLog.create(validation.payload);
    const createdLog = await getLogWithRelations(log.id);

    return res.status(201).json(createdLog);
  } catch (error) {
    return sendError(res, error, "Failed to create work log");
  }
};

export const getLogsByDate = async (req, res) => {
  try {
    const date = req.query.date || getTodayDate();
    const logs = await WorkLog.findAll({
      where: { date },
      include: [
        { model: Employee, attributes: ["id", "name"] },
        { model: Project, attributes: ["id", "name"] },
      ],
      order: [
        [{ model: Employee }, "name", "ASC"],
        [{ model: Project }, "name", "ASC"],
      ],
    });

    const summaryMap = new Map();

    logs.forEach((log) => {
      const employeeId = log.employeeId;
      const employeeName = log.Employee?.name || "Unknown Employee";
      const hours = Number(log.hours);

      if (!summaryMap.has(employeeId)) {
        summaryMap.set(employeeId, {
          employeeId,
          employeeName,
          totalHours: 0,
        });
      }

      summaryMap.get(employeeId).totalHours += hours;
    });

    return res.json({
      date,
      logs,
      summary: Array.from(summaryMap.values()).map((item) => ({
        ...item,
        totalHours: Number(item.totalHours.toFixed(2)),
      })),
    });
  } catch (error) {
    return sendError(res, error, "Failed to fetch work logs");
  }
};

export const updateLog = async (req, res) => {
  try {
    const log = await WorkLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Work log not found" });
    }

    const { date, projectId, employeeId, hours } = req.body;
    const validation = await validateLogPayload({ date, projectId, employeeId, hours });

    if (!validation.payload) {
      return res.status(validation.status).json({ message: validation.message });
    }

    await log.update(validation.payload);
    const updatedLog = await getLogWithRelations(log.id);

    return res.json(updatedLog);
  } catch (error) {
    return sendError(res, error, "Failed to update work log");
  }
};

export const deleteLog = async (req, res) => {
  try {
    const log = await WorkLog.findByPk(req.params.id);

    if (!log) {
      return res.status(404).json({ message: "Work log not found" });
    }

    await log.destroy();
    return res.json({ message: "Work log deleted successfully" });
  } catch (error) {
    return sendError(res, error, "Failed to delete work log");
  }
};
