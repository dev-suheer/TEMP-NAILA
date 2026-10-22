import express from "express";
import { superAdminAndAdminOnly, verifyUser } from "../../middleware/Auth.js";
import {
  addAccesoriesInStock,
  getAllAccesoriesInStock,
  updateAllAccesoriesInStock,
} from "../../controllers/Stock/AccessoriesController.js";

const accessoriesRouter = express.Router();

accessoriesRouter.post(
  "/addAccesoriesInStock",
  superAdminAndAdminOnly,
  addAccesoriesInStock
);
accessoriesRouter.post(
  "/getAllAccesoriesInStock",
  verifyUser,
  getAllAccesoriesInStock
);
accessoriesRouter.post(
  "/updateAllAccesoriesInStock",
  verifyUser,
  updateAllAccesoriesInStock
);

export default accessoriesRouter;
