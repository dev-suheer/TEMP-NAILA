import mongoose from "mongoose";

const category_schema = new mongoose.Schema({
  category: {
    type: String,
    required: [true, "Category Name Required"],
    enum: ["Front"],
  },
  color: {
    type: String,
    required: [true, "Color Value Required"],
  },
  quantity: {
    type: Number,
    required: [true, "Qunatity Vlaue Required"],
  },
  recieved_Data: {
    first: {
      quantity: {
        type: Number,
        default: 0,
      },
      date: {
        type: String,
        default: '',
      },
    },
    second: {
        quantity: {
          type: Number,
          default: 0,
        },
        date: {
          type: String,
          default: '',
        },
      },
    third: {
        quantity: {
          type: Number,
          default: 0,
        },
        date: {
          type: String,
          default: '',
        },
      },
    r_total: {
      type: Number,
      default: 0,
    },
    r_date: {
        type: String,
        default: '',
      },
  },
},{ timestamps: true });

const stoneSchema = new mongoose.Schema(
  {
    embroidery_Id: {
      type: mongoose.Types.ObjectId,
      required: [true, "Embroidery Id required"],
    },
    source_step: {
      type: String,
      enum: ["Embroidery", "Calender", "Cutting", "Stone", "Stitching"],
      default: "Cutting",
    },
    source_id: {
      type: mongoose.Types.ObjectId,
      default: null,
    },
    cuttingId: {
      type:String
    },
    serial_No: {
      type: Number,
      required: [true, "Serial No required"],
    },
    Manual_No: {
      type: String,
    },
    T_Quantity: {
      type: Number,
    },
    design_no: {
      type: String,
      required: [true, "Design no value required"],
    },
    date: {
      type: String,
      required: [true, "date required"],
    },
    partyName: {
      type: String,
      required: [true, "Party Name required"],
    },
    rate: {
      type: Number,
      required: [true, "Rate value required"],
    },
    r_quantity: {
      type: Number,
      default: null,
    },
    project_status: {
      type: String,
      enum: ["Pending", "Completed"],
      default: "Pending",
    },
    category_quantity: {
      type: [category_schema],
      required: [true, "Quantity required"],
    },
    bill_generated : {
      type: Boolean,
      default: false
    },
    updated : {
      type: Boolean,
      default: false
    },
     additionalExpenditure: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

stoneSchema.index({ project_status: 1, createdAt: -1 });
stoneSchema.index({ partyName: 1, createdAt: -1 });
stoneSchema.index({ date: -1 });
stoneSchema.index({ embroidery_Id: 1 });
stoneSchema.index({ design_no: 1, createdAt: -1 });
stoneSchema.index({ Manual_No: 1, createdAt: -1 });
stoneSchema.index({ embroidery_Id: 1, design_no: 1 });
stoneSchema.index({ cuttingId: 1 });
stoneSchema.index({ source_step: 1, source_id: 1, createdAt: -1 });

export const StoneModel = mongoose.model("Stone", stoneSchema);
