import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  deletePacking,
  getAllPackings,
  getOrderPackingProgress,
  getPackingProgress,
} from "../../controllers/Process/PackingController.js";

const packingRouter = express.Router();

packingRouter.post("/getAllPackings", superAdminAndAdminOnly, getAllPackings);
packingRouter.post("/deletePacking", superAdminAndAdminOnly, deletePacking);
packingRouter.post("/getPackingProgress", superAdminAndAdminOnly, getPackingProgress);
packingRouter.post("/getOrderPackingProgress", superAdminAndAdminOnly, getOrderPackingProgress);

export default packingRouter;
