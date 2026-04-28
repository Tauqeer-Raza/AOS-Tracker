import { Router } from "express";
import {
  exportReport,
  getEmployeeContribution,
  getReport,
} from "../controllers/reportController.js";

const router = Router();

router.get("/employee-contribution/:employeeId", getEmployeeContribution);
router.get("/", getReport);
router.get("/export", exportReport);

export default router;
