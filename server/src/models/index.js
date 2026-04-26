import { Employee } from "./Employee.js";
import { Project } from "./Project.js";
import { WorkLog } from "./WorkLog.js";

Employee.hasMany(WorkLog, {
  foreignKey: { name: "employeeId", field: "employee_id" },
  onDelete: "CASCADE",
});
Project.hasMany(WorkLog, {
  foreignKey: { name: "projectId", field: "project_id" },
  onDelete: "CASCADE",
});
WorkLog.belongsTo(Employee, { foreignKey: { name: "employeeId", field: "employee_id" } });
WorkLog.belongsTo(Project, { foreignKey: { name: "projectId", field: "project_id" } });

export { Employee, Project, WorkLog };
