import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const suits_return_details = new mongoose.Schema({
  id: {
    type: String,
    required: [true, "Suit Id is required"],
  },
  d_no: {
    type: Number,
    required: [true, "Design No is required"],
  },
  color: {
    type: String,
    required: [true, "color value is required"],
  },
  category: {
    type: String,
    required: [true, "category valuerequired"],
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
    required: [true, "Quantity value is required"],
  },
  price: {
    type: Number,
    required: [true, "Price value is required"],
  },
});

const returnSchema = new mongoose.Schema(
  {
    branchId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Branch Id required"],
    },
    buyerId: {
      type: mongoose.Types.ObjectId,
      required: [true, "Buyer Id required"],
    },
    bill_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Bill id is required"]
    },
    partyName: {
      type: String,
      required: [true, "Party Name is Required"],
    },
    serialNumber: {
      type: String,
      required: [true, "Serial Number is required"],
    },
    phone: {
      type: String,
      required: [true, "Phone value is required"],
    },
    date: {
      type: String,
      required: [true, "Date value is required"],
    },
    T_Return_Amount: {
      type: Number,
      required: [true, "Total Return Amount required"],
    },
    Amount_From_Balance: {
      type: Number,
      required: [true, "Amount From Balance required"],
    },
    Amount_Payable: {
      type: Number,
      required: [true, "Amount From Total Cash required"],
    },
    suits_data: [suits_return_details],
  },
  { timestamps: true }
);

returnSchema.index({ branchId: 1, createdAt: -1 });
returnSchema.index({ branchId: 1, partyName: 1, createdAt: -1 });

export const ReturnSuitModel = mongoose.model("Return Bills", returnSchema);
