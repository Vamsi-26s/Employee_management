import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const signToken = (user) => {
  const payload = { id: user._id, role: user.role };
  const secret = process.env.JWT_SECRET || 'devsecret';
  const expiresIn = '7d';
  return jwt.sign(payload, secret, { expiresIn });
};

// Register (Employee by default)
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role = 'employee', employeeId, department } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed, role, employeeId, department });
    const token = signToken(user);
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId, department: user.department };
    res.status(201).json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: 'Invalid credentials' });
    const token = signToken(user);
    const safeUser = { id: user._id, name: user.name, email: user.email, role: user.role, employeeId: user.employeeId, department: user.department };
    res.json({ token, user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed' });
  }
});

// Me
router.get('/me', auth, async (req, res) => {
  res.json({ user: req.user });
});

// Update profile
router.put('/me', auth, async (req, res) => {
  try {
    const allow = ['name', 'department', 'employeeId', 'profileImage'];
    const updates = {};
    for (const key of allow) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }
    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-password');
    const safeUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
      profileImage: user.profileImage,
    };
    res.json({ message: 'Profile updated', user: safeUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Profile update failed' });
  }
});

export default router;