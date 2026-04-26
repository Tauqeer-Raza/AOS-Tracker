import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { sequelize } from "../config/db.js";
import { env } from "../config/env.js";
import { Employee, Project, WorkLog } from "../models/index.js";

const normalizeName = (value) => String(value || "").trim();

const toDateOnly = (value) => {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return value.toISOString().split("T")[0];
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);

    if (!parsed) {
      return null;
    }

    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d))
      .toISOString()
      .split("T")[0];
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().split("T")[0];
};

const resolveSeedFilePath = () => path.resolve(process.cwd(), env.seedFilePath);
const seedFileExists = () => fs.existsSync(resolveSeedFilePath());

const getSheetRows = (workbook, sheetName) => {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Required sheet "${sheetName}" not found in seed workbook.`);
  }

  return XLSX.utils.sheet_to_json(sheet, {
    defval: "",
    raw: false,
    cellDates: true,
  });
};

const readWorkbookData = (filePath) => {
  const workbook = XLSX.readFile(filePath, {
    cellDates: true,
  });

  const employeeRows = getSheetRows(workbook, "Employees");
  const projectRows = getSheetRows(workbook, "Projects");
  const workLogRows = getSheetRows(workbook, "Work Logs");

  const employeeNames = new Set(
    employeeRows
      .map((row) => normalizeName(row["Employee Name"]))
      .filter(Boolean)
  );

  const projectNames = new Set(
    projectRows
      .map((row) => normalizeName(row["Project Name"]))
      .filter(Boolean)
  );

  const normalizedLogs = workLogRows
    .map((row, index) => {
      const date = toDateOnly(row.Date);
      const projectName = normalizeName(row.Project);
      const employeeName = normalizeName(row["Employee Name"]);
      const hours = Number(row["Working Hours"]);

      if (!date || !projectName || !employeeName || !Number.isFinite(hours)) {
        throw new Error(`Invalid row found in "Work Logs" at data row ${index + 2}.`);
      }

      employeeNames.add(employeeName);
      projectNames.add(projectName);

      return {
        date,
        projectName,
        employeeName,
        hours,
      };
    })
    .filter((row) => row.hours > 0);

  return {
    employeeNames: Array.from(employeeNames).sort((left, right) =>
      left.localeCompare(right)
    ),
    projectNames: Array.from(projectNames).sort((left, right) =>
      left.localeCompare(right)
    ),
    workLogs: normalizedLogs,
  };
};

export const importSeedWorkbook = async ({ clearExisting = true } = {}) => {
  const filePath = resolveSeedFilePath();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Seed workbook not found at ${filePath}`);
  }

  const workbookData = readWorkbookData(filePath);

  return sequelize.transaction(async (transaction) => {
    if (clearExisting) {
      // Use ordered deletes instead of TRUNCATE so Postgres does not reject
      // referenced tables during Render auto-seed.
      await WorkLog.destroy({ where: {}, force: true, transaction });
      await Employee.destroy({ where: {}, force: true, transaction });
      await Project.destroy({ where: {}, force: true, transaction });
    }

    const employees = await Employee.bulkCreate(
      workbookData.employeeNames.map((name) => ({ name })),
      { transaction, returning: true }
    );

    const projects = await Project.bulkCreate(
      workbookData.projectNames.map((name) => ({ name })),
      { transaction, returning: true }
    );

    const employeeMap = new Map(employees.map((employee) => [employee.name, employee.id]));
    const projectMap = new Map(projects.map((project) => [project.name, project.id]));

    const workLogs = workbookData.workLogs.map((log) => ({
      date: log.date,
      employeeId: employeeMap.get(log.employeeName),
      projectId: projectMap.get(log.projectName),
      hours: log.hours,
    }));

    await WorkLog.bulkCreate(workLogs, { transaction });

    return {
      filePath,
      employees: employees.length,
      projects: projects.length,
      workLogs: workLogs.length,
    };
  });
};

export const seedIfEmpty = async () => {
  const [employeeCount, projectCount, logCount] = await Promise.all([
    Employee.count(),
    Project.count(),
    WorkLog.count(),
  ]);

  if (employeeCount || projectCount || logCount) {
    return null;
  }

  if (!seedFileExists()) {
    return null;
  }

  return importSeedWorkbook({ clearExisting: true });
};
