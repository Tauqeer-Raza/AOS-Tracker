import { sequelize } from "../config/db.js";
import { env } from "../config/env.js";
import "../models/index.js";
import { seedIfEmpty } from "../services/seedService.js";

const run = async () => {
  try {
    await sequelize.authenticate();

    if (env.syncDatabase) {
      await sequelize.sync();
      console.log("Database schema synchronized.");
    } else {
      console.log("Database synchronization skipped.");
    }

    if (env.autoSeed) {
      const result = await seedIfEmpty();
      if (result) {
        console.log(
          `Seeded from workbook: ${result.workLogs} logs, ${result.employees} employees, ${result.projects} projects`
        );
      } else {
        console.log("Auto-seed skipped.");
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("Database preparation failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
};

run();
