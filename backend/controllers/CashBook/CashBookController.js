import mongoose from "mongoose";
import CustomError from "../../config/errors/CustomError.js";
import { cashBookService } from "../../services/CashbookService.js";

export const cashBookController = {

    getAllCashBookEntries : async (req,res,next) => {
        try {
           const data =  await cashBookService.getAllCashBookEntries(req);
           return res.status(201).json(data)
        } catch (error) {
            next(error)
        }
    },

    deleteCashBookEntry : async (req,res,next) => {
      const session = await mongoose.startSession();
      try {
        await session.withTransaction(async () => {
          const id = req.params.id;
          if (!id) throw new CustomError("Record id is missing", 400);
          await cashBookService.deleteCashBookRecord({id,session});
          return res
            .status(200)
            .json({ success: true, message: "Deleted successfully" });
        });
      } catch (error) {
        next(error);
      } finally {
        session.endSession();
      }
    }

};

