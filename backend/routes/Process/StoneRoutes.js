
import express from "express";
import { superAdminAndAdminOnly } from "../../middleware/Auth.js";
import { addStone, deleteStone, getAllStone, getStoneByEmbroideryId, getStoneById, getStoneDataBypartyName, updateStone } from "../../controllers/Process/StoneController.js";

const stoneRouter = express.Router();

stoneRouter.post("/addStone", superAdminAndAdminOnly , addStone);
stoneRouter.post("/getAllStone", superAdminAndAdminOnly , getAllStone);
stoneRouter.post("/getStoneById", superAdminAndAdminOnly , getStoneById);
stoneRouter.post("/deleteStone", superAdminAndAdminOnly , deleteStone);
stoneRouter.post("/getStoneByEmbroideryId", superAdminAndAdminOnly , getStoneByEmbroideryId);
stoneRouter.post("/updateStone", superAdminAndAdminOnly , updateStone);
stoneRouter.post("/getStoneDataBypartyName", superAdminAndAdminOnly , getStoneDataBypartyName);


export default stoneRouter;
