import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  createPictureOrder,
  deletePictureOrderById,
  getAllPictureAccounts,
  getPicruresBillById,
  getPictureOrderById,
  searchAccountByPartyName,
  updatePictureOrderById,
} from "../../controllers/Process/PicturesController.js";

const pictureRouter = express.Router();

pictureRouter.post(
  "/createPictureOrder",
  superAdminAndAdminOnly,
  createPictureOrder
);
pictureRouter.post(
  "/getPictureOrderById",
  superAdminAndAdminOnly,
  getPictureOrderById
);
pictureRouter.post(
  "/getPicruresBillById",
  superAdminAndAdminOnly,
  getPicruresBillById
);
pictureRouter.post(
  "/deletePictureOrderById",
  superAdminAndAdminOnly,
  deletePictureOrderById
);
pictureRouter.post(
  "/updatePictureOrderById",
  superAdminAndAdminOnly,
  updatePictureOrderById
);
pictureRouter.post(
  "/getAllPictureAccounts",
  superAdminAndAdminOnly,
  getAllPictureAccounts
);
pictureRouter.post(
  "/searchAccountByPartyName",
  superAdminAndAdminOnly,
  searchAccountByPartyName
);


export default pictureRouter;
