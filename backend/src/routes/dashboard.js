import express from 'express';
import dayjs from 'dayjs';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Employee dashboard metrics
router.get('/employee', auth, requireRole('employee'), async (req, res) => {
  try {
    const today = dayjs().startOf('day').toDate();
    const todayRecord = await Attendance.findOne({ userId: req.user.id, date: today });
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();
    const monthRecords = await Attendance.find({ userId: req.user.id, date: { $gte: startOfMonth, $lte: endOfMonth } });
    const totalHours = monthRecords.reduce((sum, r) => sum + (r.totalHours || 0), 0);
    const present = monthRecords.filter(r => r.status === 'present').length;
    const late = monthRecords.filter(r => r.status === 'late').length;
    const halfDay = monthRecords.filter(r => r.status === 'half-day').length;
    const daysWithRecords = new Set(monthRecords.map(r => dayjs(r.date).format('YYYY-MM-DD')));
    const absent = Math.max(dayjs().date() - daysWithRecords.size, 0);
    const last7 = await Attendance.find({ userId: req.user.id, date: { $gte: dayjs().subtract(6, 'day').startOf('day').toDate() } }).sort({ date: 1 });
    res.json({ todayRecord, totalHours, present, late, halfDay, absent, last7 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employee dashboard' });
  }
});

// Manager dashboard metrics
router.get('/manager', auth, requireRole('manager'), async (req, res) => {
  try {
    const totalEmployees = await User.countDocuments({ role: 'employee' });
    const today = dayjs().startOf('day').toDate();
    const todayRecords = await Attendance.find({ date: today }).populate('userId', 'name department');
    const presentToday = todayRecords.length;
    const absentToday = Math.max(totalEmployees - presentToday, 0);
    const lateEmployees = todayRecords.filter(r => r.status === 'late').map(r => ({ name: r.userId.name, department: r.userId.department }));
    const trend = [];
    const lateTrend = [];
    for (let i = 13; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').startOf('day').toDate();
      const cnt = await Attendance.countDocuments({ date: d });
      trend.push({ date: dayjs(d).format('MMM D'), count: cnt });
      const lateCnt = await Attendance.countDocuments({ date: d, status: 'late' });
      lateTrend.push({ date: dayjs(d).format('MMM D'), count: lateCnt });
    }
    // Department-wise
    const employees = await User.find({ role: 'employee' });
    const departments = {};
    const presentIds = new Set(todayRecords.map(r => r.userId._id.toString()));
    for (const u of employees) {
      const dept = u.department || 'General';
      if (!departments[dept]) departments[dept] = { present: 0, absent: 0 };
      if (presentIds.has(u._id.toString())) departments[dept].present++;
      else departments[dept].absent++;
    }
    res.json({ totalEmployees, presentToday, absentToday, lateEmployees, trend, lateTrend, departments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch manager dashboard' });
  }
});

export default router;