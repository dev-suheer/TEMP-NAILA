import { UserModel } from "../models/User.Model.js";
import jwt from "jsonwebtoken";

export const superAdminOnly = async (req, res, next) => {
  const id = req.session.userId;
  if (!id) {
    return res.status(401).json({ message: "Please Login First" });
  }
  const user = await UserModel.findById(id);
  if (user.role !== "superadmin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const superAdminAndAdminOnly = async (req, res, next) => {
  const id = req.session.userId;
  if (!id) {
    return res.status(401).json({ message: "Please Login First" });
  }
  const user = await UserModel.findById(id);
  if (user.role !== "superadmin" && user.role !== "admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

export const verifyUser = async (req, res, next) => {
  const id = req.session.userId;
  if (!id) {
    return res.status(401).json({ message: "Please Login First" });
  }
  const user = await UserModel.findById(id);
  if (!user.authenticated) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.user_role = user.role;
  req.user_id = id;
  req.branch_id = user.branchId;
  next();
};

export const verifyOtp = (req, res, next) => {
  const { D_Token } = req.cookies;
  if (!D_Token) {
    return res.status(400).json({ error: "Not Authorized" })
  };
  try {
    const decodedToken = jwt.verify(D_Token, process.env.TOEKN_SECRET);
    if (!decodedToken) {
      return res.status(403).json({ error: "Access For Dashboard Expired" });
    }
    next();
  } catch (error) {
    return res.status(403).json({ error: error });
  }
 
 
};
