import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import morgan from 'morgan';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/auth.js';
import attendanceRoutes from './src/routes/attendance.js';
import dashboardRoutes from './src/routes/dashboard.js';
import usersRoutes from './src/routes/users.js';
import bcrypt from 'bcryptjs';
import User from './src/models/User.js';
import Attendance from './src/models/Attendance.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Increase JSON body size to support base64 profile images
app.use(express.json({ limit: '5mb' }));
app.use(morgan('dev'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/users', usersRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Server error' });
});

// Dev bootstrap: seed minimal users and attendance if DB is empty
async function bootstrapDevData() {
  try {
    if (process.env.NODE_ENV === 'production') return;
    const count = await User.countDocuments();
    if (count > 0) return;
    const managerPass = await bcrypt.hash('manager123', 10);
    const manager = await User.create({
      name: 'Manager One',
      email: 'manager@example.com',
      password: managerPass,
      role: 'manager',
      department: 'HR',
    });
    const employeePass = await bcrypt.hash('employee123', 10);
    const employee = await User.create({
      name: 'Employee One',
      email: 'employee@example.com',
      password: employeePass,
      role: 'employee',
      employeeId: 'EMP001',
      department: 'Engineering',
    });
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const checkIn = new Date(dateOnly.getTime() + 9 * 60 * 60 * 1000 + 10 * 60 * 1000);
    const checkOut = new Date(checkIn.getTime() + 8 * 60 * 60 * 1000);
    const totalHours = Math.round(((checkOut - checkIn) / (1000 * 60 * 60)) * 100) / 100;
    await Attendance.create({
      userId: employee._id,
      date: dateOnly,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      totalHours,
      status: 'present',
    });
    console.log('Dev data bootstrapped: manager@example.com / employee@example.com');
  } catch (e) {
    console.warn('Dev bootstrap failed:', e.message);
  }
}

// Start server
connectDB()
  .then(async () => {
    await bootstrapDevData();
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('DB connection failed:', err);
    process.exit(1);
  });