

import express from 'express';
import { superAdminOnly, verifyUser} from "../../middleware/Auth.js";
import { cashBookController } from '../../controllers/CashBook/CashBookController.js';

const cashBookRouter = express.Router();

cashBookRouter.get("/getAllCashBookEntries",verifyUser,cashBookController.getAllCashBookEntries);
cashBookRouter.post("/deleteCashBookEntry/:id",superAdminOnly,cashBookController.deleteCashBookEntry);


export default cashBookRouter;