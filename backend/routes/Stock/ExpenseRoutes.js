import express from "express";
import {
  addExpense,
  createExpenseCategory,
  deleteExpense,
  getAllExpenseCategories,
  getAllExpenses,
  getExpenseStats,
  updateExpenseCategory,
} from "../../controllers/Stock/ExpenseController.js";
import { verifyUser, superAdminOnly } from "../../middleware/Auth.js";

const expenseRouter = express.Router();

expenseRouter.post("/addExpense", verifyUser, addExpense);
expenseRouter.post("/getAllExpenses", verifyUser, getAllExpenses);
expenseRouter.post("/deleteExpense", verifyUser, deleteExpense);
expenseRouter.post(
  "/createExpenseCategory",
  superAdminOnly,
  createExpenseCategory
);
expenseRouter.post(
  "/updateExpenseCategory",
  superAdminOnly,
  updateExpenseCategory
);
expenseRouter.post(
  "/getExpensesCategories",
  verifyUser,
  getAllExpenseCategories
);
expenseRouter.get(
  "/getExpenseStats",
  verifyUser,
  getExpenseStats
);

export default expenseRouter;
