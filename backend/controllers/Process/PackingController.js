import mongoose from "mongoose";
import { PackingModel } from "../../models/Process/PackingModel.js";
import { SuitsModel } from "../../models/Stock/Suits.Model.js";
import { B_PairModel } from "../../models/Process/B_PairModel.js";
import { BagsAndBoxModel } from "../../models/Stock/BagsAndBoxModel.js";
import { EmbroideryModel } from "../../models/Process/EmbroideryModel.js";
import { StitchingModel } from "../../models/Process/StitchingModel.js";
import { setMongoose } from "../../utils/Mongoose.js";
import { getPaginationParams } from "../../utils/Common.js";
import { reversePackingPenalties } from "./B_PairController.js";
import {
  buildProcessAvailability,
  getOrdersPackingProgress,
  ProcessStep,
  syncPackingCounters,
} from "../../utils/ProcessQuantity.js";

const PROGRESS_STEPS = [ProcessStep.CUTTING, ProcessStep.STONE, ProcessStep.STITCHING];

//ONE STEP'S PACKING: WHAT IT RECEIVED, WHERE IT WENT AND ITS ROUNDS (OPENED FROM ITS PACKING ICON)
export const getPackingProgress = async (req, res) => {
  try {
    const { source_step, source_id } = req.body;
    if (!PROGRESS_STEPS.includes(source_step)) throw new Error("Invalid packing source");
    if (!mongoose.Types.ObjectId.isValid(source_id)) throw new Error("Invalid record");

    const data = await buildProcessAvailability({ sourceStep: source_step, sourceId: source_id });
    setMongoose();
    return res.status(200).json(data);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

//A WHOLE ORDER'S PACKING: EACH STEP'S NUMBERS AND EVERY ROUND (OPENED FROM THE ORDER'S PACKING ICON)
export const getOrderPackingProgress = async (req, res) => {
  try {
    const { embroidery_Id } = req.body;
    if (!mongoose.Types.ObjectId.isValid(embroidery_Id)) throw new Error("Invalid order");
    const order = await EmbroideryModel.findById(embroidery_Id);
    if (!order) throw new Error("Order not found");

    const [progress] = await getOrdersPackingProgress([order], { withRecords: true });
    setMongoose();
    return res.status(200).json(progress);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
};

export const getAllPackings = async (req, res, next) => {
  try {
    const { page, limit } = getPaginationParams(req.query);
    const embroidery_Id = req.query.embroidery_Id || "";
    const search = String(req.query.search || "").trim();

    const query = {};
    if (embroidery_Id) {
      if (!mongoose.Types.ObjectId.isValid(embroidery_Id)) {
        throw new Error("Invalid order");
      }
      query.embroidery_Id = embroidery_Id;
    }
    if (search) {
      query.$or = [{ design_no: search }, { Manual_No: search }];
      if (!isNaN(Number(search))) {
        query.$or.push({ serial_No: Number(search) });
      }
    }

    const [totalRecords, data] = await Promise.all([
      PackingModel.countDocuments(query),
      PackingModel.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
    ]);

    setMongoose();
    return res.status(200).json({
      data,
      page,
      limit,
      totalPages: Math.ceil(totalRecords / limit),
      totalRecords,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const deletePacking = async (req, res, next) => {
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const { id } = req.body;
      if (!id) throw new Error("Packing id is required");

      const packing = await PackingModel.findById(id).session(session);
      if (!packing) throw new Error("Packing not found");

      for (const row of packing.rows) {
        const label = `D# ${packing.design_no} (${row.color})`;

        if (row.suit_record_id) {
          const suit = await SuitsModel.findById(row.suit_id).session(session);
          const record = suit?.all_records.id(row.suit_record_id);
          if (!record) throw new Error(`Main stock record not found for ${label}`);
          if (suit.quantity < record.quantity) {
            throw new Error(`${label} main stock is already assigned or sold`);
          }
          suit.quantity -= record.quantity;
          suit.all_records.pull(record._id);
          await suit.save({ session });
        }

        if (row.bpair_record_id) {
          const bPair = await B_PairModel.findById(row.bpair_id).session(session);
          const record = bPair?.all_records.id(row.bpair_record_id);
          if (!record) throw new Error(`B Pair record not found for ${label}`);
          if (bPair.quantity < record.quantity) {
            throw new Error(`${label} B Pair is already sold or exchanged`);
          }
          bPair.quantity -= record.quantity;
          bPair.all_records.pull(record._id);
          await bPair.save({ session });
        }
      }

      if (packing.useBags && packing.total_main > 0) {
        await BagsAndBoxModel.updateOne(
          { name: "Bags" },
          { $inc: { totalQuantity: packing.total_main } }
        ).session(session);
      }

      await reversePackingPenalties(packing.penalties, session);

      //ORDER STAYS PACKED WHILE ANOTHER OF ITS PACKINGS EXISTS
      const otherPacking = await PackingModel.exists({
        embroidery_Id: packing.embroidery_Id,
        _id: { $ne: packing._id },
      }).session(session);
      const legacyPackedStitching = await StitchingModel.exists({
        embroidery_Id: packing.embroidery_Id,
        packed_before_tracking: true,
      }).session(session);
      if (!otherPacking && !legacyPackedStitching) {
        await EmbroideryModel.updateOne(
          { _id: packing.embroidery_Id },
          { $set: { "next_steps.packing": false } }
        ).session(session);
      }

      await PackingModel.deleteOne({ _id: packing._id }).session(session);
      //ITS SUITS BECOME AVAILABLE TO PACK AGAIN
      await syncPackingCounters({
        sourceStep: packing.source_step,
        sourceId: packing.source_id,
        embroidery_Id: packing.embroidery_Id,
        session,
      });
    });

    return res
      .status(200)
      .json({ success: true, message: "Packing deleted successfully" });
  } catch (error) {
    return res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
};
