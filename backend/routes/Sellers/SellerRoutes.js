import express from "express";
import {
  addInStockAndGeneraeSellerData_NEW,
  addInStockAndGeneraeSellerData_OLD,
  applyDiscountOnSellerAccount,
  deleteSellerBillAndReverseStock,
  getAllPurchasingHistory,
  getAllSellersForPurchasing,
  getSelleForPurchasingById,
  validateAndGetOldSellerData,
} from "../../controllers/sellers/SellersController.js";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";


const sellerRouter = express.Router();

sellerRouter.post("/addInStockAndGeneraeSellerData_NEW", superAdminAndAdminOnly, addInStockAndGeneraeSellerData_NEW);
sellerRouter.post("/getAllSellersForPurchasing", superAdminAndAdminOnly, getAllSellersForPurchasing);
sellerRouter.post("/getSelleForPurchasingById", superAdminAndAdminOnly, getSelleForPurchasingById);
sellerRouter.post("/validateAndGetOldSellerData", superAdminAndAdminOnly, validateAndGetOldSellerData);
sellerRouter.post("/addInStockAndGeneraeSellerData_OLD", superAdminAndAdminOnly, addInStockAndGeneraeSellerData_OLD);
sellerRouter.post("/getAllPurchasingHistory", superAdminAndAdminOnly, getAllPurchasingHistory);
sellerRouter.post("/deleteSellerBillAndReverseStock", superAdminAndAdminOnly, deleteSellerBillAndReverseStock);
sellerRouter.post("/applyDiscountOnSellerAccount", superAdminAndAdminOnly, applyDiscountOnSellerAccount);

export default sellerRouter;
