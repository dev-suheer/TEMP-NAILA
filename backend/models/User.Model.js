import mongoose from 'mongoose'




const userSchema = new  mongoose.Schema({
  email: {
    type: String,
    required: [true,"Email required"],
    unique: true,
  },
  name: {
    type: String,
    required: [true,"Name required"],
  },
  password: {
    type: String,
    required: [true,"Password required"],
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'user'],
    required: true,
    default: 'user',
  },
  authenticated: {
    type: Boolean,
    default: false,
  },
  branchId: {
    type: mongoose.Types.ObjectId,
    default: null,
  },
}, { timestamps: true });

userSchema.index({ authenticated: 1, createdAt: -1 });
userSchema.index({ branchId: 1, createdAt: -1 });

export const UserModel = mongoose.model('User', userSchema);
