import { CalenderModel } from "../../models/Process/CalenderModel.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";
import {
  buildProcessAvailability,
  ProcessStep,
} from "../../utils/ProcessQuantity.js";

export const addCalender = async (req, res, next) => {
  try {
    const {
      embroidery_Id,
      partyName,
      partytype,
      rate,
      serial_No,
      T_Quantity,
      date,
      design_no,
    } = req.body;
    const requiredFields = [
      "embroidery_Id",
      "partytype",
      "partyName",
      "rate",
      "design_no",
      "serial_No",
      "T_Quantity",
      "date",
    ];
    const missingFields = [];
    requiredFields.forEach((field) => {
      if (req.body[field] === undefined || req.body[field] === null) {
        missingFields.push(field);
      }
      if (missingFields.length > 0) {
        throw new Error(`Missing Fields ${field}`);
      }
    });
    if (partytype === "newParty") {
      const checkExistingCalender = await CalenderModel.findOne({
        partyName: { $regex: partyName, $options: "i" },
      });
      if (checkExistingCalender) {
        throw new Error("Party Name Already In Use");
      }
    }
    //GET EMBROIDERY DATA
    const mainEmbroidery = await EmbroideryModel.findById(embroidery_Id);
    if (!mainEmbroidery) throw new Error("Embroidery record not found");
    if (mainEmbroidery.project_status !== "Completed") {
      throw new Error("Previous step must be completed before creating next step");
    }
    
    //CREATE CALENDER DATA
    await CalenderModel.create({
      embroidery_Id,
      partyName,
      rate,
      serial_No,
      T_Quantity,
      date,
      design_no,
      Manual_No: mainEmbroidery.Manual_No,
    });

    //UPDATE MAIN EMBROIDERY NextStep
    mainEmbroidery.next_steps.calender = true;
    await mainEmbroidery.save();
    return res
      .status(200)
      .json({ success: true, message: "Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCalender = async (req, res, next) => {
  try {
    let { id, r_quantity, project_status, r_unit } = req.body;
    if (!id) throw new Error("Id not Found");
    const calender = await CalenderModel.findById(id);
    if (!calender) throw new Error("Calender not Found");
    let updateQuery = {};
    if (r_quantity !== undefined && r_quantity !== null && r_quantity !== "") {
      if (Number(r_quantity) > Number(calender.T_Quantity || 0)) {
        throw new Error("Invalid Recieved quantity");
      }
      updateQuery = { ...updateQuery, r_quantity, updated: true };
    }
    if (project_status) {
      if (project_status === "Completed" && calender.updated === true) {
        updateQuery = { ...updateQuery, project_status };
      } else throw new Error("Project status Can Not be Updated");
    }
    await CalenderModel.findByIdAndUpdate(id, updateQuery, {
      new: true,
    });
    return res
      .status(200)
      .json({ success: true, message: "Updated Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllCalender = async (req, res, next) => {
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

    const data = await CalenderModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await CalenderModel.countDocuments(query);
    const response = {
      totalPages: Math.ceil(total / limit),
      data,
      page,
      limit,
      totalRecords: total,
    };
    setMongoose();
    return res.status(200).json(response);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCalenderById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Required");
    const data = await CalenderModel.findById(id);
    if (!data) throw new Error("Calender not found");
    const processAvailability = await buildProcessAvailability({
      sourceStep: ProcessStep.EMBROIDERY,
      sourceId: data.embroidery_Id,
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

export const getCalenderByEmbroideryId = async (req, res, next) => {
  try {
    const { embroidery_Id } = req.body;
    if (!embroidery_Id) throw new Error("Embroidery Id Required");
    const data = await CalenderModel.findOne({ embroidery_Id });
    if (!data) throw new Error("No Calender Data For This Embroidery");
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCalender = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Calender Id Required");
    const data = await CalenderModel.findById(id);
    if (!data) throw new Error("Calender Not Found");
    if (data.bill_generated)
      throw new Error("Bill Generated Cannot Delete This calender");
    await CalenderModel.findByIdAndDelete(id);
    const embData = await EmbroideryModel.findById(data.embroidery_Id);
    if (!embData)
      throw new Error("Embroidery Data not Found For this Calender");
    embData.next_steps.calender = !!(await CalenderModel.exists({
      embroidery_Id: data.embroidery_Id,
    }));
    await embData.save();
    return res
      .status(200)
      .json({ success: true, message: "Deleted Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCalenderDataBypartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new Error("No Party Name found");
    const CalenderQuery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
      process_Category: "Calender",
    };
    let calenderData = await CalenderModel.find(CalenderQuery, ["partyName"]);
    calenderData = Array.from(
      new Map(calenderData.map((item) => [item.partyName, item])).values()
    );
    const accountData = await processBillsModel.find(billQuery, [
      "virtual_account",
      "partyName",
    ]);
    const data = {
      calenderData: calenderData,
      accountData: accountData,
    };
    setMongoose();
    return res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
