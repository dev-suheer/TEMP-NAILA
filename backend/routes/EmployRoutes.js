import express from "express";
import { superAdminOnly } from "../middleware/Auth.js";
import {
  addEmploye,
  calculateSalary,
  creditDebitBalance,
  creditSalaryForSingleEmploye,
  deleteCreditDebitEntry,
  getAllActiveEmploye,
  getAllPastEmploye,
  getAttendencedata,
  getEmployeDataById,
  reverseSalary,
  updateBulkAttendanceData,
  updateAttendanceData,
  updateEmploye,
  updateOvertime,
} from "../controllers/EmployController.js";

const employRouter = express.Router();

employRouter.post("/addEmploye", superAdminOnly, addEmploye);
employRouter.post("/creditDebitBalance", superAdminOnly, creditDebitBalance);
employRouter.post(
  "/creditSalaryForSingleEmploye",
  superAdminOnly,
  creditSalaryForSingleEmploye
);
employRouter.post("/updateEmploye", superAdminOnly, updateEmploye);
employRouter.post("/getEmployeDataById", superAdminOnly, getEmployeDataById);
employRouter.post("/getAllActiveEmploye", superAdminOnly, getAllActiveEmploye);
employRouter.post("/getAllPastEmploye", superAdminOnly, getAllPastEmploye);
employRouter.post("/updateOvertime", superAdminOnly, updateOvertime);
employRouter.post("/reverseSalary", superAdminOnly, reverseSalary);
employRouter.post("/deleteCreditDebitEntry/:employeId/:recordId", superAdminOnly, deleteCreditDebitEntry);
employRouter.post("/updateAttendanceData", superAdminOnly, updateAttendanceData);
employRouter.post("/updateBulkAttendanceData", superAdminOnly, updateBulkAttendanceData);
employRouter.get("/getAttendencedata", superAdminOnly, getAttendencedata);
employRouter.post("/calculateSalary", superAdminOnly, calculateSalary);



export default employRouter;
