import mongoose from 'mongoose';

const attendanceSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    checkInTime: { type: Date },
    checkOutTime: { type: Date },
    status: { type: String, enum: ['present', 'late', 'absent', 'half-day'], default: 'present' },
    totalHours: { type: Number, default: 0 },
    device: { type: String, enum: ['mobile', 'web', 'qr'], default: 'web' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model('Attendance', attendanceSchema);