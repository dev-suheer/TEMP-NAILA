import express from "express";
import { verifyUser } from "../../middleware/Auth.js";
import {
  addBuyerCheck,
  deleteCheck,
  getAllChecksForParty,
  markCheckAsPaid,
  showNotificationsForChecks,
  updateBuyerCheckWithNew,
} from "../../controllers/Checks/CheckController.js";

const checkRouter = express.Router();

checkRouter.post("/addBuyerCheck", verifyUser, addBuyerCheck);
checkRouter.post(
  "/updateBuyerCheckWithNew",
  verifyUser,
  updateBuyerCheckWithNew
);
checkRouter.post("/markCheckAsPaid", verifyUser, markCheckAsPaid);
checkRouter.post("/getAllChecksForParty", verifyUser, getAllChecksForParty);
checkRouter.post("/deleteCheck", verifyUser, deleteCheck);
checkRouter.post("/showNotificationsForChecks", verifyUser, showNotificationsForChecks);

export default checkRouter;
