import express from "express";
import {
  superAdminOnly,
  verifyOtp,
  verifyUser,
} from "../../middleware/Auth.js";
import {
  getAccountsStats,
  getDashBoardDataForBranch,
  getDashBoardDataForSuperAdmin,
  getSalesData,
  getTransactionsHistory,
  makeTransactionInAccounts,
  sendDashBoardAccessOTP,
  verifyOtpForDasboardData,
} from "../../controllers/Dashboard Data/DashboardDataController.js";

const dashboardRouter = express.Router();

dashboardRouter.post(
  "/getDashBoardDataForBranch",
  verifyUser,
  verifyOtp,
  getDashBoardDataForBranch
);

dashboardRouter.get(
  "/getDashBoardDataForSuperAdmin",
  verifyUser,
  verifyOtp,
  getDashBoardDataForSuperAdmin
);

dashboardRouter.post(
  "/sendDashBoardAccessOTP",
  verifyUser,
  sendDashBoardAccessOTP
);

dashboardRouter.post(
  "/verifyOtpForDasboardData",
  verifyUser,
  verifyOtpForDasboardData
);

dashboardRouter.post(
  "/makeTransactionInAccounts",
  superAdminOnly,
  makeTransactionInAccounts
);

dashboardRouter.post(
  "/getTransactionsHistory",
  superAdminOnly,
  getTransactionsHistory
);

dashboardRouter.get("/getSalesData", verifyUser, getSalesData);

dashboardRouter.get(
  "/getAccountsStats",
  superAdminOnly,
  getAccountsStats
);



export default dashboardRouter;
