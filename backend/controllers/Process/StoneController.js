import { StoneModel } from "../../models/Process/StoneModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { CuttingModel } from "../../models/Process/CuttingModel.js";
import { getPaginationParams } from "../../utils/Common.js";
import {
  assertSourceCanCreateNextStep,
  assertSourceHasNoNextSteps,
  buildProcessAvailability,
  getRecordsPackingLeft,
  loadPackingInfoSafely,
  ProcessStep,
} from "../../utils/ProcessQuantity.js";

export const addStone = async (req, res, next) => {
  try {
    const {
      embroidery_Id,
      cuttingId,
      partyName,
      serial_No,
      design_no,
      date,
      rate,
      category_quantity,
      partyType,
      source_step,
      source_id,
    } = req.body;
    const requiredFields = [
      "embroidery_Id",
      "partyType",
      "partyName",
      "rate",
      "design_no",
      "serial_No",
      "category_quantity",
      "date",
    ];

    const missingFields = [];
    requiredFields.forEach((field) => {
      if (!req.body[field]) {
        missingFields.push(field);
      }
      for (let item of category_quantity) {
        if (!item.category || !item.color || !item.quantity) {
          throw new Error(
            "Each category item must have category, color, and quantity"
          );
        }
      }
      if (missingFields.length > 0) {
        throw new Error(`Missing Fields ${field}`);
      }
    });
    //CHECK PARTY NAME ERROR
    if (partyType === "newParty") {
      const checkExistingStone = await StoneModel.findOne({
        partyName: { $regex: partyName, $options: "i" },
      });
      if (checkExistingStone) {
        throw new Error("Party Name Already In Use");
      }
    }
    //UPDATE AVAILABLE QUANTITY
    let totalQuantityToAdd = 0;
    for (let item of category_quantity) {
      if (item.category || item.color || item.quantity) {
        totalQuantityToAdd += Number(item.quantity) || 0;
      }
    }
    const sourceStep =
      source_step ||
      (cuttingId && cuttingId !== "null"
        ? ProcessStep.CUTTING
        : ProcessStep.EMBROIDERY);
    const sourceId =
      source_id ||
      (sourceStep === ProcessStep.CUTTING ? cuttingId : embroidery_Id);

    await assertSourceCanCreateNextStep({
      sourceStep,
      sourceId,
      requestedQuantity: totalQuantityToAdd,
      requestedRows: category_quantity,
    });
    //GET MAIN EMBROIDERY DATA
    const mainEmbroidery = await EmbroideryModel.findById(embroidery_Id);
    if (!mainEmbroidery) throw new Error("Embroidery record not found");

    //ADD STONES
    await StoneModel.create({
      embroidery_Id,
      source_step: sourceStep,
      source_id: sourceId,
      partyName,
      rate,
      serial_No,
      category_quantity,
      date,
      design_no,
      Manual_No:mainEmbroidery.Manual_No,
      cuttingId
    });

    //UPDATE MAIN EMBROIDERY NextStep
    mainEmbroidery.next_steps.stones = true;
    await mainEmbroidery.save();
    return res
      .status(200)
      .json({ success: true, message: "Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllStone = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const Manual_No = req.query.Manual_No || "";
    const project_status = req.query.project_status || "";
    const design_no = req.query.design_no || "";
    const partyName = req.query.partyName || "";
    let query = {};

    if (Manual_No) query.Manual_No = Manual_No;
    if (project_status) query.project_status = project_status;
    if (design_no) query.design_no = design_no;
    if (partyName) query.partyName = partyName;

    const data = await StoneModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await StoneModel.countDocuments(query);
    //WHAT IS LEFT AT EACH PACKED STONE, FOR ITS PACKING ICON. WORKED OUT FOR THIS PAGE ONLY
    const packingLeft = await loadPackingInfoSafely(
      () => getRecordsPackingLeft({ sourceStep: ProcessStep.STONE, records: data }),
      data
    );
    setMongoose();
    const response = {
      totalPages: Math.ceil(total / limit),
      data: data.map((stone, index) => ({
        ...stone.toJSON(),
        packing_left: packingLeft[index].left,
      })),
      page,
      limit,
      totalRecords: total,
    };
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStoneById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Required");
    const data = await StoneModel.findById(id);
    if (!data) throw new Error("Stone not found");
    const processAvailability = await buildProcessAvailability({
      sourceStep: ProcessStep.STONE,
      sourceId: id,
    });
    setMongoose();
    return res.status(200).json({
      ...data.toObject({ virtuals: true }),
      processAvailability,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStoneByEmbroideryId = async (req, res, next) => {
  try {
    const { embroidery_Id } = req.body;
    if (!embroidery_Id) throw new Error("Embroidery Id Required");
    const data = await StoneModel.findOne({ embroidery_Id });
    if (!data) throw new Error("No Stone Data For This Embroidery");
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateStone = async (req, res, next) => {
  try {
    const { id, category_quantity, project_status, totalQuantity } = req.body;
    if (!id) throw new Error("Id not Found");
    const stone = await StoneModel.findById(id);
    if (!stone) throw new Error("Stone not Found");
    if (project_status) {
      stone.project_status = project_status;
    }
    if (category_quantity && category_quantity.length > 0) {
      category_quantity.forEach((item) => {
        const { first, second, third, id } = item;
        const date = new Date().toLocaleString("en-PK");
        let toUpdate = stone.category_quantity.find((obj) => obj._id == id);
        let new_r_quantity = stone.r_quantity - toUpdate.recieved_Data.r_total;
        if (toUpdate) {
          if (first !== undefined && first !== null) {
            let total =
              toUpdate.recieved_Data.r_total -
              toUpdate.recieved_Data.first.quantity;
            toUpdate.recieved_Data.first.quantity = first;
            toUpdate.recieved_Data.first.date = date;
            toUpdate.recieved_Data.r_total = first + total;
          }

          if (second !== undefined && second !== null) {
            let total =
              toUpdate.recieved_Data.r_total -
              toUpdate.recieved_Data.second.quantity;
            toUpdate.recieved_Data.second.quantity = second;
            toUpdate.recieved_Data.second.date = date;
            toUpdate.recieved_Data.r_total = second + total;
          }

          if (third !== undefined && third !== null) {
            let total =
              toUpdate.recieved_Data.r_total -
              toUpdate.recieved_Data.third.quantity;
            toUpdate.recieved_Data.third.quantity = third;
            toUpdate.recieved_Data.third.date = date;
            toUpdate.recieved_Data.r_total = third + total;
          }
          if (toUpdate.recieved_Data.r_total > Number(toUpdate.quantity || 0)) {
            throw new Error("Received quantity cannot be greater than sent quantity");
          }
        }
        stone.r_quantity = new_r_quantity + toUpdate.recieved_Data.r_total;
        if (stone.r_quantity > totalQuantity) {
          throw new Error("Invalid Update Quantity Value");
        }
        toUpdate.recieved_Data.r_date = date;
        stone.updated = true;
      });
    }

    await stone.save();
    return res
      .status(200)
      .json({ success: true, message: "Updated Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteStone = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Stone Id Required");
    const data = await StoneModel.findById(id);
    if (!data) throw new Error("Stone Not Found");
    if (data.bill_generated)
      throw new Error("Bill Generated Cannot Delete This Stone");
    await assertSourceHasNoNextSteps({
      sourceStep: ProcessStep.STONE,
      sourceId: id,
    });
    await StoneModel.findByIdAndDelete(id);
    const checkAnotherStoneExists = await StoneModel.findOne({
      embroidery_Id: data.embroidery_Id,
    });
    if (!checkAnotherStoneExists) {
      const embData = await EmbroideryModel.findById(data.embroidery_Id);
      if (!embData) throw new Error("Embroidery Data not Found For this Stone");
      embData.next_steps.stones = false;
      await embData.save();
    };

    return res
      .status(200)
      .json({ success: true, message: "Deleted successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getStoneDataBypartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new Error("No Party Name found");
    const StoneQuery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
      process_Category: "Stone",
    };
    let stoneData = await StoneModel.find(StoneQuery, ["partyName"]);
    stoneData = Array.from(
      new Map(stoneData.map((item) => [item.partyName, item])).values()
    );
    const accountData = await processBillsModel.find(billQuery, [
      "virtual_account",
      "partyName",
    ]);
    const data = {
      stoneData: stoneData,
      accountData: accountData,
    };
    setMongoose();
    return res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
