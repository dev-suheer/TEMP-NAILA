
import express from 'express';
import { createReturn } from '../../controllers/Returns/ReturnsController.js';
import { verifyUser} from "../../middleware/Auth.js";

const returnRouter = express.Router();

returnRouter.post("/createReturn",verifyUser,createReturn);

export default returnRouter;