import { DataTypes } from "sequelize";
import { sequelize } from "../config/db.js";

export const WorkLog = sequelize.define(
  "WorkLog",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    hours: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
      },
    },
    employeeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "employee_id",
    },
    projectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "project_id",
    },
  },
  {
    tableName: "work_logs",
    timestamps: true,
    updatedAt: false,
  }
);
