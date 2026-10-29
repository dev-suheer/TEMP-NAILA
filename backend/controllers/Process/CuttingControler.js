import { CuttingModel } from "../../models/Process/CuttingModel.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";
import {
  assertSourceCanCreateNextStep,
  assertSourceHasNoNextSteps,
  buildProcessAvailability,
  getRecordsPackingLeft,
  loadPackingInfoSafely,
  ProcessStep,
} from "../../utils/ProcessQuantity.js";

export const addCutting = async (req, res, next) => {
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
      source_step,
      source_id,
      category_quantity,
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
      const checkExistingCutting = await CuttingModel.findOne({
        partyName: { $regex: partyName, $options: "i" },
      });
      if (checkExistingCutting) {
        throw new Error("Party Name Already In Use");
      }
    }
    //GET MAIN EMBROIDERY DATA
    const mainEmbroidery = await EmbroideryModel.findById(embroidery_Id);
    if (!mainEmbroidery) throw new Error("Embroidery record not found");
    const sourceStep = source_step || ProcessStep.EMBROIDERY;
    const sourceId = source_id || embroidery_Id;

    const cuttingRows = category_quantity
      ? category_quantity.filter((item) => item?.category || item?.color || item?.quantity)
      : [];
    const totalCuttingQuantity = cuttingRows.length
      ? cuttingRows.reduce((total, item) => total + Number(item.quantity || 0), 0)
      : Number(T_Quantity || 0);

    if (cuttingRows.length) {
      for (const item of cuttingRows) {
        if (!item.category || !item.color || !Number(item.quantity || 0)) {
          throw new Error("Each cutting row must have category, color, and quantity");
        }
      }
    }

    await assertSourceCanCreateNextStep({
      sourceStep,
      sourceId,
      requestedQuantity: totalCuttingQuantity,
      requestedRows: cuttingRows,
    });

    //ADD CONTROLLER DATA
    await CuttingModel.create({
      embroidery_Id,
      source_step: sourceStep,
      source_id: sourceId,
      partyName,
      rate,
      serial_No,
      T_Quantity: totalCuttingQuantity,
      category_quantity: cuttingRows,
      date,
      design_no,
      Manual_No: mainEmbroidery.Manual_No,
    });

    //UPDATE MAIN EMBROIDERY NextStep
    mainEmbroidery.next_steps.cutting = true;
    await mainEmbroidery.save();
    return res
      .status(200)
      .json({ success: true, message: "Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateCutting = async (req, res, next) => {
  try {
    const { id, r_quantity, category_quantity, project_status } = req.body;
    if (!id) throw new Error("Id not Found");
    const cutting = await CuttingModel.findById(id);
    if (!cutting) throw new Error("cutting not Found");
    let updateQuery = {};

    if (category_quantity && category_quantity?.length > 0) {
      const updatedRows = cutting.category_quantity.map((row) => {
        const incoming = category_quantity.find(
          (item) => String(item.id || item._id) === String(row._id)
        );
        if (!incoming) return row;

        const received = Number(incoming.received || 0);
        if (received > Number(row.quantity || 0)) {
          throw new Error("Received quantity cannot be greater than sent quantity");
        }

        row.received = received;
        return row;
      });
      const updatedReceivedQuantity = updatedRows.reduce(
        (total, item) => total + Number(item.received || 0),
        0
      );
      if (updatedReceivedQuantity > cutting.T_Quantity) {
        throw new Error("Invalid Recieved quantity");
      }
      updateQuery = {
        ...updateQuery,
        category_quantity: updatedRows,
        r_quantity: updatedReceivedQuantity,
        updated: true,
      };
    } else if (r_quantity !== undefined && r_quantity !== null && r_quantity !== "") {
      if (Number(r_quantity) > Number(cutting.T_Quantity || 0)) {
        throw new Error("Invalid Recieved quantity");
      }
      updateQuery = {
        ...updateQuery,
        r_quantity,
        updated: true,
      };
    }
    if (project_status) {
      updateQuery = { ...updateQuery, project_status };
    }
    await CuttingModel.findByIdAndUpdate(id, updateQuery, {
      new: true,
    });
    return res
      .status(200)
      .json({ success: true, message: "Updated Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllCutting = async (req, res, next) => {
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
    
    const data = await CuttingModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await CuttingModel.countDocuments(query);
    //WHAT IS LEFT AT EACH PACKED CUTTING, FOR ITS PACKING ICON. WORKED OUT FOR THIS PAGE ONLY
    const packingLeft = await loadPackingInfoSafely(
      () => getRecordsPackingLeft({ sourceStep: ProcessStep.CUTTING, records: data }),
      data
    );
    setMongoose();
    const response = {
      totalPages: Math.ceil(total / limit),
      data: data.map((cutting, index) => ({
        ...cutting.toJSON(),
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

export const getCuttingById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Required");
    const data = await CuttingModel.findById(id);
    if (!data) throw new Error("Cutting not found");
    const processAvailability = await buildProcessAvailability({
      sourceStep: ProcessStep.CUTTING,
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

export const getCuttingByEmbroideryId = async (req, res, next) => {
  try {
    const { embroidery_Id } = req.body;
    if (!embroidery_Id) throw new Error("Embroidery Id Required");
    const data = await CuttingModel.findOne({ embroidery_Id });
    if (!data) throw new Error("No Calender Data For This Embroidery");
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deleteCutting = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Cutting Id Required");
    const data = await CuttingModel.findById(id);
    if (!data) throw new Error("Cutting Not Found");
    if (data.bill_generated)
      throw new Error("Bill Generated Cannot Delete This Cutting");
    await assertSourceHasNoNextSteps({
      sourceStep: ProcessStep.CUTTING,
      sourceId: id,
    });
    await CuttingModel.findByIdAndDelete(id);
    const embData = await EmbroideryModel.findById(data.embroidery_Id);
    if (!embData) throw new Error("Embroidery Data not Found For this Cutting");
    embData.next_steps.cutting = !!(await CuttingModel.exists({
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

export const getCuttingDataBypartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new Error("No Party Name found");
    const cuttingQuery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
      process_Category: "Cutting",
    };
    let cuttingData = await CuttingModel.find(cuttingQuery, ["partyName"]);
    cuttingData = Array.from(
      new Map(cuttingData.map((item) => [item.partyName, item])).values()
    );
    const accountData = await processBillsModel.find(billQuery, [
      "virtual_account",
      "partyName",
    ]);
    const data = {
      cuttingData: cuttingData,
      accountData: accountData,
    };
    setMongoose();
    return res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
