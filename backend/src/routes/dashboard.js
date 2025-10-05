import express from 'express';
import { db } from '../db.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();
router.use(authRequired);

router.get('/totals', (req, res) => {
  const totalInvoices = db.prepare("SELECT COALESCE(SUM(total_ttc),0) as v FROM invoices WHERE deleted_at IS NULL").get().v;
  const totalPaid = db.prepare("SELECT COALESCE(SUM(p.amount),0) as v FROM payments p JOIN invoices i ON i.id = p.invoice_id WHERE i.deleted_at IS NULL").get().v;
  const totalDue = Math.max(0, totalInvoices - totalPaid);
  const byClient = db.prepare(`
    SELECT c.name as client, COALESCE(SUM(i.total_ttc),0) as invoices, COALESCE(SUM(p.amount),0) as paid
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id AND i.deleted_at IS NULL
    LEFT JOIN payments p ON p.invoice_id = i.id
    GROUP BY c.id
    ORDER BY paid DESC
  `).all();
  res.json({ total_invoices: totalInvoices, total_paid: totalPaid, total_due: totalDue, by_client: byClient });
});

router.get('/monthly', (req, res) => {
  const rows = db.prepare(`
    SELECT strftime('%Y-%m', issue_date) as month, SUM(total_ttc) as revenue
    FROM invoices WHERE deleted_at IS NULL
    GROUP BY month
    ORDER BY month
  `).all();
  res.json(rows);
});

router.get('/status', (req, res) => {
  const rows = db.prepare(`
    SELECT status, COUNT(*) as count, SUM(total_ttc) as total
    FROM invoices WHERE deleted_at IS NULL
    GROUP BY status
  `).all();
  res.json(rows);
});

router.get('/top-clients', (req, res) => {
  const rows = db.prepare(`
    SELECT c.name as client, COALESCE(SUM(p.amount),0) as paid
    FROM clients c
    LEFT JOIN invoices i ON i.client_id = c.id AND i.deleted_at IS NULL
    LEFT JOIN payments p ON p.invoice_id = i.id
    GROUP BY c.id
    ORDER BY paid DESC
    LIMIT 10
  `).all();
  res.json(rows);
});

export default router;
