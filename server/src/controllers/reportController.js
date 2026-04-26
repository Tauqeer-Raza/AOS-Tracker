import { buildWorkbook } from "../services/excelService.js";
import { buildReportData, fetchRawLogs } from "../services/reportService.js";
import { normalizeDateRange } from "../utils/date.js";
import { sendError } from "../utils/http.js";

const getFilters = (query) => {
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
