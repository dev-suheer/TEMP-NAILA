import {
  PicruresAccountModel,
  PicruresModel,
} from "../../models/Process/PicturesModel.js";
import { verifyrequiredparams } from "../../middleware/Common.js";
import CustomError from "../../config/errors/CustomError.js";
import mongoose from "mongoose";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { calculateAccountBalance } from "../../utils/accounting.js";
import { buildDateRangeQuery, getPaginationParams } from "../../utils/Common.js";

// Create a new picture document
export const createPictureOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        embroidery_Id,
        T_Quantity,
        design_no,
        date,
        partyName,
        rate,
        partyType,
        accountId,
        serial_No,
        Manual_No
      } = req.body;

      await verifyrequiredparams(req.body, [
        "embroidery_Id",
        "T_Quantity",
        "design_no",
        "date",
        "partyName",
        "rate",
        "partyType",
        "serial_No",
        "Manual_No"
      ]);

      
      const embroideryData = await EmbroideryModel.findById(embroidery_Id).session(session);
      if(embroideryData.pictures_Order) {
        throw new Error('New order not permitted. Pictures order already exist for this embroidery')
      } else {
        embroideryData.pictures_Order = true;
        await embroideryData.save({session})
      }

      if (partyType === "newParty") {
        // Create the new picture Order
        const newPictureOrder = await PicruresModel.create(
          [
            {
              embroidery_Id,
              T_Quantity,
              design_no,
              date,
              partyName,
              rate,
            },
          ],
          { session }
        );

        //DATA FOR VIRTUAL ACCOUNT
        const total_credit = rate;
        const total_balance = rate;
        let status = "Unpaid";

        const virtualAccountData = {
          total_credit,
          total_balance,
          status,
        };
        //DATA FOR CREDIT DEBIT HISTORY

        const credit_debit_history_details = [
          {
            date,
            particular: `S.N:${serial_No}/M.N:${Manual_No}/D.N:${design_no}`,
            credit: rate,
            balance: rate,
            orderId: newPictureOrder[0]._id,
          },
        ];

        //Create Account Data
        await PicruresAccountModel.create(
          [
            {
              partyName,
              design_no,
              date,
              serial_No,
              virtual_account: virtualAccountData,
              credit_debit_history: credit_debit_history_details,
            },
          ],
          { session }
        );
      } else if (partyType === "oldParty") {
        // Create the new picture Order
        const newPictureOrder = await PicruresModel.create(
          [
            {
              embroidery_Id,
              T_Quantity,
              design_no,
              date,
              partyName,
              rate,
            },
          ],
          { session }
        );

        //GETTING OLD SELLER DATA
        const oldAccountData = await PicruresAccountModel.findById(accountId).session(session);

        const {new_total_debit,new_total_credit,new_total_balance,new_status} = 
        calculateAccountBalance({amount:rate,oldAccountData,credit:true});

        //Creating Virtual Account Data
        const virtualAccountData = {
          total_debit: new_total_debit,
          total_credit: new_total_credit,
          total_balance: new_total_balance,
          status: new_status,
        };

        //DATA FOR CREDIT DEBIT HISTORY
        const credit_debit_history_details = {
          date,
          particular: `S.N:${serial_No}/M.N:${Manual_No}/D.N:${design_no}`,
          credit: rate,
          balance: new_total_balance,
          orderId: newPictureOrder[0]._id,
        };

        (oldAccountData.virtual_account = virtualAccountData),
          oldAccountData.credit_debit_history.push(
            credit_debit_history_details
          );

        oldAccountData.design_no = design_no;
        oldAccountData.date = date;
        oldAccountData.serial_No = serial_No;

        await oldAccountData.save({ session });
      }

      res
        .status(201)
        .json({ success: true, message: "Picture order created successfully" });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

// Get a single picture by ID
export const getPictureOrderById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new CustomError("Picture Order Id is required", 404);
    const picture =
      (await PicruresModel.findOne({ embroidery_Id: id })) ||
      (await PicruresModel.findById(id));
    if (!picture) throw new CustomError("Picture not found", 404);

    res.status(200).json(picture);
  } catch (error) {
    next(error);
  }
};

// Delete a picture Order by ID
export const deletePictureOrderById = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.body;
      if (!id) throw new CustomError("Picture rrder id is required", 404);
      const pictureOrder = await PicruresModel.findById(id).session(session);
      if (!pictureOrder) throw new CustomError("Picture not found", 404);

      //GETTING ACCOUNT DATA
      const oldAccountData = await PicruresAccountModel.findOne({
        partyName: pictureOrder.partyName,
      }).session(session);

      //UPDATE EMBROIDERY
      await EmbroideryModel.findByIdAndUpdate(pictureOrder.embroidery_Id, {
        pictures_Order: false
      }).session(session);
      
      //UPDATING ACCOUNT DATA
      const amountToDeduct = pictureOrder.rate;

      //DATA FOR VIRTUAL ACCOUNT
       const {new_total_debit,new_total_credit,new_total_balance,new_status} = calculateAccountBalance({amount:amountToDeduct,oldAccountData,credit:true,add:false});
 
      //Creating Virtual Account Data
      const virtualAccountData = {
        total_credit: new_total_credit,
        total_debit: new_total_debit,
        total_balance: new_total_balance,
        status: new_status,
      };

      //   const ObjectId = new mongoose.Types.ObjectId(id);
      (oldAccountData.virtual_account = virtualAccountData),
      oldAccountData.credit_debit_history = oldAccountData.credit_debit_history.filter((item) => item.orderId !== id);
       
      await oldAccountData.save({ session });
      await PicruresModel.findByIdAndDelete(id).session(session);
      res
        .status(200)
        .json({ success: true, message: "Pictures order deleted successfully" });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

// Update a picture by ID
export const updatePictureOrderById = async (req, res, next) => {
  try {
    const { id, status } = req.body;
    await verifyrequiredparams(req.body, ["id", "status"]);
    const updateData = {
      status: status,
    };
    const updatedPicture = await PicruresModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );
    res.status(200).json({ success: true, data: updatedPicture });
  } catch (error) {
    next(error);
  }
};

// Get all picture orders
export const getAllPictureAccounts = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const name = req.query.name || "";
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const status = req.query.status || "";
    let query = {};
    if (name) {
      query.partyName = name;
    }
    if (status) {
      query["virtual_account.status"] = status;
    }
    const dateRangeQuery = buildDateRangeQuery(dateFrom, dateTo);
    if (dateRangeQuery) {
      query.date = dateRangeQuery;
    }
    const namesQuery = { ...query };
    delete namesQuery.partyName;
    delete namesQuery.date;
    const [partyNames, processBills, totalProcessBills] = await Promise.all([
      PicruresAccountModel.distinct("partyName", namesQuery),
      PicruresAccountModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      PicruresAccountModel.countDocuments(query),
    ]);
    const response = {
      totalPages: Math.ceil(totalProcessBills / limit),
      processBills,
      partyNames,
      page,
      limit,
      totalProcessBills,
      totalRecords: totalProcessBills,
    };
    return res.status(200).json(response);
  } catch (error) {
    next(error);
  }
};

// Get a single picture Account by ID
export const getPicruresBillById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Process Id Required");
    const ProcessBill = await PicruresAccountModel.findById(id);
    if (!ProcessBill) throw new Error("Process Bill Not Found");
    setMongoose();
    return res.status(200).json(ProcessBill);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchAccountByPartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new CustomError("No Party Name found", 404);
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const accountData = await PicruresAccountModel.find(billQuery, [
      "virtual_account",
      "partyName",
      "id",
    ]);
    setMongoose();
    return res.status(200).send(accountData);
  } catch (error) {
    next(error);
  }
};
