import express from 'express';
import { db } from '../db.js';
import { authRequired, requireRole } from '../middleware/auth.js';

const router = express.Router();
router.use(authRequired, requireRole('admin'));

router.get('/', (req, res) => {
  const rows = db.prepare(`
    SELECT a.id, a.action, a.entity, a.entity_id, a.details, a.created_at,
           u.email as user_email
    FROM audit_logs a
    LEFT JOIN users u ON u.id = a.user_id
    ORDER BY a.id DESC
    LIMIT 500
  `).all();
  res.json(rows.map(r => ({
    ...r,
    details: r.details ? JSON.parse(r.details) : null,
  })));
});

export default router;
