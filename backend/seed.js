import dotenv from 'dotenv';
import mongoose from 'mongoose';
import dayjs from 'dayjs';
import bcrypt from 'bcryptjs';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Attendance from './src/models/Attendance.js';

dotenv.config();

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];

async function seed() {
  await connectDB();
  console.log('Seeding data...');

  // Clean collections
  await Attendance.deleteMany({});
  await User.deleteMany({});

  const managerPass = await bcrypt.hash('manager123', 10);
  const manager = await User.create({
    name: 'Manager One',
    email: 'manager@example.com',
    password: managerPass,
    role: 'manager',
    department: 'HR',
  });

  const departments = ['Engineering', 'Sales', 'Marketing', 'Finance', 'HR'];
  const employees = [];
  for (let i = 1; i <= 5; i++) {
    const pass = await bcrypt.hash(`employee${i}123`, 10);
    const emp = await User.create({
      name: `Employee ${i}`,
      email: `employee${i}@example.com`,
      password: pass,
      role: 'employee',
      employeeId: `EMP00${i}`,
      department: randomFrom(departments),
    });
    employees.push(emp);
  }

  const daysBack = 30;
  for (const emp of employees) {
    for (let d = daysBack; d >= 0; d--) {
      const date = dayjs().subtract(d, 'day').startOf('day').toDate();
      // Skip some days to simulate absences
      if (Math.random() < 0.15) continue;
      const startHour = 9 + Math.floor(Math.random() * 2); // 9-10am
      const startMin = Math.floor(Math.random() * 60);
      const checkInTime = dayjs(date).add(startHour, 'hour').add(startMin, 'minute').toDate();
      const isLate = startHour > 9 || (startHour === 9 && startMin > 15);
      const endHour = startHour + 7 + Math.floor(Math.random() * 3); // 7-9 hours later
      const checkOutTime = dayjs(date).add(endHour, 'hour').add(Math.floor(Math.random() * 60), 'minute').toDate();
      const totalHours = Math.round(((checkOutTime - checkInTime) / (1000 * 60 * 60)) * 100) / 100;
      const status = totalHours < 4 ? 'half-day' : isLate ? 'late' : 'present';
      await Attendance.create({ userId: emp._id, date, checkInTime, checkOutTime, totalHours, status });
    }
  }

  console.log('Seed completed.');
  await mongoose.connection.close();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});