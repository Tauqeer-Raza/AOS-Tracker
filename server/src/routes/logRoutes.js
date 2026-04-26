import { Router } from "express";
import {
  createLog,
  deleteLog,
  getLogsByDate,
  updateLog,
} from "../controllers/logController.js";

const router = Router();

router.post("/", createLog);
router.get("/", getLogsByDate);
router.put("/:id", updateLog);
router.delete("/:id", deleteLog);

export default router;
