import { db } from '../db.js';

export function logAction({ userId, action, entity, entityId, details }) {
  db.prepare(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
     VALUES (?,?,?,?,?)`
  ).run(userId || null, action, entity || null, entityId || null, details ? JSON.stringify(details) : null);
}
