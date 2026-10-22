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

      if (packing.packing_Id) {
        await StitchingModel.updateOne(
          { _id: packing.packing_Id },
          { $set: { packed: false } }
        ).session(session);
      }

      //ORDER STAYS PACKED WHILE ANOTHER OF ITS PACKINGS EXISTS
      const otherPacking = await PackingModel.exists({
        embroidery_Id: packing.embroidery_Id,
        _id: { $ne: packing._id },
      }).session(session);
      const otherPackedStitching = await StitchingModel.exists({
        embroidery_Id: packing.embroidery_Id,
        packed: true,
      }).session(session);
      if (!otherPacking && !otherPackedStitching) {
        await EmbroideryModel.updateOne(
          { _id: packing.embroidery_Id },
          { $set: { "next_steps.packing": false } }
        ).session(session);
      }

      await PackingModel.deleteOne({ _id: packing._id }).session(session);
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
