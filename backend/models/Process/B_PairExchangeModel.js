import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const exchangeItemSchema = new mongoose.Schema(
  {
    bpair_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "B Pair id is required"],
    },
    d_no: {
      type: Number,
      required: [true, "Design No is required"],
    },
    category: {
      type: String,
      required: [true, "Category is required"],
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    stitch_type: {
      type: String,
      enum: Object.values(StitchType),
      default: StitchType.UNSTITCHED,
    },
    sku: {
      type: String,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
  },
  { _id: false }
);

const B_PairExchangeSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Branch Id is required"],
    },
    buyerId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Buyer Id is required"],
    },
    bill_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Bill Id is required"],
    },
    partyName: {
      type: String,
      required: [true, "Party Name is required"],
    },
    serialNumber: {
      type: String,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    note: {
      type: String,
      default: "",
    },
    returned_items: [exchangeItemSchema],
    issued_items: [exchangeItemSchema],
  },
  { timestamps: true }
);

B_PairExchangeSchema.index({ bill_Id: 1, createdAt: -1 });

export const B_PairExchangeModel = mongoose.model(
  "B_Pair Exchange",
  B_PairExchangeSchema
);
