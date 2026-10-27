import { StitchingModel } from "../../models/Process/StitchingModel.js";
import { LaceModel } from "../../models/Stock/Lace.Model.js";
import { SuitsModel } from "../../models/Stock/Suits.Model.js";
import { setMongoose } from "../../utils/Mongoose.js";
import mongoose from "mongoose";
import { BagsAndBoxModel } from "../../models/Stock/BagsAndBoxModel.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { processBillsModel } from "../../models/Process/ProcessBillsModel.js";
import { PicruresModel } from "../../models/Process/PicturesModel.js";
import {
  getPaginationParams,
  getTodayDate,
  stitchTypeQuery,
  stockNameQuery,
  toStitchType,
} from "../../utils/Common.js";
import {
  assertSourceCanCreateNextStep,
  buildProcessAvailability,
  ProcessStep,
  sumPackingQuantity,
} from "../../utils/ProcessQuantity.js";
import {
  addBPairStock,
  applyPackingPenalties,
  getPenaltyParties,
} from "./B_PairController.js";
import { BPairSource } from "../../enums/BillType.js";
import { PackingModel } from "../../models/Process/PackingModel.js";
import { assertSkuFree, getSuitSku } from "../../utils/SuitSku.js";

export const addStitching = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const {
        embroidery_Id,
        Quantity,
        partyName,
        partytype,
        serial_No,
        design_no,
        date,
        rate,
        lace_quantity,
        lace_category,
        suits_category,
        source_step,
        source_id,
      } = req.body;
      const requiredFields = [
        "partytype",
        "embroidery_Id",
        "partyName",
        "rate",
        "design_no",
        "serial_No",
        "date",
        "Quantity",
      ];

      const missingFields = [];
      requiredFields.forEach((field) => {
        if (req.body[field] === undefined || req.body[field] === null) {
          missingFields.push(field);
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing Fields ${missingFields.join(", ")}`);
      }

      if (!Array.isArray(suits_category) || suits_category.length === 0) {
        throw new Error("Suit category is required");
      }

      for (let item of suits_category) {
        if (!item.category || !item.color || !item.quantity_in_no) {
          throw new Error(
            "Each suits category item must have category, color, and quantity"
          );
        }
      }

      if (partytype === "newParty") {
        const checkExistingStitching = await StitchingModel.findOne({
          partyName: { $regex: partyName, $options: "i" },
        }).session(session);
        if (checkExistingStitching) {
          throw new Error("Party name already in use");
        }
      }

      if(lace_quantity && lace_category !== "") {
      const lace = await LaceModel.findOne({ category: lace_category }).session(
        session
      );
      if (!lace) throw new Error("Please select valid lace category");
      if (parseInt(lace_quantity) > lace.totalQuantity)
        throw new Error("Not enough lace in stock");
      const newLaceTotalQuantity =
        parseInt(lace.totalQuantity) - parseInt(lace_quantity);
      await LaceModel.updateOne(
        { category: lace_category },
        { totalQuantity: newLaceTotalQuantity }
      ).session(session);
      }

      //GET MAIN EMBROIDERY DATA
      const mainEmbroidery = await EmbroideryModel.findById(
        embroidery_Id
      ).session(session);
      if (!mainEmbroidery) throw new Error("Embroidery record not found");
      const sourceStep = source_step || ProcessStep.EMBROIDERY;
      const sourceId = source_id || embroidery_Id;

      await assertSourceCanCreateNextStep({
        sourceStep,
        sourceId,
        requestedQuantity: Quantity,
        requestedRows: suits_category.map((item) => ({
          color: item.color,
          quantity: item.quantity_in_no,
        })),
        session,
      });

      await StitchingModel.create(
        [
          {
            embroidery_Id,
            source_step: sourceStep,
            source_id: sourceId,
            Quantity,
            partyName,
            serial_No,
            design_no,
            date,
            rate,
            lace_quantity,
            lace_category,
            suits_category,
            Manual_No:mainEmbroidery.Manual_No
          },
        ],
        { session }
      );

      //UPDATE MAIN EMBROIDERY NextStep
      mainEmbroidery.next_steps.stitching = true;
      await mainEmbroidery.save({ session });
    });

    return res
      .status(200)
      .json({ success: true, message: "Added Successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const getAllStitching = async (req, res, next) => {
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

    const data = await StitchingModel.find(query)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    const total = await StitchingModel.countDocuments(query);
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

export const getStitchingById = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Id Required");
    const data = await StitchingModel.findById(id);
    if (!data) throw new Error("Stitching not found");
    const processAvailability = await buildProcessAvailability({
      sourceStep: ProcessStep.STITCHING,
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

export const getStitchingByEmbroideryId = async (req, res, next) => {
  try {
    const { embroidery_Id } = req.body;
    if (!embroidery_Id) throw new Error("Embroidery Id Required");
    const data = await StitchingModel.findOne({ embroidery_Id });
    if (!data) throw new Error("No Stitching Data For This Embroidery");
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateStitching = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id, suits_category, project_status } = req.body;
      if (!id) throw new Error("Id not Found");
      const stitching = await StitchingModel.findById(id).session(session);
      if (!stitching) throw new Error("Stitching not Found");

      //UPDATING PROJECT STATUS
      if (project_status === "Completed") {
        stitching.project_status = project_status;
      }

      //UPDATING RECIEVED QUANTITY
      const updateFunction = (data, updateStitchingRQuantity = true) => {
        for (const category in data) {
          const items = data[category];
          items &&
            items.forEach((item) => {
              const { return_quantity, id, sale_price, cost_price } = item;
              let toUpdate = stitching[category].find((obj) => obj._id == id);
              if (!toUpdate) {
                throw new Error("Stitching row not found");
              }
              if (Number(return_quantity || 0) > Number(toUpdate.quantity_in_no || 0)) {
                throw new Error("Received quantity cannot be greater than sent quantity");
              }
              let new_r_quantity = stitching.r_quantity - toUpdate.recieved;
              toUpdate.recieved = return_quantity;
              toUpdate.sale_price = sale_price;
              toUpdate.cost_price = cost_price;
              if (updateStitchingRQuantity) {
                stitching.r_quantity = new_r_quantity + toUpdate.recieved;
                stitching.updated = true;
              }
            });
        }
      };

      if (suits_category) {
        updateFunction({ suits_category });
      }

      if (stitching.r_quantity > stitching.Quantity) {
        throw new Error("Invalid Update Quantity");
      }

      await stitching.save({ session });
      return res
        .status(200)
        .json({ success: true, message: "Updated Successfully" });
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

export const deleteStitching = async (req, res, next) => {
  try {
    const { id } = req.body;
    if (!id) throw new Error("Stitching Id Required");
    const data = await StitchingModel.findById(id);
    if (!data) throw new Error("Stitching Not Found");
    const embData = await EmbroideryModel.findById(data.embroidery_Id);
    if (!embData) throw new Error("No embroidery record found for this cutting.");
    if (data.bill_generated) {
      throw new Error("Deletion not permitted. This stitching step bill has already been generated.");
    }
    if (data.packed) {
      throw new Error("Deletion not permitted. This stitching step has already been packed.");
    }
    if(data.lace_quantity > 0 && data.lace_category !== null) {
      const lace = await LaceModel.findOne({category:data.lace_category});
      lace.totalQuantity += data.lace_quantity;
      await lace.save();
    };
    await StitchingModel.findByIdAndDelete(id);
    embData.next_steps.stitching = !!(await StitchingModel.exists({
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

export const getStitchingDataBypartyName = async (req, res, next) => {
  try {
    const { partyName } = req.body;
    if (!partyName) throw new Error("No Party Name found");
    const StitchingQuery = {
      partyName: { $regex: partyName, $options: "i" },
    };
    const billQuery = {
      partyName: { $regex: partyName, $options: "i" },
      process_Category: "Stitching",
    };
    let stitchingData = await StitchingModel.find(StitchingQuery, [
      "partyName",
    ]);
    stitchingData = Array.from(
      new Map(stitchingData.map((item) => [item.partyName, item])).values()
    );
    const accountData = await processBillsModel.find(billQuery, [
      "virtual_account",
      "partyName",
    ]);
    const data = {
      stitchingData: stitchingData,
      accountData: accountData,
    };
    setMongoose();
    return res.status(200).send(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const addSuitsInStock = async (data, session) => {
  try {
    const { category, color, stitch_type, quantity, cost_price, sale_price, d_no,useBags, Manual_No, serial_No, includes_pictures, embroidery_Id, record_id } = data;
    if (!category || !color || !quantity || !cost_price || !sale_price || !d_no || !Manual_No || !serial_No || !embroidery_Id || includes_pictures === undefined || useBags === undefined)
      throw new Error("Missing fields for adding suits in stock");
    const existingSuitWithDNo = await SuitsModel.findOne({ d_no }).session(
      session
    );

    if (
      existingSuitWithDNo &&
      existingSuitWithDNo.category.trim().toLowerCase() !== category.trim().toLowerCase()
    ) {
      throw new Error(
        `The Design No ${d_no} is already assigned to the category '${existingSuitWithDNo.category}'`
      );
    }

    const checkExistingSuitStock = await SuitsModel.findOne({
      d_no,
      category: stockNameQuery(category),
      color: stockNameQuery(color),
      stitch_type: stitchTypeQuery(stitch_type),
    }).session(session);
    
    //DEDUCTING BAGS FROM STOCK

    if(useBags){
      const bagsStock = await BagsAndBoxModel.findOne({ name: "Bags" }).session(
        session
      );
      if (!bagsStock) throw new Error("Bags Stock Not Found");
      const updatedBagsQuantity = bagsStock.totalQuantity - quantity;
      if (updatedBagsQuantity < 0) throw new Error("Not Enough Bags In Stock");
      bagsStock.totalQuantity = updatedBagsQuantity;
      await bagsStock.save({ session });
    };
  
    const today = getTodayDate();
    let recordData = { ...(record_id && { _id: record_id }), date: today, quantity, cost_price, sale_price, Manual_No, embroidery_Id, serial_No, bags_used:useBags, includes_pictures, is_stock_source_packing:true };
    if (
      checkExistingSuitStock &&
      checkExistingSuitStock.color.trim().toLowerCase() === color.trim().toLowerCase()
    ) {
      (checkExistingSuitStock.quantity += parseInt(quantity)),
        (checkExistingSuitStock.cost_price = cost_price),
        (checkExistingSuitStock.sale_price = sale_price);
      checkExistingSuitStock.all_records.push(recordData);
      await checkExistingSuitStock.save({ session });
      return { success: true, message: "Successfully Added", suit_id: checkExistingSuitStock._id };
    } else {
      const sku = await getSuitSku({ d_no, category, color, stitch_type, session });
      await assertSkuFree(SuitsModel, sku, session);
      const [createdSuit] = await SuitsModel.create(
        [
          {
            category: category.trim(),
            color: color.trim(),
            stitch_type,
            sku,
            quantity,
            cost_price,
            sale_price,
            d_no,
            all_records: [recordData],
          },
        ],
        { session }
      );
      return { success: true, message: "Successfully Added", suit_id: createdSuit._id };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
};

const addPackedRowInStock = async ({ item, common, parties }, session) => {
  const receivedQuantity = Number(item.return_quantity) || 0;
  const bPairQuantity = Number(item.b_pair_quantity) || 0;
  if (
    !Number.isInteger(bPairQuantity) ||
    bPairQuantity < 0 ||
    bPairQuantity > receivedQuantity
  ) {
    throw new Error(`Invalid B Pair quantity for ${item.color}`);
  }
  const mainQuantity = receivedQuantity - bPairQuantity;
  const stitchType = toStitchType(item.stitch_type);
  const suitRecordId = mainQuantity > 0 ? new mongoose.Types.ObjectId() : null;
  const bPairRecordId = bPairQuantity > 0 ? new mongoose.Types.ObjectId() : null;
  let suitId = null;
  let bPairId = null;

  if (mainQuantity > 0 || bPairQuantity === 0) {
    const res = await addSuitsInStock(
      {
        ...item,
        ...common,
        stitch_type: stitchType,
        quantity: mainQuantity,
        record_id: suitRecordId,
      },
      session
    );
    if (res.error) {
      throw new Error(res.error);
    }
    suitId = res.suit_id;
  }

  if (bPairQuantity > 0) {
    const bPair = await addBPairStock(
      {
        d_no: common.d_no,
        category: item.category,
        color: item.color,
        stitch_type: stitchType,
        quantity: bPairQuantity,
        sale_price: item.b_pair_sale_price,
        record: {
          _id: bPairRecordId,
          source: BPairSource.PACKING,
          embroidery_Id: common.embroidery_Id,
          packing_Id: common.packing_Id || null,
          serial_No: common.serial_No,
          Manual_No: common.Manual_No,
          parties,
        },
      },
      session
    );
    bPairId = bPair._id;
  }

  return {
    category: item.category,
    color: item.color,
    stitch_type: stitchType,
    received: receivedQuantity,
    main_quantity: mainQuantity,
    cost_price: Number(item.cost_price) || 0,
    sale_price: Number(item.sale_price) || 0,
    b_pair_quantity: bPairQuantity,
    b_pair_sale_price: bPairQuantity > 0 ? Number(item.b_pair_sale_price) : 0,
    suit_id: suitId,
    suit_record_id: suitRecordId,
    bpair_id: bPairId,
    bpair_record_id: bPairRecordId,
  };
};

export const addInStockFromPackaging = async (req,res,next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { suits_category,dupatta_category, d_no,embroidery_Id,useBags,packing_Id, Manual_No, serial_No, b_pair_parties, source_step, source_id } = req.body;
      const checkPicturesOrder = await PicruresModel.findOne({embroidery_Id:embroidery_Id});
      if(checkPicturesOrder && checkPicturesOrder.status === 'Pending'){
        throw new Error("Please complete the pictures order to add suits stock");
      }
      const rows = [...(suits_category || []), ...(dupatta_category || [])];

      //A PACKING IS COUNTED AGAINST THE STEP IT CAME FROM
      const sourceStep = packing_Id ? ProcessStep.STITCHING : source_step;
      const sourceId = packing_Id || source_id;
      if (!packing_Id) {
        if (
          ![ProcessStep.EMBROIDERY, ProcessStep.CUTTING, ProcessStep.STONE].includes(sourceStep)
        ) {
          throw new Error("Invalid packing source");
        }
        await assertSourceCanCreateNextStep({
          sourceStep,
          sourceId,
          requestedQuantity: sumPackingQuantity(rows),
          requestedRows: rows.map((item) => ({
            color: item.color,
            quantity: item.return_quantity,
          })),
          session,
        });
      }

      //AN ORDER WITH NO EARLIER PACKING (FLAG OR PACKED SUITS RECORD) HAS ALL ITS PACKINGS TRACKED
      const EmbroideryData = await EmbroideryModel.findById(embroidery_Id).session(session);
      const isFirstPacking =
        !EmbroideryData.next_steps.packing &&
        !(await SuitsModel.exists({ "all_records.embroidery_Id": embroidery_Id }).session(session));
      const totalBPairQuantity = rows.reduce(
        (total, item) => total + (Number(item.b_pair_quantity) || 0),
        0
      );
      const penaltyParties =
        totalBPairQuantity > 0
          ? await getPenaltyParties({
              embroidery_Id,
              b_pair_parties,
              total_quantity: totalBPairQuantity,
              session,
            })
          : [];
      //ONLY THE PARTIES THAT DAMAGED THE SUITS, NOT THE LABOUR ONLY DEDUCTIONS
      const parties = penaltyParties
        .filter((party) => party.quantity > 0)
        .map(({ process_step, process_id, partyName }) => ({
          process_step,
          process_id,
          partyName,
        }));
      const common = {
        useBags,
        d_no,
        Manual_No,
        serial_No,
        includes_pictures: !!checkPicturesOrder,
        embroidery_Id,
        packing_Id,
      };
      const packedRows = [];
      for (const item of rows) {
        packedRows.push(await addPackedRowInStock({ item, common, parties }, session));
      };
      const penalties = await applyPackingPenalties({
        parties: penaltyParties,
        serial_No,
        Manual_No,
        design_no: d_no,
        session,
      });
      //UPDATING NEXT STEP IN EMBROIDERY
       if (isFirstPacking) EmbroideryData.packing_tracked = true;
       EmbroideryData.next_steps.packing = true;
       await EmbroideryData.save({ session });

       //UPDATING PACKING STATUS FOR STITCHING
       let stitching_partyName = null;
       if(packing_Id){
        const stitching = await StitchingModel.findById(packing_Id).session(session);
        if(stitching.packed){
          throw new Error("This stitching is slready packed");
        };
        stitching.packed = true;
        await stitching.save({session});
        stitching_partyName = stitching.partyName;
       };

      const sumRows = (field) =>
        packedRows.reduce((total, row) => total + row[field], 0);
      await PackingModel.create(
        [
          {
            embroidery_Id,
            packing_Id: packing_Id || null,
            source_step: sourceStep,
            source_id: sourceId,
            stitching_partyName,
            serial_No,
            Manual_No,
            design_no: d_no,
            date: getTodayDate(),
            useBags: !!useBags,
            includes_pictures: !!checkPicturesOrder,
            total_received: sumRows("received"),
            total_main: sumRows("main_quantity"),
            total_b_pair: sumRows("b_pair_quantity"),
            total_penalty: penalties.reduce((total, penalty) => total + penalty.total_penalty, 0),
            rows: packedRows,
            penalties,
          },
        ],
        { session }
      );
    });
    return res
    .status(200)
    .json({ success: true, message: "Stock added successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
