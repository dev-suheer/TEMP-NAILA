import express from "express";
import { superAdminOnly, verifyUser } from "../middleware/Auth.js";
import {
  applyDiscountOnBuyersAccount,
  deleteBuyerBill,
  generateBillForOldbuyer,
  generateBuyersBillandAddBuyer,
  generatePdfFunction,
  getBuyerBillDetails,
  getBuyerBillHistoryForBranch,
  getBuyerById,
  getBuyersForBranch,
  getReturnableBillsForBuyer,
  searchBuyersForBill,
  validateAndGetOldBuyerData,
  validateD_NoAndGetSuitData,
} from "../controllers/BuyersController.js";

const buyerRouter = express.Router();

buyerRouter.post(
  "/generateBuyersBillandAddBuyer",
  verifyUser,
  generateBuyersBillandAddBuyer
);
buyerRouter.post("/getBuyersForBranch", verifyUser, getBuyersForBranch);
buyerRouter.get("/searchBuyersForBill", verifyUser, searchBuyersForBill);
buyerRouter.post("/getBuyerById", verifyUser, getBuyerById);
buyerRouter.post("/getBuyerBillDetails", verifyUser, getBuyerBillDetails);
buyerRouter.post(
  "/getReturnableBillsForBuyer",
  verifyUser,
  getReturnableBillsForBuyer
);
buyerRouter.post(
  "/validateD_NoAndGetSuitData",
  verifyUser,
  validateD_NoAndGetSuitData
);
buyerRouter.post(
  "/validateAndGetOldBuyerData",
  verifyUser,
  validateAndGetOldBuyerData
);
buyerRouter.post(
  "/generateBillForOldbuyer",
  verifyUser,
  generateBillForOldbuyer
);
buyerRouter.post("/generatePdfFunction", verifyUser, generatePdfFunction);
buyerRouter.post(
  "/getBuyerBillHistoryForBranch",
  verifyUser,
  getBuyerBillHistoryForBranch
);
buyerRouter.post(
  "/deleteBuyerBill/:billId",
  superAdminOnly,
  deleteBuyerBill
);
buyerRouter.post(
  "/applyDiscountOnBuyersAccount",
  verifyUser,
  applyDiscountOnBuyersAccount
);



export default buyerRouter;
