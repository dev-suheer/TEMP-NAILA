import express from "express";
import {
  addEmbriodery,
  deleteEmbroidery,
  getAllDesignNumbers,
  getAllEmbroidery,
  getEmbroideryById,
  getHeadDataByDesignNo,
  getProcessAnalytics,
  getProcessFiltersData,
  getPreviousDataBypartyName,
  replaceEmroideryData,
  updateEmbroidery,
  updateVerificationStatus,
} from "../../controllers/Process/EmbroideryController.js";
import {
  superAdminAndAdminOnly,
  superAdminOnly,
} from "../../middleware/Auth.js";

const embrioderyRouter = express.Router();

embrioderyRouter.post("/addEmbriodery", superAdminAndAdminOnly, addEmbriodery);
embrioderyRouter.post(
  "/getAllEmbroidery",
  superAdminAndAdminOnly,
  getAllEmbroidery
);
embrioderyRouter.post(
  "/getEmbroideryById",
  superAdminAndAdminOnly,
  getEmbroideryById
);
embrioderyRouter.post(
  "/updateEmbroidery",
  superAdminAndAdminOnly,
  updateEmbroidery
);
embrioderyRouter.post(
  "/replaceEmroideryData",
  superAdminAndAdminOnly,
  replaceEmroideryData
);
embrioderyRouter.post(
  "/getPreviousDataBypartyName",
  superAdminAndAdminOnly,
  getPreviousDataBypartyName
);
embrioderyRouter.post(
  "/getAllDesignNumbers",
  superAdminAndAdminOnly,
  getAllDesignNumbers
);
embrioderyRouter.post(
  "/getHeadDataByDesignNo",
  superAdminAndAdminOnly,
  getHeadDataByDesignNo
);
embrioderyRouter.post(
  "/deleteEmbroiderybyId",
  superAdminAndAdminOnly,
  deleteEmbroidery
);
embrioderyRouter.put(
  "/updateVerificationStatus/:id",
  superAdminAndAdminOnly,
  updateVerificationStatus
);
embrioderyRouter.get(
  "/getProcessFiltersData/:category",
  superAdminAndAdminOnly,
  getProcessFiltersData
);
embrioderyRouter.get(
  "/getProcessAnalytics",
  superAdminOnly,
  getProcessAnalytics
);

export default embrioderyRouter;
