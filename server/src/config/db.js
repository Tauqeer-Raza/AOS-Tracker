import { Sequelize } from "sequelize";
import { env } from "./env.js";
import fs from "fs";
import path from "path";

const createSequelize = () => {
  if (env.dbDialect === "sqlite") {
    const storagePath = path.resolve(process.cwd(), env.dbStorage);
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });

    return new Sequelize({
      dialect: "sqlite",
      storage: storagePath,
      logging: false,
    });
  }

  return new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    port: env.dbPort,
    dialect: env.dbDialect,
    logging: false,
  });
};

export const sequelize = createSequelize();
