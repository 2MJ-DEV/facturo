import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const user = db.prepare('SELECT id, email, password_hash, role FROM users WHERE email = ?').get(email);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '8h' });
  logAction({ userId: user.id, action: 'login', entity: 'user', entityId: user.id });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Public registration for normal employees
router.post('/register', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (exists) return res.status(409).json({ error: 'Email already registered' });
  const password_hash = bcrypt.hashSync(password, 10);
  const info = db.prepare('INSERT INTO users (email, password_hash, role) VALUES (?,?,?)').run(email, password_hash, 'employee');
  logAction({ userId: info.lastInsertRowid, action: 'register', entity: 'user', entityId: info.lastInsertRowid });
  res.status(201).json({ id: info.lastInsertRowid });
});

router.get('/me', authRequired, (req, res) => {
  const user = db.prepare('SELECT id, email, role FROM users WHERE id = ?').get(req.user.id);
  res.json({ user });
});

export default router;
