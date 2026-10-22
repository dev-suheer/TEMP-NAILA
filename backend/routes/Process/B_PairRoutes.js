import express from "express";
import { superAdminAndAdminOnly, verifyUser } from "../../middleware/Auth.js";
import {
  exchangeBPairBill,
  getAllBPairs,
  getBPairStockForBill,
  getOrderProcessParties,
} from "../../controllers/Process/B_PairController.js";

const b_PairRouter = express.Router();

b_PairRouter.post("/getAllBPairs", superAdminAndAdminOnly, getAllBPairs);
b_PairRouter.post("/getOrderProcessParties", superAdminAndAdminOnly, getOrderProcessParties);
b_PairRouter.post("/getBPairStockForBill", verifyUser, getBPairStockForBill);
b_PairRouter.post("/exchangeBPairBill", verifyUser, exchangeBPairBill);

export default b_PairRouter;
