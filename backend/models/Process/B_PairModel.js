import mongoose from "mongoose";
import { BPairSource } from "../../enums/BillType.js";
import { StitchType } from "../../enums/StitchType.js";

const partySchema = new mongoose.Schema(
  {
    process_step: {
      type: String,
      enum: ["Embroidery", "Calender", "Cutting", "Stone", "Stitching"],
      required: [true, "Process step is required"],
    },
    process_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Process id is required"],
    },
    partyName: {
      type: String,
      required: [true, "Party name is required"],
    },
  },
  { _id: false }
);

const recordSchema = new mongoose.Schema(
  {
    date: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    sale_price: {
      type: Number,
      required: [true, "Sale price is required"],
    },
    source: {
      type: String,
      enum: Object.values(BPairSource),
      required: [true, "B Pair source is required"],
    },
    embroidery_Id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    packing_Id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    serial_No: {
      type: Number,
    },
    Manual_No: {
      type: String,
    },
    parties: {
      type: [partySchema],
      default: [],
    },
    branchId: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    branch_stock_history_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
  },
  { timestamps: true }
);

const B_PairSchema = new mongoose.Schema(
  {
    d_no: {
      type: Number,
      required: [true, "Design No is Required"],
    },
    category: {
      type: String,
      required: [true, "Category is Required"],
    },
    color: {
      type: String,
      required: [true, "Color is Required"],
    },
    stitch_type: {
      type: String,
      enum: Object.values(StitchType),
      default: StitchType.UNSTITCHED,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true,
    },
    quantity: {
      type: Number,
      default: 0,
    },
    sold_quantity: {
      type: Number,
      default: 0,
    },
    sale_price: {
      type: Number,
      required: [true, "Sale price is Required"],
    },
    all_records: [recordSchema],
  },
  { timestamps: true }
);

B_PairSchema.index({ d_no: 1, category: 1, color: 1 });
B_PairSchema.index({ quantity: -1, createdAt: -1 });
B_PairSchema.index({ category: 1, quantity: -1, createdAt: -1 });

export const B_PairModel = mongoose.model("B_Pair", B_PairSchema);
