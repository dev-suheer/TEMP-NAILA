import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  addCutting,
  deleteCutting,
  getAllCutting,
  getCuttingByEmbroideryId,
  getCuttingById,
  getCuttingDataBypartyName,
  updateCutting,
} from "../../controllers/Process/CuttingControler.js";

const cuttingRouter = express.Router();

cuttingRouter.post("/addCutting", superAdminAndAdminOnly, addCutting);
cuttingRouter.post("/updateCutting", superAdminAndAdminOnly, updateCutting);
cuttingRouter.post("/deleteCutting", superAdminAndAdminOnly, deleteCutting);
cuttingRouter.post("/getAllCutting", superAdminAndAdminOnly, getAllCutting);
cuttingRouter.post(
  "/getCuttingByEmbroideryId",
  superAdminAndAdminOnly,
  getCuttingByEmbroideryId
);
cuttingRouter.post("/getCuttingById", superAdminAndAdminOnly, getCuttingById);
cuttingRouter.post(
  "/getCuttingDataBypartyName",
  superAdminAndAdminOnly,
  getCuttingDataBypartyName
);

export default cuttingRouter;
