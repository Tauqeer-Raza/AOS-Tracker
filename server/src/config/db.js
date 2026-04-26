import { Sequelize } from "sequelize";
import { env } from "./env.js";
import fs from "fs";
import path from "path";

const sharedOptions = {
  logging: false,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
};

const createSequelize = () => {
  if (env.dbDialect === "sqlite") {
    const storagePath = path.resolve(process.cwd(), env.dbStorage);
    fs.mkdirSync(path.dirname(storagePath), { recursive: true });

    return new Sequelize({
      dialect: "sqlite",
      storage: storagePath,
      ...sharedOptions,
    });
  }

  if (env.databaseUrl) {
    return new Sequelize(env.databaseUrl, {
      dialect: "postgres",
      dialectOptions: env.dbSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
      ...sharedOptions,
    });
  }

  return new Sequelize(env.dbName, env.dbUser, env.dbPassword, {
    host: env.dbHost,
    port: env.dbPort,
    dialect: env.dbDialect,
    dialectOptions:
      env.dbDialect === "postgres" && env.dbSsl
        ? {
            ssl: {
              require: true,
              rejectUnauthorized: false,
            },
          }
        : {},
    ...sharedOptions,
  });
};

export const sequelize = createSequelize();
