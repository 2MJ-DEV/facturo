import express from 'express';
import { db } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';
import { logAction } from '../utils/audit.js';

const router = express.Router();
router.use(authRequired);

function updateStatus(invoiceId) {
  const inv = db.prepare('SELECT total_ttc FROM invoices WHERE id = ?').get(invoiceId);
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE invoice_id = ?').get(invoiceId).sum;
  let status = 'unpaid';
  if (paid <= 0) status = 'unpaid';
  else if (paid < inv.total_ttc) status = 'partial';
  else status = 'paid';
  db.prepare("UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, invoiceId);
  return status;
}

router.get('/by-invoice/:invoiceId', (req, res) => {
  const invoiceId = +req.params.invoiceId;
  const rows = db.prepare('SELECT id, amount, method, paid_at, note FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC').all(invoiceId);
  res.json(rows);
});

router.post('/', requireRole('admin', 'accountant'), (req, res) => {
  const { invoice_id, amount, method, paid_at, note } = req.body || {};
  if (!invoice_id || !amount || !method || !paid_at) return res.status(400).json({ error: 'invoice_id, amount, method, paid_at required' });
  const inv = db.prepare('SELECT id FROM invoices WHERE id = ? AND deleted_at IS NULL').get(invoice_id);
  if (!inv) return res.status(404).json({ error: 'Invoice not found' });
  const info = db.prepare('INSERT INTO payments (invoice_id, amount, method, paid_at, note) VALUES (?,?,?,?,?)').run(invoice_id, Number(amount), method, paid_at, note || null);
  const status = updateStatus(invoice_id);
  logAction({ userId: req.user.id, action: 'create', entity: 'payment', entityId: info.lastInsertRowid, details: { invoice_id } });
  res.status(201).json({ id: info.lastInsertRowid, status });
});

router.delete('/:id', requireRole('admin', 'accountant'), (req, res) => {
  const id = +req.params.id;
  const p = db.prepare('SELECT invoice_id FROM payments WHERE id = ?').get(id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM payments WHERE id = ?').run(id);
  const status = updateStatus(p.invoice_id);
  logAction({ userId: req.user.id, action: 'delete', entity: 'payment', entityId: id });
  res.json({ ok: true, status });
});

export default router;
