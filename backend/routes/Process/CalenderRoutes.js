import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import {
  addCalender,
  deleteCalender,
  getAllCalender,
  getCalenderByEmbroideryId,
  getCalenderById,
  getCalenderDataBypartyName,
  updateCalender,
} from "../../controllers/Process/CalenderController.js";

const calenderRouter = express.Router();

calenderRouter.post("/addCalender", superAdminAndAdminOnly, addCalender);
calenderRouter.post("/updateCalender", superAdminAndAdminOnly, updateCalender);
calenderRouter.post("/deleteCalender", superAdminAndAdminOnly, deleteCalender);
calenderRouter.post("/getAllCalender", superAdminAndAdminOnly, getAllCalender);
calenderRouter.post("/getCalenderByEmbroideryId", superAdminAndAdminOnly, getCalenderByEmbroideryId);
calenderRouter.post(
  "/getCalenderById",
  superAdminAndAdminOnly,
  getCalenderById
);
calenderRouter.post(
  "/getCalenderDataBypartyName",
  superAdminAndAdminOnly,
  getCalenderDataBypartyName
);


export default calenderRouter;
