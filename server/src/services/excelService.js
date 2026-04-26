import ExcelJS from "exceljs";

const styleHeader = (row) => {
  row.font = { bold: true, color: { argb: "FFFFFFFF" } };
  row.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF002CCE" },
  };
  row.alignment = { vertical: "middle", horizontal: "center" };
};

const addMetadataRows = (sheet, title, filters) => {
  sheet.addRow([title]);
  sheet.addRow([`From Date: ${filters.fromDate}`]);
  sheet.addRow([`To Date: ${filters.toDate}`]);
  sheet.addRow([
    `Project Filter: ${filters.projectId || "All"} | Employee Filter: ${
      filters.employeeId || "All"
    }`,
  ]);
  sheet.addRow([]);
  const titleRow = sheet.getRow(1);
  titleRow.font = { bold: true, size: 14, color: { argb: "FF002CCE" } };
  return 6;
};

const applySheetFormatting = (sheet, headerRowNumber, columnCount) => {
  styleHeader(sheet.getRow(headerRowNumber));
  sheet.views = [{ state: "frozen", ySplit: headerRowNumber }];
  sheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: columnCount },
  };

  sheet.columns.forEach((column, index) => {
    let maxLength = String(sheet.getRow(headerRowNumber).getCell(index + 1).value || "").length;

    column.eachCell({ includeEmpty: true }, (cell) => {
      const value = cell.value == null ? "" : String(cell.value);
      maxLength = Math.max(maxLength, value.length);
    });

    column.width = Math.min(Math.max(maxLength + 3, 16), 36);
  });
};

export const buildWorkbook = async ({ reportData, filters }) => {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "AOS Employee Proportion Tracker";
  workbook.created = new Date();

  const dateRangeLabel = `${filters.fromDate} to ${filters.toDate}`;

  const projectSheet = workbook.addWorksheet("Project wise breakdown");
  const projectHeaderRow = addMetadataRows(
    projectSheet,
    "Project wise breakdown",
    filters
  );
  projectSheet.columns = [
    { key: "projectName", width: 28 },
    { key: "totalProjectHours", width: 20 },
    { key: "employeeName", width: 28 },
    { key: "employeeHours", width: 18 },
    { key: "percentage", width: 28 },
  ];
  projectSheet.getRow(projectHeaderRow).values = [
    "Project Name",
    "Total Project Hours",
    "Employee Name",
    "Employee Hours",
    "Employee Contribution Percentage",
  ];

  reportData.projects.forEach((project) => {
    project.employees.forEach((employee) => {
      const row = projectSheet.addRow({
        projectName: project.projectName,
        totalProjectHours: project.totalProjectHours,
        employeeName: employee.employeeName,
        employeeHours: employee.totalHours,
        percentage: employee.percentage / 100,
      });

      row.getCell("percentage").numFmt = "0.00%";
    });

    projectSheet.addRow({});
  });

  const employeeSheet = workbook.addWorksheet("Employee contribution by project");
  const employeeHeaderRow = addMetadataRows(
    employeeSheet,
    "Employee contribution by project",
    filters
  );
  employeeSheet.columns = [
    { key: "employeeName", width: 28 },
    { key: "projectName", width: 28 },
    { key: "hours", width: 16 },
    { key: "percentage", width: 34 },
    { key: "dateRange", width: 26 },
  ];
  employeeSheet.getRow(employeeHeaderRow).values = [
    "Employee Name",
    "Project Name",
    "Hours Worked",
    "Contribution Percentage within Project",
    "Date Range Used",
  ];

  reportData.employeeContributions.forEach((rowData) => {
    const row = employeeSheet.addRow({
      employeeName: rowData.employeeName,
      projectName: rowData.projectName,
      hours: rowData.employeeHours,
      percentage: rowData.percentage / 100,
      dateRange: dateRangeLabel,
    });

    row.getCell("percentage").numFmt = "0.00%";
  });

  applySheetFormatting(projectSheet, projectHeaderRow, 5);
  applySheetFormatting(employeeSheet, employeeHeaderRow, 5);

  return workbook;
};
