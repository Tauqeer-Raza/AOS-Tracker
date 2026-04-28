import { Employee } from "../models/index.js";
import { buildWorkbook } from "../services/excelService.js";
import {
  buildEmployeeContributionReport,
  buildReportData,
  fetchRawLogs,
} from "../services/reportService.js";
import { normalizeDateRange } from "../utils/date.js";
import { sendError } from "../utils/http.js";

export const getFilters = (query) => {
  if (query.allData === "true") {
    return {
      fromDate: "2000-01-01",
      toDate: "2999-12-31",
      projectId: query.projectId || "",
      employeeId: query.employeeId || "",
    };
  }

  const { fromDate, toDate } = normalizeDateRange(query.fromDate, query.toDate);

  return {
    fromDate,
    toDate,
    projectId: query.projectId || "",
    employeeId: query.employeeId || "",
  };
};

export const getEmployeeContribution = async (req, res) => {
  try {
    const employeeId = Number(req.params.employeeId);

    if (!Number.isInteger(employeeId) || employeeId <= 0) {
      return res.status(400).json({ message: "A valid employee ID is required" });
    }

    const employee = await Employee.findByPk(employeeId);

    if (!employee) {
      return res.status(404).json({ message: "Employee not found" });
    }

    const filters = getFilters(req.query);
    const rawLogs = await fetchRawLogs(filters);
    const contributionReport = buildEmployeeContributionReport(rawLogs, employeeId, employee.name);

    return res.json(contributionReport);
  } catch (error) {
    return sendError(res, error, "Failed to generate employee contribution report");
  }
};

export const getReport = async (req, res) => {
  try {
    const filters = getFilters(req.query);
    const rawLogs = await fetchRawLogs(filters);
    const report = buildReportData(rawLogs);

    return res.json({
      filters,
      ...report,
    });
  } catch (error) {
    return sendError(res, error, "Failed to generate report");
  }
};

export const exportReport = async (req, res) => {
  try {
    const filters = getFilters(req.query);
    const rawLogs = await fetchRawLogs(filters);
    const reportData = buildReportData(rawLogs);
    const workbook = await buildWorkbook({ reportData, filters });
    const buffer = await workbook.xlsx.writeBuffer();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="aos-report-${filters.fromDate}-to-${filters.toDate}.xlsx"`
    );

    return res.send(Buffer.from(buffer));
  } catch (error) {
    return sendError(res, error, "Failed to export report");
  }
};
