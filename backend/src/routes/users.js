import express from 'express'
import { db } from '../db.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { logAction } from '../utils/audit.js'

const router = express.Router()
router.use(authRequired, requireRole('admin'))

// GET /api/users
router.get('/', (req, res) => {
  const rows = db
    .prepare('SELECT id, email, role, created_at FROM users ORDER BY id DESC')
    .all()
  res.json(rows)
})

// PUT /api/users/:id/role
router.put('/:id/role', (req, res) => {
  const id = +req.params.id
  const { role } = req.body || {}
  if (!['admin', 'accountant', 'employee'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' })
  }
  const user = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id)
  if (!user) return res.status(404).json({ error: 'Not found' })

  db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id)
  logAction({
    userId: req.user.id,
    action: 'update_role',
    entity: 'user',
    entityId: id,
    details: { from: user.role, to: role },
  })
  res.json({ ok: true })
})

// DELETE /api/users/:id
// - Par défaut: 409 si FK
// - Forcé: /api/users/:id?force=1 -> purge les références user_id puis supprime
router.delete('/:id', (req, res) => {
  const id = +req.params.id
  const force = String(req.query.force || '') === '1'

  const u = db.prepare('SELECT id, role FROM users WHERE id = ?').get(id)
  if (!u) return res.status(404).json({ error: 'Not found' })

  // Empêcher la suppression du dernier admin
  if (u.role === 'admin') {
    const adminCount = db
      .prepare("SELECT COUNT(1) as c FROM users WHERE role = 'admin'")
      .get().c
    if (adminCount <= 1) {
      return res.status(400).json({ error: 'Cannot delete last admin' })
    }
  }

  try {
    if (force) {
      // 1) Purge ciblée: journaux d’audit (si table présente)
      try {
        db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(id)
      } catch (_) {
        /* ignore si table absente */
      }

      // 2) Purge générique: toutes les tables avec colonne user_id
      const tables = db
        .prepare(
          `
          SELECT name FROM sqlite_master
          WHERE type='table'
            AND name NOT LIKE 'sqlite_%'
            AND name NOT LIKE 'users'
        `
        )
        .all()
        .map((r) => r.name)

      tables.forEach((t) => {
        // Vérifier que la table a une colonne user_id
        const cols = db.prepare(`PRAGMA table_info(${t})`).all()
        if (!cols.some((c) => c.name === 'user_id')) return

        // Essayer de mettre user_id à NULL
        try {
          db.prepare(`UPDATE ${t} SET user_id = NULL WHERE user_id = ?`).run(id)
          return
        } catch (_) {
          // Sinon, supprimer les lignes liées (dernier recours)
          try {
            db.prepare(`DELETE FROM ${t} WHERE user_id = ?`).run(id)
          } catch (_) {
            // Certaines tables peuvent être des vues/readonly: on ignore
          }
        }
      })
    }

    db.prepare('DELETE FROM users WHERE id = ?').run(id)
    logAction({ userId: req.user.id, action: 'delete', entity: 'user', entityId: id })
    return res.json({ ok: true })
  } catch (e) {
    if (e && (e.code === 'SQLITE_CONSTRAINT' || e.code === 'SQLITE_CONSTRAINT_FOREIGNKEY')) {
      return res.status(409).json({
        error: 'impossible_de_supprimer_l_utilisateur_fk',
        message:
          'Des enregistrements liés existent. Supprime-les, utilise ?force=1, ou passe en soft delete.',
      })
    }
    return res
      .status(500)
      .json({ error: 'internal_error', message: e?.message || 'Unknown error' })
  }
})

export default router