import { Router } from "express";
import { exportReport } from "../controllers/reportController.js";

const router = Router();

router.get("/", exportReport);

export default router;
