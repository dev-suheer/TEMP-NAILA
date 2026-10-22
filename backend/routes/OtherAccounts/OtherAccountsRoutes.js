

import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import { createOtherAccount, creditDebitOtherAccount, deleteOtherAccontsTransaction, getAllOtherAccounts, getOtherAccountDataById } from "../../controllers/OtherAccounts/OtherAccountsController.js";


const otherAccountsRouter = express.Router();

otherAccountsRouter.post("/createOtherAccount", createOtherAccount);
otherAccountsRouter.get("/getAllOtherAccounts", getAllOtherAccounts);
otherAccountsRouter.get("/getOtherAccountDataById/:id", getOtherAccountDataById);
otherAccountsRouter.post("/creditDebitOtherAccount", creditDebitOtherAccount);
otherAccountsRouter.post("/deleteOtherAccontsTransaction/:id", deleteOtherAccontsTransaction);

export default otherAccountsRouter;
