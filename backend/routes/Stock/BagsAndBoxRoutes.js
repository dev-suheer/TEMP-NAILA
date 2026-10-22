import express from "express";
import { superAdminAndAdminOnly, verifyUser } from "../../middleware/Auth.js";
import { addBagsAndBoxInStock, getAllBagsAndBox } from "../../controllers/Stock/BagsAndBoxController.js";


const bagsAndBoxRouter = express.Router();

bagsAndBoxRouter.post("/addBagsAndBoxInStock", superAdminAndAdminOnly, addBagsAndBoxInStock);
bagsAndBoxRouter.post("/getAllBagsAndBox", verifyUser, getAllBagsAndBox);

export default bagsAndBoxRouter;
