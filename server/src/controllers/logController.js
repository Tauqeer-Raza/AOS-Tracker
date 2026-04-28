import { Op, fn, col } from "sequelize";
import { sequelize } from "../config/db.js";
import { Employee, Project, WorkLog } from "../models/index.js";
import { sendError } from "../utils/http.js";
import { getTodayDate } from "../utils/date.js";

const MAX_HOURS_PER_DAY = 8;
const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const getLogWithRelations = async (id, transaction) =>
  WorkLog.findByPk(id, {
    include: [
      { model: Employee, attributes: ["id", "name"] },
      { model: Project, attributes: ["id", "name"] },
    ],
    transaction,
  });

const getLogsWithRelations = async (ids, transaction) =>
  WorkLog.findAll({
    where: {
      id: {
        [Op.in]: ids,
      },
    },
    include: [
      { model: Employee, attributes: ["id", "name"] },
      { model: Project, attributes: ["id", "name"] },
    ],
    order: [["date", "ASC"], ["id", "ASC"]],
    transaction,
  });

const isValidDateOnly = (value) => {
  if (!DATE_ONLY_PATTERN.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const normalizeRequestedDates = ({ date, dates }) => {
  const requestedDates = Array.isArray(dates) && dates.length ? dates : [date || getTodayDate()];
  return [...new Set(requestedDates.map((value) => String(value).trim()))].sort((a, b) =>
    a.localeCompare(b)
  );
};

const getExistingHoursByDate = async ({ dates, employeeId, excludeLogId }) => {
  const where = {
    employeeId,
    date: {
      [Op.in]: dates,
    },
  };

  if (excludeLogId) {
    where.id = {
      [Op.ne]: excludeLogId,
    };
  }

  const rows = await WorkLog.findAll({
    where,
    attributes: ["date", [fn("SUM", col("hours")), "totalHours"]],
    group: ["date"],
    raw: true,
  });

  return new Map(
    rows.map((row) => [row.date, Number(Number(row.totalHours || 0).toFixed(2))])
  );
};

const buildHoursExceededFailure = (date, existingHours, requestedHours) => {
  const nextTotal = Number((existingHours + requestedHours).toFixed(2));
  const remainingHours = Number(Math.max(0, MAX_HOURS_PER_DAY - existingHours).toFixed(2));

  return {
    date,
    existingHours,
    requestedHours,
    remainingHours,
    totalHours: nextTotal,
    message: `Adding ${requestedHours.toFixed(
      2
    )} hours on ${date} would exceed 8 hours for this employee (existing: ${existingHours.toFixed(
      2
    )}, remaining: ${remainingHours.toFixed(2)}).`,
  };
};

const validateLogPayload = async ({ date, dates, projectId, employeeId, hours }) => {
  if (!projectId || !employeeId || hours === undefined || hours === null || hours === "") {
    return {
      status: 400,
      message: "Date or dates, employee, project, and hours are required",
    };
  }

  const normalizedProjectId = Number(projectId);
  const normalizedEmployeeId = Number(employeeId);
  const normalizedHours = Number(hours);

  if (!Number.isInteger(normalizedProjectId) || !Number.isInteger(normalizedEmployeeId)) {
    return {
      status: 400,
      message: "Invalid employee or project selected",
    };
  }

  if (!Number.isFinite(normalizedHours) || normalizedHours <= 0) {
    return {
      status: 400,
      message: "Hours must be greater than 0",
    };
  }

  if (normalizedHours > MAX_HOURS_PER_DAY) {
    return {
      status: 400,
      message: "Hours must not exceed 8 for a single date",
    };
  }

  const normalizedDates = normalizeRequestedDates({ date, dates });
  const invalidDates = normalizedDates.filter((value) => !isValidDateOnly(value));

  if (!normalizedDates.length) {
    return {
      status: 400,
      message: "At least one valid date is required",
    };
  }

  if (invalidDates.length) {
    return {
      status: 400,
      message: "One or more selected dates are invalid",
      invalidDates,
    };
  }

  const [employee, project] = await Promise.all([
    Employee.findByPk(normalizedEmployeeId),
    Project.findByPk(normalizedProjectId),
  ]);

  if (!employee || !project) {
    return {
      status: 400,
      message: "Invalid employee or project selected",
    };
  }

  return {
    payload: {
      dates: normalizedDates,
      projectId: normalizedProjectId,
      employeeId: normalizedEmployeeId,
      hours: normalizedHours,
    },
  };
};

const validateDateCapacity = async ({ dates, employeeId, hours, excludeLogId }) => {
  const existingHoursByDate = await getExistingHoursByDate({
    dates,
    employeeId,
    excludeLogId,
  });

  const failures = [];
  const validDates = [];

  dates.forEach((date) => {
    const existingHours = existingHoursByDate.get(date) || 0;

    if (existingHours + hours > MAX_HOURS_PER_DAY) {
      failures.push(buildHoursExceededFailure(date, existingHours, hours));
      return;
    }

    validDates.push(date);
  });

  return {
    validDates,
    failures,
  };
};

const buildFailedDatesResponse = (failures, invalidDates = []) => ({
  failedDates: failures,
  invalidDates,
});

export const createLog = async (req, res) => {
  try {
    const { date, dates, projectId, employeeId, hours } = req.body;
    const validation = await validateLogPayload({ date, dates, projectId, employeeId, hours });

    if (!validation.payload) {
      return res.status(validation.status).json({
        message: validation.message,
        invalidDates: validation.invalidDates || [],
      });
    }

    const { dates: requestedDates, ...sharedPayload } = validation.payload;
    const { validDates, failures } = await validateDateCapacity({
      dates: requestedDates,
      employeeId: sharedPayload.employeeId,
      hours: sharedPayload.hours,
    });

    if (!validDates.length) {
      return res.status(400).json({
        message: "No work logs were created because one or more selected dates exceed 8 hours.",
        ...buildFailedDatesResponse(failures),
      });
    }

    const createdLogs = await sequelize.transaction(async (transaction) => {
      const createdIds = [];

      for (const requestedDate of validDates) {
        const log = await WorkLog.create(
          {
            ...sharedPayload,
            date: requestedDate,
          },
          { transaction }
        );
        createdIds.push(log.id);
      }

      return getLogsWithRelations(createdIds, transaction);
    });

    const requestedMultipleDates = Array.isArray(dates) && dates.length > 1;

    if (!requestedMultipleDates && createdLogs.length === 1 && failures.length === 0) {
      return res.status(201).json(createdLogs[0]);
    }

    const createdCount = createdLogs.length;
    const skippedCount = failures.length;

    return res.status(201).json({
      message:
        skippedCount > 0
          ? `Created ${createdCount} work log entries. ${skippedCount} selected date(s) were skipped.`
          : `Created ${createdCount} work log entr${createdCount === 1 ? "y" : "ies"}.`,
      createdCount,
      logs: createdLogs,
      failedDates: failures,
    });
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
      return res.status(validation.status).json({
        message: validation.message,
        invalidDates: validation.invalidDates || [],
      });
    }

    const { dates: requestedDates, ...sharedPayload } = validation.payload;
    const requestedDate = requestedDates[0];
    const { failures } = await validateDateCapacity({
      dates: [requestedDate],
      employeeId: sharedPayload.employeeId,
      hours: sharedPayload.hours,
      excludeLogId: log.id,
    });

    if (failures.length) {
      return res.status(400).json({
        message: failures[0].message,
        ...buildFailedDatesResponse(failures),
      });
    }

    await log.update({
      ...sharedPayload,
      date: requestedDate,
    });
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
