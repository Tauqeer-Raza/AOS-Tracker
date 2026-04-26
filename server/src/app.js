import cors from "cors";
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { env } from "./config/env.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import exportRoutes from "./routes/exportRoutes.js";
import logRoutes from "./routes/logRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const frontendDistCandidates = [
  path.resolve(process.cwd(), env.frontendDist),
  path.resolve(process.cwd(), "..", env.frontendDist),
  path.resolve(__dirname, "..", "..", env.frontendDist),
];

const frontendDistPath =
  frontendDistCandidates.find((candidate) => fs.existsSync(candidate)) || frontendDistCandidates[0];
const frontendIndexPath = path.join(frontendDistPath, "index.html");

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ message: "AOS API is running" });
});

app.use("/api/employees", employeeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/export", exportRoutes);

if (fs.existsSync(frontendIndexPath)) {
  app.use(express.static(frontendDistPath));

  app.get("/", (_req, res) => {
    return res.sendFile(frontendIndexPath);
  });

  app.get(/^\/(?!api).*/, (req, res, next) => {
    if (req.path.startsWith("/api")) {
      return next();
    }

    return res.sendFile(frontendIndexPath);
  });
}

export default app;
