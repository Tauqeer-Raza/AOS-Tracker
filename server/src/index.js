import app from "./app.js";
import { sequelize } from "./config/db.js";
import { env } from "./config/env.js";
import "./models/index.js";
import { seedIfEmpty } from "./services/seedService.js";

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    if (env.autoSeed) {
      const seeded = await seedIfEmpty();
      if (seeded) {
        console.log(
          `Imported seed workbook: ${seeded.workLogs} logs, ${seeded.employees} employees, ${seeded.projects} projects`
        );
      }
    }

    app.listen(env.port, () => {
      console.log(`Server running on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
