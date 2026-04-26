import { Op } from "sequelize";
import { Employee, Project, WorkLog } from "../models/index.js";

export const fetchRawLogs = async ({ fromDate, toDate, projectId, employeeId }) => {
  const where = {
    date: {
      [Op.between]: [fromDate, toDate],
    },
  };

  if (projectId) {
    where.projectId = projectId;
  }

  if (employeeId) {
    where.employeeId = employeeId;
  }

  return WorkLog.findAll({
    where,
    include: [
      {
        model: Employee,
        attributes: ["id", "name"],
      },
      {
        model: Project,
        attributes: ["id", "name"],
      },
    ],
    order: [
      [{ model: Project }, "name", "ASC"],
      ["date", "ASC"],
      [{ model: Employee }, "name", "ASC"],
    ],
  });
};

export const buildReportData = (logs) => {
  const projectMap = new Map();

  logs.forEach((log) => {
    const projectId = log.projectId;
    const employeeId = log.employeeId;
    const projectName = log.Project?.name || "Unknown Project";
    const employeeName = log.Employee?.name || "Unknown Employee";
    const hours = Number(log.hours);

    if (!projectMap.has(projectId)) {
      projectMap.set(projectId, {
        projectId,
        projectName,
        totalProjectHours: 0,
        employees: new Map(),
      });
    }

    const projectEntry = projectMap.get(projectId);
    projectEntry.totalProjectHours += hours;

    if (!projectEntry.employees.has(employeeId)) {
      projectEntry.employees.set(employeeId, {
        employeeId,
        employeeName,
        totalHours: 0,
      });
    }

    projectEntry.employees.get(employeeId).totalHours += hours;
  });

  const projects = Array.from(projectMap.values()).map((project) => {
    const employees = Array.from(project.employees.values()).map((employee) => ({
      ...employee,
      totalHours: Number(employee.totalHours.toFixed(2)),
      percentage: Number(
        ((employee.totalHours / project.totalProjectHours) * 100 || 0).toFixed(2)
      ),
    }));

    return {
      projectId: project.projectId,
      projectName: project.projectName,
      totalProjectHours: Number(project.totalProjectHours.toFixed(2)),
      employees,
    };
  });

  const employeeContributions = projects.flatMap((project) =>
    project.employees.map((employee) => ({
      id: `${project.projectId}-${employee.employeeId}`,
      projectId: project.projectId,
      projectName: project.projectName,
      totalProjectHours: project.totalProjectHours,
      employeeId: employee.employeeId,
      employeeName: employee.employeeName,
      employeeHours: employee.totalHours,
      percentage: employee.percentage,
    }))
  );

  const totalHours = Number(
    projects.reduce((sum, project) => sum + project.totalProjectHours, 0).toFixed(2)
  );

  return {
    projects,
    employeeContributions,
    summary: {
      totalProjects: projects.length,
      totalEmployees: new Set(employeeContributions.map((row) => row.employeeId)).size,
      totalLogs: logs.length,
      totalHours,
    },
  };
};
