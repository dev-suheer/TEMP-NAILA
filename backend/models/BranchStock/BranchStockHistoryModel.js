import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const returnAllocationSchema = new mongoose.Schema(
  {
    main_quantity: { type: Number, default: 0 },
    main_Item_Id: { type: mongoose.Types.ObjectId, default: null },
    main_d_no: { type: Number },
    main_category: { type: String },
    main_color: { type: String },
    b_pair_quantity: { type: Number, default: 0 },
    b_pair_sale_price: { type: Number, default: 0 },
  },
  { _id: false }
);

const branchHistorySchema = new mongoose.Schema({
  branchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: [true, "Branch id is required"],
  },
  bundleStatus: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default:"Pending"
  },
  transferType: {
    type: String,
    enum: ["TO_BRANCH", "RETURN_TO_MAIN"],
    default: "TO_BRANCH",
  },
  issueDate: {
    type: String,
    required: [true, "Issue date is required"],
  },
  updatedOn: {
    type: String,
    default:null
  },
  note:{
    type:String,
    required: [true, "Note is required"],
  },
  bundles: [
    [
      {
        category: {
          type: String,
          required: [true, "Category required"],
        },
        color: {
          type: String,
          required: [true, "Color required"],
        },
        stitch_type: {
          type: String,
          enum: Object.values(StitchType),
          default: StitchType.UNSTITCHED,
        },
        quantity: {
          type: Number,
          required: [true, "Quantity is required"],
        },
        cost_price: {
          type: Number,
          required: [true, "Cost price is required"],
        },
        sale_price: {
          type: Number,
          required: [true, "Sale price is required"]
        },
        d_no: {
          type: Number,
          required: [true, "Design number required"],
        },
        Item_Id: {
          type: mongoose.Types.ObjectId,
          required: [true, "Suit Id is Required"],
        },
        branchStock_Id: {
          type: mongoose.Types.ObjectId,
        },
        allocation: {
          type: returnAllocationSchema,
          default: undefined,
        },
      },
    ],
  ],
},
{timestamps:true}
);

branchHistorySchema.index({ branchId: 1, createdAt: -1 });
branchHistorySchema.index({ branchId: 1, bundleStatus: 1, createdAt: -1 });
branchHistorySchema.index({ branchId: 1, transferType: 1, bundleStatus: 1, createdAt: -1 });

export const branchStockHistoryModel = mongoose.model("Branch Stock History",branchHistorySchema)
