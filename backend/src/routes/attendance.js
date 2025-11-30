import express from 'express';
import dayjs from 'dayjs';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';
import { auth, requireRole } from '../middleware/auth.js';

const router = express.Router();

const getDateOnly = (d = new Date()) => dayjs(d).startOf('day').toDate();

// Employee: Check-in (only once per day)
router.post('/checkin', auth, requireRole('employee'), async (req, res) => {
  try {
    const today = getDateOnly();
    let record = await Attendance.findOne({ userId: req.user.id, date: today });
    if (record?.checkInTime) return res.status(400).json({ message: 'Already checked in today' });
    const now = new Date();
    const hour = now.getHours(), minute = now.getMinutes();
    const isLate = hour > 9 || (hour === 9 && minute > 15);
    const status = isLate ? 'late' : 'present';
    const device = req.body?.device || 'web';
    if (!record) {
      record = await Attendance.create({ userId: req.user.id, date: today, checkInTime: now, status, device });
    } else {
      record.checkInTime = now;
      record.status = status;
      record.device = device;
      await record.save();
    }
    res.json({ message: 'Checked in', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Check-in failed' });
  }
});

// Employee: Check-out
router.post('/checkout', auth, requireRole('employee'), async (req, res) => {
  try {
    const today = getDateOnly();
    const record = await Attendance.findOne({ userId: req.user.id, date: today });
    if (!record || !record.checkInTime) return res.status(400).json({ message: 'Not checked in yet' });
    if (record.checkOutTime) return res.status(400).json({ message: 'Already checked out today' });
    const now = new Date();
    record.checkOutTime = now;
    const ms = now - record.checkInTime;
    const hours = Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
    record.totalHours = hours;
    if (hours < 4) record.status = 'half-day';
    await record.save();
    res.json({ message: 'Checked out', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Check-out failed' });
  }
});

// Employee: My history
router.get('/my-history', auth, requireRole('employee'), async (req, res) => {
  try {
    const { start, end } = req.query;
    const query = { userId: req.user.id };
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = dayjs(start).startOf('day').toDate();
      if (end) query.date.$lte = dayjs(end).endOf('day').toDate();
    }
    const records = await Attendance.find(query).sort({ date: -1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch history' });
  }
});

// Employee: My summary (current month)
router.get('/my-summary', auth, requireRole('employee'), async (req, res) => {
  try {
    const startOfMonth = dayjs().startOf('month').toDate();
    const endOfMonth = dayjs().endOf('month').toDate();
    const records = await Attendance.find({ userId: req.user.id, date: { $gte: startOfMonth, $lte: endOfMonth } });
    let totalHours = 0;
    let present = 0, late = 0, absent = 0, halfDay = 0;
    const daysWithRecords = new Set(records.map(r => dayjs(r.date).format('YYYY-MM-DD')));
    records.forEach(r => {
      totalHours += r.totalHours || 0;
      if (r.status === 'present') present++;
      if (r.status === 'late') late++;
      if (r.status === 'half-day') halfDay++;
    });
    const today = dayjs();
    const daysPassed = today.date();
    absent = Math.max(daysPassed - daysWithRecords.size, 0);
    const last7 = await Attendance.find({ userId: req.user.id, date: { $gte: dayjs().subtract(6, 'day').startOf('day').toDate() } }).sort({ date: 1 });
    res.json({ totalHours, present, late, absent, halfDay, last7 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// Employee: Today
router.get('/today', auth, requireRole('employee'), async (req, res) => {
  try {
    const today = getDateOnly();
    const record = await Attendance.findOne({ userId: req.user.id, date: today });
    res.json({ record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch today' });
  }
});

// Manager: All attendance with filters
router.get('/all', auth, requireRole('manager'), async (req, res) => {
  try {
    const { userId, status, start, end, department } = req.query;
    const query = {};
    if (userId) query.userId = userId;
    if (status) query.status = status;
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = dayjs(start).startOf('day').toDate();
      if (end) query.date.$lte = dayjs(end).endOf('day').toDate();
    }
    let records = await Attendance.find(query).populate('userId', 'name email department employeeId role').sort({ date: -1 });
    if (department) records = records.filter(r => r.userId?.department === department);
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch attendance' });
  }
});

// Manager: Employee history
router.get('/employee/:id', auth, requireRole('manager'), async (req, res) => {
  try {
    const records = await Attendance.find({ userId: req.params.id }).sort({ date: -1 });
    res.json({ records });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch employee history' });
  }
});

// Manager: Summary
router.get('/summary', auth, requireRole('manager'), async (req, res) => {
  try {
    const today = getDateOnly();
    const users = await User.find({ role: 'employee' });
    const todayRecords = await Attendance.find({ date: today });
    const presentCount = todayRecords.filter(r => r.status === 'present' || r.status === 'late' || r.status === 'half-day').length;
    const lateEmployees = todayRecords.filter(r => r.status === 'late').map(r => r.userId.toString());
    const totalEmployees = users.length;
    const absentToday = Math.max(totalEmployees - todayRecords.length, 0);
    // Trend: past 14 days attendance counts
    const trend = [];
    for (let i = 13; i >= 0; i--) {
      const d = dayjs().subtract(i, 'day').startOf('day').toDate();
      const cnt = await Attendance.countDocuments({ date: d });
      trend.push({ date: dayjs(d).format('MMM D'), count: cnt });
    }
    // Department-wise counts
    const departments = {};
    for (const u of users) {
      const rec = todayRecords.find(r => r.userId.toString() === u._id.toString());
      const dept = u.department || 'General';
      if (!departments[dept]) departments[dept] = { present: 0, absent: 0 };
      if (rec) departments[dept].present++;
      else departments[dept].absent++;
    }
    res.json({ totalEmployees, presentToday: presentCount, absentToday, lateEmployees, trend, departments });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch summary' });
  }
});

// Manager: Today status (present vs absent and late list)
router.get('/today-status', auth, requireRole('manager'), async (req, res) => {
  try {
    const today = getDateOnly();
    const employees = await User.find({ role: 'employee' });
    const records = await Attendance.find({ date: today }).populate('userId', 'name department');
    const present = records.map(r => ({ name: r.userId.name, status: r.status, department: r.userId.department }));
    const late = present.filter(p => p.status === 'late');
    const presentIds = new Set(records.map(r => r.userId._id.toString()));
    const absent = employees.filter(e => !presentIds.has(e._id.toString())).map(e => ({ name: e.name, department: e.department }));
    res.json({ present, absent, late });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch today status' });
  }
});

// Manager: Export CSV
router.get('/export', auth, requireRole('manager'), async (req, res) => {
  try {
    const { start, end, status } = req.query;
    const query = {};
    if (status) query.status = status;
    if (start || end) {
      query.date = {};
      if (start) query.date.$gte = dayjs(start).startOf('day').toDate();
      if (end) query.date.$lte = dayjs(end).endOf('day').toDate();
    }
    const records = await Attendance.find(query).populate('userId', 'name email employeeId department');
    const headers = ['Employee Name','Employee ID','Email','Department','Date','Check In','Check Out','Status','Total Hours'];
    const rows = records.map(r => [
      r.userId?.name || '',
      r.userId?.employeeId || '',
      r.userId?.email || '',
      r.userId?.department || '',
      dayjs(r.date).format('YYYY-MM-DD'),
      r.checkInTime ? dayjs(r.checkInTime).format('HH:mm') : '',
      r.checkOutTime ? dayjs(r.checkOutTime).format('HH:mm') : '',
      r.status,
      r.totalHours?.toFixed(2) || '0.00',
    ]);
    const csv = [headers.join(','), ...rows.map(row => row.map(v => `${String(v).replace(/"/g, '"')}`).join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="attendance_export.csv"');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to export CSV' });
  }
});

// Manager: Bulk mark absent for a date
router.post('/mark-absent', auth, requireRole('manager'), async (req, res) => {
  try {
    const { date, userIds } = req.body;
    if (!date || !Array.isArray(userIds)) return res.status(400).json({ message: 'date and userIds required' });
    const d = dayjs(date).startOf('day').toDate();
    const results = [];
    for (const uid of userIds) {
      let rec = await Attendance.findOne({ userId: uid, date: d });
      if (!rec) {
        rec = await Attendance.create({ userId: uid, date: d, status: 'absent' });
      } else {
        rec.status = 'absent';
        rec.checkInTime = rec.checkInTime || null;
        rec.checkOutTime = rec.checkOutTime || null;
        rec.totalHours = 0;
        await rec.save();
      }
      results.push(rec);
    }
    res.json({ message: 'Marked absent', records: results });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to mark absent' });
  }
});

// Manager: Edit attendance record
router.put('/:id', auth, requireRole('manager'), async (req, res) => {
  try {
    const allow = ['status', 'checkInTime', 'checkOutTime', 'totalHours'];
    const updates = {};
    for (const key of allow) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    // If check-in/out times updated, recompute totalHours when possible
    if (updates.checkInTime || updates.checkOutTime) {
      const rec = await Attendance.findById(req.params.id);
      const ci = updates.checkInTime ? new Date(updates.checkInTime) : rec.checkInTime;
      const co = updates.checkOutTime ? new Date(updates.checkOutTime) : rec.checkOutTime;
      if (ci && co) {
        const ms = co - ci;
        updates.totalHours = Math.round((ms / (1000 * 60 * 60)) * 100) / 100;
      }
    }
    const record = await Attendance.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!record) return res.status(404).json({ message: 'Record not found' });
    res.json({ message: 'Attendance updated', record });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to update attendance' });
  }
});

export default router;