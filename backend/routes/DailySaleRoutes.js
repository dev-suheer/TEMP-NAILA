import express from "express";
import { verifyUser } from "../middleware/Auth.js";
import {
  cashOutForBranch,
  getDailySaleById,
  getDailySaleHistoryForBranch,
  getTodaysdailySaleforBranch,
} from "../controllers/DailySaleController.js";

const dailySaleRouter = express.Router();

dailySaleRouter.post(
  "/getTodaysdailySaleforBranch",
  verifyUser,
  getTodaysdailySaleforBranch
);
dailySaleRouter.post(
  "/getDailySaleHistoryForBranch",
  verifyUser,
  getDailySaleHistoryForBranch
);
dailySaleRouter.post("/getDailySaleById", verifyUser, getDailySaleById);
dailySaleRouter.post("/cashOutForBranch", verifyUser, cashOutForBranch);

export default dailySaleRouter;
