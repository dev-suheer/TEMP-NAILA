import express from "express";
import { superAdminOnly, verifyUser } from "../middleware/Auth.js";
import {
  approveOrRejectStock,
  approveOrRejectReturnedStock,
  assignStockToBranch,
  createBranch,
  deleteBranch,
  getAllBranches,
  getAllBranchStockHistory,
  getAllSuitsStockForBranch,
  getBranchCashoutHistory,
  getPendingStockForBranch,
  getPendingReturnedStock,
  getSuitsStockToGenerateBill,
  returnStockToMain,
  updateBranch,
} from "../controllers/Branch.Controller.js";

const branchRouter = express.Router();

branchRouter.post("/createBranch", superAdminOnly, createBranch);
branchRouter.post("/updateBranch", superAdminOnly, updateBranch);
branchRouter.post("/deleteBranch", superAdminOnly, deleteBranch);
branchRouter.post("/getAllBranches", verifyUser, getAllBranches);
branchRouter.post("/getBranchCashoutHistory", verifyUser, getBranchCashoutHistory);

//STOCK
branchRouter.post("/assignStockToBranch", superAdminOnly, assignStockToBranch);
branchRouter.post("/getAllBranchStockHistory", superAdminOnly, getAllBranchStockHistory);
branchRouter.post("/getAllSuitsStockForBranch", verifyUser, getAllSuitsStockForBranch);
branchRouter.post("/approveOrRejectStock", verifyUser, approveOrRejectStock);
branchRouter.post("/returnStockToMain", verifyUser, returnStockToMain);
branchRouter.post("/approveOrRejectReturnedStock", superAdminOnly, approveOrRejectReturnedStock);
branchRouter.post("/getPendingStockForBranch", verifyUser, getPendingStockForBranch);
branchRouter.post("/getPendingReturnedStock", superAdminOnly, getPendingReturnedStock);
branchRouter.post("/getSuitsStockToGenerateBill", verifyUser, getSuitsStockToGenerateBill);



export default branchRouter;
