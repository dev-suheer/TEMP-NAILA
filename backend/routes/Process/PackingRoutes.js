import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  deletePacking,
  getAllPackings,
} from "../../controllers/Process/PackingController.js";

const packingRouter = express.Router();

packingRouter.post("/getAllPackings", superAdminAndAdminOnly, getAllPackings);
packingRouter.post("/deletePacking", superAdminAndAdminOnly, deletePacking);

export default packingRouter;
