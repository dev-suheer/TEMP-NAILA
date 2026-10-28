import mongoose from "mongoose";
import { StitchType } from "../../enums/StitchType.js";

const packingRowSchema = new mongoose.Schema(
  {
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
    received: {
      type: Number,
      required: [true, "Received quantity is required"],
    },
    main_quantity: {
      type: Number,
      default: 0,
    },
    cost_price: {
      type: Number,
    },
    sale_price: {
      type: Number,
    },
    b_pair_quantity: {
      type: Number,
      default: 0,
    },
    b_pair_sale_price: {
      type: Number,
    },
    suit_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    suit_record_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    bpair_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    bpair_record_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
  },
  { _id: false }
);

const penaltySchema = new mongoose.Schema(
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
    account_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Account id is required"],
    },
    entry_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Account entry id is required"],
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
    },
    labour_quantity: {
      type: Number,
      default: 0,
    },
    rate: {
      type: Number,
      default: 0,
    },
    penalty_amount: {
      type: Number,
      default: 0,
    },
    additional_cost: {
      type: Number,
      default: 0,
    },
    total_penalty: {
      type: Number,
      required: [true, "Total penalty is required"],
    },
  },
  { _id: false }
);

const packingSchema = new mongoose.Schema(
  {
    embroidery_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Embroidery id is required"],
    },
    packing_Id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    source_step: {
      type: String,
      enum: ["Embroidery", "Cutting", "Stone", "Stitching"],
      required: [true, "Packing source step is required"],
    },
    source_id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Packing source id is required"],
    },
    stitching_partyName: {
      type: String,
      default: null,
    },
    //PARTY OF THE STEP IT WAS PACKED FROM (ANY STEP)
    source_partyName: {
      type: String,
      default: null,
    },
    //1, 2, 3... PER SOURCE RECORD, STORED SO A ROUND KEEPS ITS NUMBER WHEN AN EARLIER ONE IS DELETED
    round_no: {
      type: Number,
      default: 1,
    },
    serial_No: {
      type: Number,
    },
    Manual_No: {
      type: String,
    },
    design_no: {
      type: String,
    },
    date: {
      type: String,
    },
    useBags: {
      type: Boolean,
      default: false,
    },
    includes_pictures: {
      type: Boolean,
      default: false,
    },
    total_received: {
      type: Number,
      default: 0,
    },
    total_main: {
      type: Number,
      default: 0,
    },
    total_b_pair: {
      type: Number,
      default: 0,
    },
    total_penalty: {
      type: Number,
      default: 0,
    },
    rows: {
      type: [packingRowSchema],
      default: [],
    },
    penalties: {
      type: [penaltySchema],
      default: [],
    },
  },
  { timestamps: true }
);

packingSchema.index({ createdAt: -1 });
packingSchema.index({ embroidery_Id: 1, createdAt: -1 });
packingSchema.index({ source_step: 1, source_id: 1 });

export const PackingModel = mongoose.model("Packing", packingSchema);
