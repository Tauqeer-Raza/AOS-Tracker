import { Router } from "express";
import {
  createEmployee,
  deleteEmployee,
  getEmployees,
} from "../controllers/employeeController.js";

const router = Router();

router.get("/", getEmployees);
router.post("/", createEmployee);
router.delete("/:id", deleteEmployee);

export default router;
