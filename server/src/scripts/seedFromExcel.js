import { sequelize } from "../config/db.js";
import "../models/index.js";
import { importSeedWorkbook } from "../services/seedService.js";

const run = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const result = await importSeedWorkbook({ clearExisting: true });

    console.log(
      `Excel import complete from ${result.filePath}\nEmployees: ${result.employees}\nProjects: ${result.projects}\nWork Logs: ${result.workLogs}`
    );

    process.exit(0);
  } catch (error) {
    console.error("Excel import failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close().catch(() => {});
  }
};

run();
