import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { BaseModel } from "../../models/Stock/Base.Model.js";
import mongoose from "mongoose";
import { setMongoose } from "../../utils/Mongoose.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import CustomError from "../../config/errors/CustomError.js";
import { CalenderModel } from "../../models/Process/CalenderModel.js";
import { CuttingModel } from "../../models/Process/CuttingModel.js";
import { StitchingModel } from "../../models/Process/StitchingModel.js";
import { StoneModel } from "../../models/Process/StoneModel.js";
import { buildDateRangeQuery, getPaginationParams } from "../../utils/Common.js";
import {
  buildProcessAvailability,
  getActiveNextSteps,
  ProcessStep,
} from "../../utils/ProcessQuantity.js";


export const addEmbriodery = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        partyName,
        partytype,
        Manual_No,
        date,
        per_suit,
        project_status,
        design_no,
        discountType,
        discount,
        shirt,
        duppata,
        trouser,
        recieved_suit,
        T_Quantity_In_m,
        T_Quantity,
        T_Suit,
        Front_Stitch,
        Bazo_Stitch,
        Gala_Stitch,
        Back_Stitch,
        Pallu_Stitch,
        Trouser_Stitch,
        D_Patch_Stitch,
        F_Patch_Stitch,
        tissue,
        rate_per_stitching
      } = req.body;

      const requiredFields = [
        "partyName",
        "Manual_No",
        "partytype",
        "date",
        "per_suit",
        "project_status",
        "design_no",
        "T_Quantity_In_m",
        "T_Quantity",
        "rate_per_stitching",
        "shirt"
      ];

      const optionalFields1 = [
        "Front_Stitch",
        "Bazo_Stitch",
        "Gala_Stitch",
        "Back_Stitch",
        "Pallu_Stitch",
        "Trouser_Stitch",
        "D_Patch_Stitch",
        "F_Patch_Stitch",
      ];

      const optionalFields2 = ["shirt", "duppata", "trouser"];
      const valuesForoptionalFields2 = [
        "category",
        "color",
        "quantity_in_m",
        "quantity_in_no",
      ];
      const tissueFields = ["category", "color", "quantity_in_m"];

      const findmissingFields = (data, requiredSubFields) => {
        return data
          .map((item) => {
            const missingData = requiredSubFields.filter(
              (field) => !item[field]
            );
            if (missingData.length > 0) {
              return missingData;
            }
            return null;
          })
          .filter(Boolean);
      };
      const missingFields = [];

      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      });

      optionalFields1.forEach((field) => {
        if (req.body[field]) {
          const { head, value } = req.body[field];
          if (value === null && head === null) {
            return;
          }
          if (!value || !head) {
            missingFields.push(`${field} must have head and value`);
          }
        }
      });

      optionalFields2.forEach((field) => {
        if (req.body[field]) {
          const { category, color, quantity_in_m, quantity_in_no } =
            req.body[field];
          if (
            category === null &&
            color === null &&
            quantity_in_m === null &&
            quantity_in_no === null
          ) {
            return;
          }
          const missing = findmissingFields(
            req.body[field],
            valuesForoptionalFields2
          );
          if (missing.length > 0) {
            missingFields.push(`${field} Data is missing ${missing}`);
          }
        }
      });

      //VALIDATING TISSUE DATA
      if (req.body.tissue) {
        req.body.tissue.forEach((item, index) => {
          const { category, color, quantity_in_m } = item;
          if (category === null && color === null && quantity_in_m === null) {
            return;
          }
          const missing = findmissingFields([item], tissueFields);
          if (missing.length > 0) {
            missingFields.push(
              `Tissue Number ${index + 1} is missing: ${missing}`
            );
          }
        });
      }

      if (missingFields.length > 0) {
        throw new Error(`Missing fields : ${missingFields}`);
      }

      if (!Array.isArray(shirt) || shirt.length === 0) {
        throw new Error("Shirt details required");
      }

      const hasValidShirt = shirt.some(
        (item) =>
          item.category &&
          item.color &&
          Number(item.quantity_in_no) > 0 &&
          Number(item.quantity_in_m) > 0
      );
      if (!hasValidShirt) {
        throw new Error("Shirt details required");
      }

      if (!per_suit || isNaN(per_suit) || parseFloat(per_suit) <= 0) {
        throw new Error("Invalid Per Suit value");
      }

      if (partytype === "newParty") {
        const checkExistingEmbroidery = await EmbroideryModel.findOne({
          partyName: { $regex: partyName, $options: "i" },
        }).session(session);
        if (checkExistingEmbroidery) {
          throw new CustomError("Party name already in use", 400);
        }
      }

      // INVENTORY BASE STOCK DEDUCTION THROUGH TRANSACTIONS
      const handleInventory = async (items) => {
        if (items && items.length > 0) {
          await Promise.all(
            items?.map(async (item) => {
              const matchedRecord = await BaseModel.findOne({
                category: item.category,
                colors: item.color,
              }).session(session);
              if (matchedRecord) {
                matchedRecord.TYm -= item.quantity_in_m;
                if (matchedRecord.TYm < 0)
                  throw new Error(
                    `Not Enough Stock for category ${item.category} and color ${item.color}`
                  );
                await matchedRecord.save({ session });
              } else {
                throw new Error(
                  `No Stock Found For category ${item.category} and color ${item.color}`
                );
              }
            })
          );
        }
      };

      await handleInventory(shirt);
      await handleInventory(duppata);
      await handleInventory(trouser);
      await handleInventory(tissue);

      let totalQuantityInMForTissue = 0;
      if (req.body.tissue) {
        totalQuantityInMForTissue = tissue.reduce(
          (sum, item) => sum + item.quantity_in_m,
          0
        );
      }

      const lastDocument = await EmbroideryModel.findOne()
        .sort({ _id: -1 })
        .select("serial_No")
        .session(session);
      const lastSerialNo = lastDocument ? lastDocument.serial_No : 0;

      await EmbroideryModel.create(
        [
          {
            partyName,
            Manual_No,
            date,
            per_suit,
            rate_per_stitching,
            project_status,
            design_no,
            shirt,
            duppata,
            trouser,
            discountType,
            discount,
            recieved_suit,
            T_Quantity_In_m,
            T_Quantity,
            T_Suit,
            Front_Stitch,
            Bazo_Stitch,
            Gala_Stitch,
            Back_Stitch,
            Pallu_Stitch,
            Trouser_Stitch,
            D_Patch_Stitch,
            F_Patch_Stitch,
            tissue: totalQuantityInMForTissue,
            tissueData:tissue ?? [],
            serial_No: lastSerialNo + 1,
          },
        ],
        { session }
      );
    });

    return res
      .status(200)
      .json({ success: true, message: "Embroidery created Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAllEmbroidery = async (req, res, next) => {
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
    if (partyName) query.partyName =  partyName

    const data = await EmbroideryModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await EmbroideryModel.countDocuments(query);
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

export const getEmbroideryById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Required");
    const data = await EmbroideryModel.findById(id);
    if (!data) throw new Error("Embroidery not found");
    const processAvailability = await buildProcessAvailability({
      sourceStep: ProcessStep.EMBROIDERY,
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

export const updateEmbroidery = async (req, res, next) => {
  try {
    const { id, project_status, shirt, duppata, trouser } = req.body;
    if (!id) throw new Error("Emroidery Id Not Found");
    const embroideryData = await EmbroideryModel.findById(id);
    if (!embroideryData) throw new Error("Emroidery Data Not Found");
    if (project_status) {
      if (project_status === "Completed" && embroideryData.updated === true) {
        embroideryData.project_status = project_status;
      } else
        throw new Error(
          "Status cannot be updated.Please Update return quantity first"
        );
    }
    if (shirt) {
      shirt.forEach((item) => {
        const { received, id } = item;
        const shirtItem = embroideryData.shirt.find(
          (s) =>  s._id.toString() === id
        );
        if (shirtItem) {
          if (Number(received || 0) > Number(shirtItem.quantity_in_no || 0)) {
            throw new Error("Received quantity cannot be greater than sent quantity");
          }
          shirtItem.received = received;
        }
      });
    }
    if (duppata) {
      duppata.forEach((item) => {
        const { received, id } = item;
        const dupattaItem = embroideryData.duppata.find(
          (d) => d._id.toString() === id
        );
        if (dupattaItem) {
          if (Number(received || 0) > Number(dupattaItem.quantity_in_no || 0)) {
            throw new Error("Received quantity cannot be greater than sent quantity");
          }
          dupattaItem.received = received;
        }
      });
    }
    if (trouser) {
      trouser.forEach((item) => {
        const { received, id } = item;
        const trouserItem = embroideryData.trouser.find(
          (t) => t._id.toString() === id
        );
        if (trouserItem) {
          if (Number(received || 0) > Number(trouserItem.quantity_in_no || 0)) {
            throw new Error("Received quantity cannot be greater than sent quantity");
          }
          trouserItem.received = received;
        }
      });
    }
    if (shirt || duppata || trouser) {
      const checkInvalidValue = (value) => {
        return isNaN(value) || value === undefined || value === null
          ? 0
          : value;
      };
      const calculateTotalRecieved = () => {
        let totalRecieved = 0;
        totalRecieved += (shirt || []).reduce(
          (received, item) => received + checkInvalidValue(item.received),
          0
        );
        totalRecieved += (trouser || []).reduce(
          (received, item) => received + checkInvalidValue(item.received),
          0
        );
        totalRecieved += (duppata || []).reduce(
          (received, item) => received + checkInvalidValue(item.received),
          0
        );
        return totalRecieved;
      };
      const calculateShirtRecieved = () => {
        let suit_Recieved = 0;
        suit_Recieved += (shirt || []).reduce(
          (received, item) => received + checkInvalidValue(item.received),
          0
        );
        return suit_Recieved;
      };
      embroideryData.recieved_suit = calculateTotalRecieved();
      embroideryData.T_Recieved_Suit = calculateShirtRecieved();
      embroideryData.updated = true;
    }

    await embroideryData.save();
    return res.status(200).json({
      success: true,
      message: "Updated Successfully",
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getAllDesignNumbers = async (req, res, next) => {
  try {
    const data = await EmbroideryModel.distinct("design_no");
    if (data.length === 0) throw new Error("No Data found for Design Number");
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHeadDataByDesignNo = async (req, res, next) => {
  try {
    const { design_no } = req.body;
    if (!design_no) throw new Error("No Design Number found");
    const data = await EmbroideryModel.aggregate([
      { $match: { design_no } },
      { $sort: { createdAt: -1 } },
      { $limit: 1 },
      {
        $project: {
          partyName: 1,
          design_no: 1,
          Front_Stitch: 1,
          Bazo_Stitch: 1,
          Gala_Stitch: 1,
          Back_Stitch: 1,
          Pallu_Stitch: 1,
          Trouser_Stitch: 1,
          D_Patch_Stitch: 1,
          F_Patch_Stitch: 1,
          shirt: { $arrayElemAt: ["$shirt.category", 0] },
        },
      },
    ]);
    setMongoose();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getPreviousDataBypartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new Error("No Party Name found");
    const Embquery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
      process_Category: "Embroidery",
    };
    let embData = await EmbroideryModel.find(Embquery, ["partyName"]);
    embData = Array.from(
      new Map(embData.map((item) => [item.partyName, item])).values()
    );
    const accountData = await processBillsModel.find(billQuery, [
      "virtual_account",
      "partyName",
    ]);
    const data = {
      embroideryData: embData,
      accountData: accountData,
    };
    setMongoose();
    return res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteEmbroidery = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.body;
      if (!id) throw new CustomError("Embroidery Id Required", 404);
      const embroideryData = await EmbroideryModel.findById(id).session(
        session
      );

      if (embroideryData) {
        const trueSteps = await getActiveNextSteps({
          embroidery: embroideryData,
          session,
        });
        if (trueSteps.length > 0) {
          throw new Error(`Cannot Delete Embroidery While ${trueSteps} Found `);
        }
      }

      if (embroideryData.bill_generated) {
        throw new Error(
          "Deletion not permitted. A bill has already been generated for this embroidery entry."
        );
      }

      if (embroideryData.pictures_Order) {
        throw new CustomError("Deletion not permitted. Pictures order exist for this embroidery", 400);
      }
      const addInStock = async (items) => {
        if (items && items.length > 0) {
          await Promise.all(
            items?.map(async (item) => {
              const matchedRecord = await BaseModel.findOne({
                category: item.category,
                colors: item.color,
              }).session(session);
              if (matchedRecord) {
                matchedRecord.TYm += item.quantity_in_m;
                await matchedRecord.save({ session });
              } else {
                throw new Error(
                  `No Stock Found For category ${item.category} and color ${item.color}`
                );
              }
            })
          );
        }
      };

      const processStockUpdate = async (oderData) => {
        const stockItmes = [
          { key: "shirt", items: embroideryData.shirt },
          { key: "trouser", items: embroideryData.trouser },
          { key: "duppata", items: embroideryData.duppata },
        ];
        for (const { key, items } of stockItmes) {
          if (oderData[key]) {
            await addInStock(items);
          }
        }
      };

      await processStockUpdate(embroideryData);

      await EmbroideryModel.findByIdAndDelete(id).session(session);
      res.status(200).json({
        success: true,
        message: "Embroidery deleted successfully",
      });
    });
  } catch (error) {
    next(error);
  } finally {
    session.endSession();
  }
};

export const replaceEmroideryData = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        partyName,
        partytype,
        Manual_No,
        date,
        per_suit,
        project_status,
        design_no,
        discountType,
        discount,
        shirt,
        duppata,
        trouser,
        recieved_suit,
        T_Quantity_In_m,
        T_Quantity,
        T_Suit,
        Front_Stitch,
        Bazo_Stitch,
        Gala_Stitch,
        Back_Stitch,
        Pallu_Stitch,
        Trouser_Stitch,
        D_Patch_Stitch,
        F_Patch_Stitch,
        tissue,
        rate_per_stitching,
        id
      } = req.body;

      const requiredFields = [
        "partyName",
        "Manual_No",
        "partytype",
        "date",
        "per_suit",
        "project_status",
        "design_no",
        "T_Quantity_In_m",
        "T_Quantity",
        "rate_per_stitching",
        "id"
      ];

      const optionalFields1 = [
        "Front_Stitch",
        "Bazo_Stitch",
        "Gala_Stitch",
        "Back_Stitch",
        "Pallu_Stitch",
        "Trouser_Stitch",
        "D_Patch_Stitch",
        "F_Patch_Stitch",
      ];

      const optionalFields2 = ["shirt", "duppata", "trouser"];
      const valuesForoptionalFields2 = [
        "category",
        "color",
        "quantity_in_m",
        "quantity_in_no",
      ];
      const tissueFields = ["category", "color", "quantity_in_m"];

      const findmissingFields = (data, requiredSubFields) => {
        return data
          .map((item) => {
            const missingData = requiredSubFields.filter(
              (field) => !item[field]
            );
            if (missingData.length > 0) {
              return missingData;
            }
            return null;
          })
          .filter(Boolean);
      };
      const missingFields = [];

      requiredFields.forEach((field) => {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      });

      optionalFields1.forEach((field) => {
        if (req.body[field]) {
          const { head, value } = req.body[field];
          if (value === null && head === null) {
            return;
          }
          if (!value || !head) {
            missingFields.push(`${field} must have head and value`);
          }
        }
      });

      optionalFields2.forEach((field) => {
        if (req.body[field]) {
          const { category, color, quantity_in_m, quantity_in_no } =
            req.body[field];
          if (
            category === null &&
            color === null &&
            quantity_in_m === null &&
            quantity_in_no === null
          ) {
            return;
          }
          const missing = findmissingFields(
            req.body[field],
            valuesForoptionalFields2
          );
          if (missing.length > 0) {
            missingFields.push(`${field} Data is missing ${missing}`);
          }
        }
      });

      //VALIDATING TISSUE DATA
      if (req.body.tissue) {
        req.body.tissue.forEach((item, index) => {
          const { category, color, quantity_in_m } = item;
          if (category === null && color === null && quantity_in_m === null) {
            return;
          }
          const missing = findmissingFields([item], tissueFields);
          if (missing.length > 0) {
            missingFields.push(
              `Tissue Number ${index + 1} is missing: ${missing}`
            );
          }
        });
      };

      if (missingFields.length > 0) {
        throw new Error(`Missing fields : ${missingFields}`);
      };

      if (!per_suit || isNaN(per_suit) || parseFloat(per_suit) <= 0) {
        throw new Error("Invalid Per Suit value");
      };

      if (partytype === "newParty") {
        const checkExistingEmbroidery = await EmbroideryModel.findOne({
          partyName: { $regex: partyName, $options: "i" },
        }).session(session);
        if (checkExistingEmbroidery) {
          throw new CustomError("Party name already in use", 400);
        }
      };

      const oldEmbroideryData = await EmbroideryModel.findById(id).session(session);
      const isEmbroideryEditable = () => {
      const { project_status, bill_generated, updated, next_steps } = oldEmbroideryData;
      const isNextStepsTrue = Object.entries(next_steps).some(item => item[1] === true);
      if (project_status === "Pending" && !bill_generated && !updated && !isNextStepsTrue){
       return true
      };
        return false;
       };
       if(!isEmbroideryEditable()){
        throw new Error("Failed to update embroidery")
       };

      // ADD BASE STOCK BACK INTO INVENTORY

       const addInStock = async (items) => {
        if (items && items.length > 0) {
          await Promise.all(
            items?.map(async (item) => {
              const matchedRecord = await BaseModel.findOne({
                category: item.category,
                colors: item.color,
              }).session(session);
              if (matchedRecord) {
                matchedRecord.TYm += item.quantity_in_m;
                await matchedRecord.save({ session });
              } else {
                throw new Error(
                  `No Stock Found For category ${item.category} and color ${item.color}`
                );
              }
            })
          );
        }
      };

      const processStockUpdate = async (oderData) => {
        const stockItmes = [
          { key: "shirt", items: oldEmbroideryData.shirt },
          { key: "trouser", items: oldEmbroideryData.trouser },
          { key: "duppata", items: oldEmbroideryData.duppata },
          { key: "tissueData", items: oldEmbroideryData.tissueData },
        ];
        for (const { key, items } of stockItmes) {
          if (oderData[key]) {
            await addInStock(items);
          }
        }
      };

      await processStockUpdate(oldEmbroideryData);


      // INVENTORY BASE STOCK DEDUCTION WITH UPDATED EMBROIDERY DATA

      const handleInventory = async (items) => {
        if (items && items.length > 0) {
          await Promise.all(
            items?.map(async (item) => {
              const matchedRecord = await BaseModel.findOne({
                category: item.category,
                colors: item.color,
              }).session(session);
              if (matchedRecord) {
                matchedRecord.TYm -= item.quantity_in_m;
                if (matchedRecord.TYm < 0)
                  throw new Error(
                    `Not Enough Stock for category ${item.category} and color ${item.color}`
                  );
                await matchedRecord.save({ session });
              } else {
                throw new Error(
                  `No Stock Found For category ${item.category} and color ${item.color}`
                );
              }
            })
          );
        }
      };

      await handleInventory(shirt);
      await handleInventory(duppata);
      await handleInventory(trouser);
      await handleInventory(tissue);

      let totalQuantityInMForTissue = 0;
      if (req.body.tissue) {
        totalQuantityInMForTissue = tissue.reduce(
          (sum, item) => sum + item.quantity_in_m,
          0
        );
      };

      await EmbroideryModel.findOneAndReplace(
        {_id:id},
          {
            partyName,
            Manual_No,
            date,
            per_suit,
            rate_per_stitching,
            project_status,
            design_no,
            shirt,
            duppata,
            trouser,
            discountType,
            discount,
            recieved_suit,
            T_Quantity_In_m,
            T_Quantity,
            T_Suit,
            Front_Stitch,
            Bazo_Stitch,
            Gala_Stitch,
            Back_Stitch,
            Pallu_Stitch,
            Trouser_Stitch,
            D_Patch_Stitch,
            F_Patch_Stitch,
            tissue: totalQuantityInMForTissue,
            tissueData:tissue ?? [],
            serial_No: oldEmbroideryData.serial_No,
          },
        { new: true, session }
      );

    });

    return res
      .status(200)
      .json({ success: true, message: "Embroidery updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const updateVerificationStatus = async (req,res, next) => {
  try {
    const id = req.params.id;
    if(!id) throw new CustomError("Embroidery id is missing", 422);
    const update = await EmbroideryModel.findByIdAndUpdate(id,[
      {
        $set: {
          is_verified: { $not: "$is_verified"}
        }
      }
    ], {new:true});
    if(!update) throw new CustomError("Failed to update embroidery", 400);
    res.status(200).json({success: true, message: "Embroidery verification status updated successfully"})
  } catch (error) {
    next(error)
  }
}

export const getProcessFiltersData = async (req, res) => {
  try {
    const category = req.params.category;
    if(!category) {
      throw new error("Please provide process category")
    };
    const processModelMapping = {
      embroidery: EmbroideryModel,
      calender: CalenderModel,
      cutting: CuttingModel,
      stitching: StitchingModel,
      stones: StoneModel
    };

    const [partyNames, designNumbers] = await Promise.all([
      processModelMapping[category].find().distinct('partyName'),
      EmbroideryModel.distinct("design_no")
    ]);

    const data = {
      partyNames,
      designNumbers
    };
    res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export const getProcessAnalytics = async (req, res, next) => {
  try {
    const dateFrom = req.query.dateFrom || "";
    const dateTo = req.query.dateTo || "";
    const category = req.query.category || "Embroidery";
    const analyticsConfig = getProcessAnalyticsConfig(category);

    if (!analyticsConfig) {
      throw new CustomError("Invalid process analytics category", 400);
    }

    const dateQuery = getDateQuery({
      dateFrom,
      dateTo,
      isDateType: analyticsConfig.isDateType,
    });
    const query = dateQuery ? { date: dateQuery } : {};
    const records = await analyticsConfig.model.find(query).lean();

    const section = getProcessSummary({
      label: analyticsConfig.label,
      records,
      unit: analyticsConfig.unit,
      sentLabel: analyticsConfig.sentLabel,
      receivedLabel: analyticsConfig.receivedLabel,
      quantityReader: analyticsConfig.quantityReader,
      extra: analyticsConfig.extra?.(records) || {},
    });

    setMongoose();
    return res.status(200).json({
      success: true,
      filters: { dateFrom, dateTo, category },
      data: section,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const getProcessAnalyticsConfig = (category) => {
  const configs = {
    Embroidery: {
      label: "Embroidery",
      model: EmbroideryModel,
      isDateType: true,
      unit: "suit",
      sentLabel: "Sent Suits",
      receivedLabel: "Received Suits",
      quantityReader: (record) => ({
        sent: toNumber(record.T_Suit ?? record.T_Quantity),
        received: toNumber(record.T_Recieved_Suit ?? record.recieved_suit),
        sentMeters: toNumber(record.T_Quantity_In_m),
      }),
      extra: (records) => ({
        sentMeters: records.reduce(
          (sum, record) => sum + toNumber(record.T_Quantity_In_m),
          0
        ),
        packedCompleted: records.filter(
          (record) =>
            record.project_status === "Completed" &&
            record.next_steps?.packing === true
        ).length,
      }),
    },
    Calender: {
      label: "Calender",
      model: CalenderModel,
      unit: "m",
      sentLabel: "Sent Meters",
      receivedLabel: "Received Meters",
      quantityReader: (record) => ({
        sent: toNumber(record.T_Quantity),
        received: toNumber(record.r_quantity),
      }),
    },
    Cutting: {
      label: "Cutting",
      model: CuttingModel,
      isDateType: true,
      unit: "suit",
      sentLabel: "Sent Suits",
      receivedLabel: "Received Suits",
      quantityReader: (record) => ({
        sent: toNumber(record.T_Quantity),
        received: toNumber(record.r_quantity),
      }),
    },
    Stones: {
      label: "Stones",
      model: StoneModel,
      unit: "suit",
      sentLabel: "Sent Suits",
      receivedLabel: "Received Suits",
      quantityReader: (record) => ({
        sent: getStoneSentQuantity(record),
        received: toNumber(record.r_quantity),
      }),
    },
    Stitching: {
      label: "Stitching",
      model: StitchingModel,
      unit: "suit",
      sentLabel: "Sent Suits",
      receivedLabel: "Received Suits",
      quantityReader: (record) => ({
        sent: toNumber(record.Quantity),
        received: toNumber(record.r_quantity),
      })
    },
  };

  return configs[category];
};

const toNumber = (value) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : 0;
};

const getDateQuery = ({ dateFrom, dateTo, isDateType = false }) => {
  if (!dateFrom && !dateTo) return null;

  if (!isDateType) {
    return buildDateRangeQuery(dateFrom, dateTo);
  }

  const from = dateFrom || dateTo;
  const to = dateTo || dateFrom;
  const [startDate, endDate] = [from, to].sort();

  return {
    $gte: new Date(`${startDate}T00:00:00.000Z`),
    $lte: new Date(`${endDate}T23:59:59.999Z`),
  };
};

const getStatusCounts = (records, statusField) =>
  records.reduce(
    (acc, record) => {
      const status = record[statusField] || "Pending";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    { Pending: 0, Completed: 0 }
  );

const getProcessSummary = ({
  label,
  records,
  unit,
  sentLabel,
  receivedLabel,
  quantityReader,
  extra = {},
}) => {
  const totals = records.reduce(
    (acc, record) => {
      const quantity = quantityReader(record);
      acc.sent += quantity.sent;
      acc.received += quantity.received;
      return acc;
    },
    { sent: 0, received: 0 }
  );

  return {
    label,
    unit,
    sentLabel,
    receivedLabel,
    totalRecords: records.length,
    statuses: getStatusCounts(records, "project_status"),
    sent: totals.sent,
    received: totals.received,
    parties: getPartyBreakdown(records, quantityReader),
    ...extra,
  };
};

const getPartyBreakdown = (records, quantityReader) => {
  const partyMap = records.reduce((acc, record) => {
    const partyName = record.partyName || "Unknown";
    if (!acc[partyName]) {
      acc[partyName] = {
        partyName,
        records: 0,
        sent: 0,
        received: 0,
        sentMeters: 0,
        receivedMeters: 0,
        pending: 0,
        completed: 0,
        billsGenerated: 0,
      };
    }

    const quantity = quantityReader(record);
    acc[partyName].records += 1;
    acc[partyName].sent += quantity.sent || 0;
    acc[partyName].received += quantity.received || 0;
    acc[partyName].sentMeters += quantity.sentMeters || 0;
    acc[partyName].receivedMeters += quantity.receivedMeters || 0;
    acc[partyName].pending += record.project_status === "Pending" ? 1 : 0;
    acc[partyName].completed += record.project_status === "Completed" ? 1 : 0;
    acc[partyName].billsGenerated += record.bill_generated ? 1 : 0;
    return acc;
  }, {});

  return Object.values(partyMap).sort((a, b) => b.sent - a.sent);
};

const getStoneSentQuantity = (record) =>
  (record.category_quantity || []).reduce(
    (sum, item) => sum + toNumber(item.quantity),
    0
  );
