import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  addInStockFromPackaging,
  addStitching,
  deleteStitching,
  getAllStitching,
  getStitchingByEmbroideryId,
  getStitchingById,
  getStitchingDataBypartyName,
  updateStitching,
} from "../../controllers/Process/StitchingController.js";

const stitchingRouter = express.Router();

stitchingRouter.post("/addStitching", superAdminAndAdminOnly, addStitching);
stitchingRouter.post("/deleteStitching", superAdminAndAdminOnly, deleteStitching);
stitchingRouter.post(
  "/getAllStitching",
  superAdminAndAdminOnly,
  getAllStitching
);
stitchingRouter.post(
  "/getStitchingById",
  superAdminAndAdminOnly,
  getStitchingById
);
stitchingRouter.post(
  "/getStitchingByEmbroideryId",
  superAdminAndAdminOnly,
  getStitchingByEmbroideryId
);
stitchingRouter.post(
  "/updateStitching",
  superAdminAndAdminOnly,
  updateStitching
);
stitchingRouter.post(
  "/getStitchingDataBypartyName",
  superAdminAndAdminOnly,
  getStitchingDataBypartyName
);
stitchingRouter.post(
  "/addInStockFromPackaging",
  superAdminAndAdminOnly,
  addInStockFromPackaging
);

export default stitchingRouter;
