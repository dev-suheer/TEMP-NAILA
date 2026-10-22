
import express from "express";
import { superAdminOnly, verifyUser } from "../../middleware/Auth.js";
import { createPaymentMethod, getAllPaymentMethodsForSuperAdmin, getAllPaymentMethodsForTransaction, updatePaymentMethod } from "../../controllers/paymentMethods/PaymentMethodController.js";


const paymentMethodRouter = express.Router();

paymentMethodRouter.post("/createPaymentMethod",superAdminOnly, createPaymentMethod);
paymentMethodRouter.get("/getAllPaymentMethodsForSuperAdmin",superAdminOnly, getAllPaymentMethodsForSuperAdmin);
paymentMethodRouter.get("/getAllPaymentMethodsForTransaction", getAllPaymentMethodsForTransaction);
paymentMethodRouter.put("/updatePaymentMethod/:id", updatePaymentMethod);


export default paymentMethodRouter;
