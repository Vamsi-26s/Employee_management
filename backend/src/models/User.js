import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['employee', 'manager'], default: 'employee' },
    employeeId: { type: String },
    department: { type: String },
    profileImage: { type: String },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export default mongoose.model('User', userSchema);