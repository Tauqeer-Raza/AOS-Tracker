import dotenv from "dotenv";

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT) || 5000,
  databaseUrl: process.env.DATABASE_URL || "",
  dbDialect: process.env.DB_DIALECT || "postgres",
  dbHost: process.env.DB_HOST || "localhost",
  dbPort: Number(process.env.DB_PORT) || 5432,
  dbName: process.env.DB_NAME || "aos_tracker",
  dbUser: process.env.DB_USER || "postgres",
  dbPassword: process.env.DB_PASSWORD || "",
  dbSsl: process.env.DB_SSL === "true",
  dbStorage: process.env.DB_STORAGE || "./data/aos-tracker.sqlite",
  syncDatabase: process.env.SYNC_DATABASE !== "false",
  autoSeed: process.env.AUTO_SEED === "true",
  forceSeed: process.env.FORCE_SEED === "true",
  frontendDist: process.env.FRONTEND_DIST || "client/dist",
  seedFilePath:
    process.env.SEED_FILE_PATH ||
    "./data/AOS_Sample_Dataset_v3_Max_4_Projects(1).xlsx",
};
