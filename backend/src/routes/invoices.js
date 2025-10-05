import express from 'express'
import PDFDocument from 'pdfkit'
import { db } from '../db.js'
import { authRequired, requireRole } from '../middleware/auth.js'
import { logAction } from '../utils/audit.js'

const router = express.Router()
router.use(authRequired)

// Role helpers
function isStaff(role) {
  return role === 'admin' || role === 'accountant' || role === 'employee'
}

function getClientIdForUser(user) {
  // Link a 'client' user to a client record via email
  if (!user?.email) return null
  const row = db.prepare('SELECT id FROM clients WHERE email = ?').get(user.email)
  return row?.id || null
}

function computeTotals(items, tva_rate) {
  const total_ht = items.reduce((s, it) => s + it.unit_price * it.quantity, 0)
  const total_ttc = total_ht * (1 + tva_rate)
  return { total_ht, total_ttc }
}

function nextInvoiceNumber() {
  const row = db.prepare('SELECT MAX(number) as maxn FROM invoices').get()
  return (row?.maxn || 0) + 1
}

function updateStatus(invoiceId) {
  const inv = db.prepare('SELECT total_ttc FROM invoices WHERE id = ?').get(invoiceId)
  const paid = db.prepare('SELECT COALESCE(SUM(amount),0) as sum FROM payments WHERE invoice_id = ?').get(invoiceId).sum
  let status = 'unpaid'
  if (paid <= 0) status = 'unpaid'
  else if (paid < inv.total_ttc) status = 'partial'
  else status = 'paid'
  db.prepare("UPDATE invoices SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, invoiceId)
  return status
}

// GET /api/invoices?q=&status=&client_id=
router.get('/', (req, res) => {
  const { q, status, client_id } = req.query
  let sql = `SELECT i.id, i.number, i.issue_date, i.total_ht, i.tva_rate, i.total_ttc, i.status, c.name as client
             FROM invoices i JOIN clients c ON c.id = i.client_id
             WHERE i.deleted_at IS NULL`
  const params = []
  if (q) { sql += ' AND (CAST(i.number AS TEXT) LIKE ? OR c.name LIKE ?)'; params.push(`%${q}%`, `%${q}%`) }
  if (status) { sql += ' AND i.status = ?'; params.push(status) }
  if (client_id && isStaff(req.user.role)) { sql += ' AND i.client_id = ?'; params.push(+client_id) }

  // If role is client: restrict to own client_id
  if (!isStaff(req.user.role)) {
    const ownId = getClientIdForUser(req.user)
    if (!ownId) return res.json([])
    sql += ' AND i.client_id = ?'
    params.push(ownId)
  }

  sql += ' ORDER BY i.id DESC'
  const rows = db.prepare(sql).all(...params)
  res.json(rows)
})

// GET /api/invoices/:id
router.get('/:id', (req, res) => {
  const id = +req.params.id
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!inv) return res.status(404).json({ error: 'Not found' })

  // Ownership check for client role
  if (!isStaff(req.user.role)) {
    const ownId = getClientIdForUser(req.user)
    if (!ownId || inv.client_id !== ownId) return res.status(403).json({ error: 'interdit' })
  }

  const items = db.prepare('SELECT id, description, unit_price, quantity, total FROM invoice_items WHERE invoice_id = ?').all(id)
  const client = db.prepare('SELECT id, name, email, address FROM clients WHERE id = ?').get(inv.client_id)
  const payments = db.prepare('SELECT id, amount, method, paid_at FROM payments WHERE invoice_id = ? ORDER BY paid_at DESC').all(id)
  res.json({ ...inv, client, items, payments })
})

// POST /api/invoices
// Staff only: admin, accountant, employee
router.post('/', requireRole('admin', 'accountant', 'employee'), (req, res) => {
  const { client_id, issue_date, due_date, tva_rate, items } = req.body || {}
  if (!client_id || !issue_date || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ error: 'client_id, issue_date, items required' })

  const clean = items.map(i => ({
    description: i.description,
    unit_price: Number(i.unit_price),
    quantity: Number(i.quantity),
  })).filter(i => i.description && i.unit_price >= 0 && i.quantity > 0)

  if (clean.length === 0) return res.status(400).json({ error: 'Invalid items' })

  const number = nextInvoiceNumber()
  const { total_ht, total_ttc } = computeTotals(clean, Number(tva_rate || 0))

  const tx = db.transaction(() => {
    const info = db.prepare(`INSERT INTO invoices
      (number, client_id, issue_date, due_date, total_ht, tva_rate, total_ttc, status)
      VALUES (?,?,?,?,?,?,?, 'unpaid')`).run(number, client_id, issue_date, due_date || null, total_ht, tva_rate || 0, total_ttc)
    const id = info.lastInsertRowid
    const ins = db.prepare('INSERT INTO invoice_items (invoice_id, description, unit_price, quantity, total) VALUES (?,?,?,?,?)')
    clean.forEach(it => ins.run(id, it.description, it.unit_price, it.quantity, it.unit_price * it.quantity))
    return id
  })
  const id = tx()
  logAction({ userId: req.user.id, action: 'create', entity: 'invoice', entityId: id, details: { number } })
  res.status(201).json({ id, number })
})

// PUT /api/invoices/:id
// Staff only: admin, accountant
router.put('/:id', requireRole('admin', 'accountant'), (req, res) => {
  const id = +req.params.id
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!inv) return res.status(404).json({ error: 'Not found' })

  const { client_id, issue_date, due_date, tva_rate, items } = req.body || {}
  if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' })

  const clean = items.map(i => ({ description: i.description, unit_price: Number(i.unit_price), quantity: Number(i.quantity) }))
    .filter(i => i.description && i.unit_price >= 0 && i.quantity > 0)

  const { total_ht, total_ttc } = computeTotals(clean, Number(tva_rate ?? inv.tva_rate))

  const tx = db.transaction(() => {
    db.prepare(`UPDATE invoices SET client_id = ?, issue_date = ?, due_date = ?, tva_rate = ?, total_ht = ?, total_ttc = ?, updated_at = datetime('now') WHERE id = ?`)
      .run(client_id ?? inv.client_id, issue_date ?? inv.issue_date, (due_date ?? inv.due_date) || null, (tva_rate ?? inv.tva_rate), total_ht, total_ttc, id)
    db.prepare('DELETE FROM invoice_items WHERE invoice_id = ?').run(id)
    const ins = db.prepare('INSERT INTO invoice_items (invoice_id, description, unit_price, quantity, total) VALUES (?,?,?,?,?)')
    clean.forEach(it => ins.run(id, it.description, it.unit_price, it.quantity, it.unit_price * it.quantity))
  })
  tx()
  const status = updateStatus(id)
  logAction({ userId: req.user.id, action: 'update', entity: 'invoice', entityId: id })
  res.json({ ok: true, status })
})

// DELETE /api/invoices/:id (soft delete)
// Staff only: admin
router.delete('/:id', requireRole('admin'), (req, res) => {
  const id = +req.params.id
  const inv = db.prepare('SELECT id FROM invoices WHERE id = ? AND deleted_at IS NULL').get(id)
  if (!inv) return res.status(404).json({ error: 'Not found' })
  db.prepare("UPDATE invoices SET deleted_at = datetime('now') WHERE id = ?").run(id)
  logAction({ userId: req.user.id, action: 'archive', entity: 'invoice', entityId: id })
  res.json({ ok: true })
})

// GET /api/invoices/:id/pdf
router.get('/:id/pdf', (req, res) => {
  const id = +req.params.id
  const inv = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id)
  if (!inv) return res.status(404).json({ error: 'Not found' })

  // Ownership check for client role
  if (!isStaff(req.user.role)) {
    const ownId = getClientIdForUser(req.user)
    if (!ownId || inv.client_id !== ownId) return res.status(403).json({ error: 'interdit' })
  }

  const items = db.prepare('SELECT description, unit_price, quantity, total FROM invoice_items WHERE invoice_id = ?').all(id)
  const client = db.prepare('SELECT name, email, address FROM clients WHERE id = ?').get(inv.client_id)

  res.setHeader('Content-Type', 'application/pdf')
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${inv.number}.pdf"`)
  const doc = new PDFDocument({ margin: 40 })
  doc.pipe(res)
  doc.fontSize(18).text(`Facture #${inv.number}`, { align: 'right' })
  doc.moveDown()
  doc.fontSize(12).text(`Client: ${client.name}`)
  if (client.address) doc.text(client.address)
  if (client.email) doc.text(client.email)
  doc.moveDown()
  doc.text(`Date: ${inv.issue_date}`)
  if (inv.due_date) doc.text(`Échéance: ${inv.due_date}`)
  doc.moveDown()
  doc.text('Désignation                PU        Qté        Total')
  items.forEach(it => {
    doc.text(`${it.description}    ${it.unit_price.toFixed(2)}    ${it.quantity}    ${it.total.toFixed(2)}`)
  })
  doc.moveDown()
  doc.text(`Total HT: $ ${inv.total_ht.toFixed(2)}`)
  doc.text(`TVA: ${(inv.tva_rate * 100).toFixed(2)}%`)
  doc.text(`Total TTC: $ ${inv.total_ttc.toFixed(2)}`)
  doc.end()
})

export default router