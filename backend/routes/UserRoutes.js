import express from "express";
import {
  getPendingRequests,
  getUsersForBranch,
  login,
  logout,
  persistUserSession,
  sendResetPasswordOTP,
  signUp,
  updatePassword,
  updateUser,
  verifyOtp,
} from "../controllers/User.controller.js";
import { superAdminOnly } from "../middleware/Auth.js";

const userRouter = express.Router();

userRouter.post("/signup", signUp);
userRouter.post("/login", login);
userRouter.delete("/logout", logout);
userRouter.post("/updateUser", superAdminOnly, updateUser);
userRouter.post("/updatePassword", updatePassword);
userRouter.post("/sendResetPasswordOTP", sendResetPasswordOTP);
userRouter.post("/verifyOtp", verifyOtp);
userRouter.get("/persistUserSession", persistUserSession);
userRouter.post("/getPendingRequests", superAdminOnly, getPendingRequests);
userRouter.post("/getUsersForBranch", superAdminOnly, getUsersForBranch);

export default userRouter;
