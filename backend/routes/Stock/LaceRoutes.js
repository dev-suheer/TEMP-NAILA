
import express from "express";
import { superAdminAndAdminOnly,verifyUser } from "../../middleware/Auth.js";
import { addLaceInStock, getAllLaceForEmbroidery, getAllLaceStock } from "../../controllers/Stock/LaceController.js";


const laceRouter = express.Router();

laceRouter.post("/addLaceInStock",superAdminAndAdminOnly, addLaceInStock);
laceRouter.post("/getAllLaceStock",verifyUser, getAllLaceStock);
laceRouter.post("/getAllLaceForEmbroidery",verifyUser, getAllLaceForEmbroidery);

export default laceRouter;
