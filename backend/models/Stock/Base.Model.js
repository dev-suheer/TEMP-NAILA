import mongoose from 'mongoose';

const previousDataSchema = new mongoose.Schema({
  colors: {
    type: String,
    required: [true,"color required"],
  },
  category: {
    type: String,
    required: [true,"Category required"]  },
  Date: {
    type: Date,
    required: [true,"date required"],
  },
  quantity: {
    type: String,
    required: [true,"Recently quantity required"],
  },
  isDirectEntry: {
    type: Boolean,
    default: false
  }
})


const baseSchema = new mongoose.Schema({
  category: {
    type: String,
    required: [true,"category required"],
  },
  colors: {
    type: String,
     required: [true,"color required"],
  },
  r_Date: {
    type: Date,
    required: [true,"R_Date required"],
  },
  recently: {
    type: Number,
    required: [true,"Recently required"],
  },
  TYm: {
    type: Number,
    required: [true,"TYm required"],
  },
  all_Records: [previousDataSchema]
}, { timestamps: true });

baseSchema.index({ category: 1, colors: 1 });
baseSchema.index({ category: 1, updatedAt: -1 });
baseSchema.index({ updatedAt: -1 });

export const BaseModel = mongoose.model('Base', baseSchema);
