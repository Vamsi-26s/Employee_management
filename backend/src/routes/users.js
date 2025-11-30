import express from 'express';
import { auth, requireRole } from '../middleware/auth.js';
import User from '../models/User.js';

const router = express.Router();

// List employees (manager-only)
router.get('/', auth, requireRole('manager'), async (req, res) => {
  try {
    const { department, q } = req.query;
    const query = { role: 'employee' };
    if (department) query.department = department;
    let users = await User.find(query).select('name department employeeId email role');
    if (q) {
      const lower = String(q).toLowerCase();
      users = users.filter(
        (u) =>
          (u.name || '').toLowerCase().includes(lower) ||
          (u.employeeId || '').toLowerCase().includes(lower) ||
          (u.email || '').toLowerCase().includes(lower)
      );
    }
    res.json({ users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch users' });
  }
});

export default router;