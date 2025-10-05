import express from 'express';
import { db } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = express.Router();

router.use(authRequired);

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, name, email, address FROM clients ORDER BY id DESC').all();
  res.json(rows);
});

router.post('/', requireRole('admin', 'accountant', 'employee'), (req, res) => {
  const { name, email, address } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const info = db.prepare('INSERT INTO clients (name, email, address) VALUES (?,?,?)').run(name, email || null, address || null);
  logAction({ userId: req.user.id, action: 'create', entity: 'client', entityId: info.lastInsertRowid, details: { name } });
  res.status(201).json({ id: info.lastInsertRowid, name, email, address });
});

router.put('/:id', requireRole('admin', 'accountant'), (req, res) => {
  const { name, email, address } = req.body || {};
  const id = +req.params.id;
  const client = db.prepare('SELECT id FROM clients WHERE id = ?').get(id);
  if (!client) return res.status(404).json({ error: 'Not found' });
  db.prepare('UPDATE clients SET name = ?, email = ?, address = ? WHERE id = ?').run(name, email || null, address || null, id);
  logAction({ userId: req.user.id, action: 'update', entity: 'client', entityId: id });
  res.json({ id, name, email, address });
});

router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = +req.params.id;
  // Hard delete is avoided; clients retained. Optionally we could mark archived. For simplicity, disallow delete if invoices exist.
  const cnt = db.prepare('SELECT COUNT(1) as c FROM invoices WHERE client_id = ?').get(id).c;
  if (cnt > 0) return res.status(400).json({ error: 'Client has invoices; cannot delete' });
  db.prepare('DELETE FROM clients WHERE id = ?').run(id);
  logAction({ userId: req.user.id, action: 'delete', entity: 'client', entityId: id });
  res.json({ ok: true });
});

router.get('/search', (req, res) => {
  const q = `%${(req.query.q || '').toString()}%`;
  const rows = db.prepare('SELECT id, name, email FROM clients WHERE name LIKE ? OR email LIKE ? ORDER BY name').all(q, q);
  res.json(rows);
});

export default router;
