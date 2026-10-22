import mongoose from 'mongoose';

const previousDataSchema = new mongoose.Schema({
  bill_no: {
    type: Number,
    required: [true,"Bill number required"],
  },
  name: {
    type: String,
    required: [true,"Name required"],
  },
  category: {
    type: String,
    required: [true,"Category required"],
    unique:true
  },
  date: {
    type: Date,
    required: [true,"R_date required"],
  },
  quantity: {
    type: String,
    required: [true,"Recently required"],
  },
  bill_id: {
    type: mongoose.Types.ObjectId,
    default: null
  }
})

const laceSchema = new mongoose.Schema({
  bill_no: {
    type: Number,
    required: [true,"Bill number required"],
    unique:true
  },
  name: {
    type: String,
    required: [true,"Name required"],
  },
  category: {
    type: String,
    required: [true,"Category required"],
  },
  r_Date: {
    type: Date,
    required: [true,"R_date required"],
  },
  totalQuantity: {
    type: Number,
    required: [true,"Quantity required"],
  },
  recently: {
    type: Number,
    required: [true,"Recently required"],
  },
  all_Records : [previousDataSchema]
}, { timestamps: true });

laceSchema.index({ category: 1 });
laceSchema.index({ createdAt: -1 });
laceSchema.index({ name: 1, createdAt: -1 });

export const LaceModel = mongoose.model('Lace', laceSchema);

