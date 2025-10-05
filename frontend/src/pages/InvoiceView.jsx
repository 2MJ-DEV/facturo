import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api } from '../api'
import { getToken } from '../auth'

export default function InvoiceView() {
  const { id } = useParams()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const [pAmount, setPAmount] = useState('')
  const [pMethod, setPMethod] = useState('virement')
  const [pDate, setPDate] = useState(new Date().toISOString().slice(0,10))
  const [pNote, setPNote] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const res = await api(`/invoices/${id}`)
      setData(res)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [id])

  async function addPayment(e) {
    e.preventDefault()
    try {
      await api('/payments', { method: 'POST', body: {
        invoice_id: Number(id), amount: Number(pAmount), method: pMethod, paid_at: pDate, note: pNote || null
      }})
      setPAmount('')
      setPNote('')
      await load()
    } catch (e) { setError(e.message) }
  }

  async function deletePayment(pid) {
    if (!confirm('Supprimer ce paiement ?')) return
    try { await api(`/payments/${pid}`, { method: 'DELETE' }); await load() } catch (e) { setError(e.message) }
  }

  async function archiveInvoice() {
    if (!confirm('Archiver cette facture ?')) return
    try { await api(`/invoices/${id}`, { method: 'DELETE' }); nav('/invoices') } catch (e) { setError(e.message) }
  }

  async function downloadPdf() {
    try {
      const base = import.meta.env.VITE_API_URL || 'http://localhost:4000'
      const res = await fetch(`${base}/api/invoices/${id}/pdf`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      })
      if (!res.ok) {
        const txt = await res.text()
        throw new Error(txt || `Erreur ${res.status}`)
      }
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${id}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
    } catch (e) {
      setError(e.message)
    }
  }

  if (loading) return <div>Chargement...</div>
  if (error) return <div className="text-red-600 text-sm">{error}</div>
  if (!data) return null

  const paid = (data.payments || []).reduce((s,p)=> s + Number(p.amount), 0)
  const due = Math.max(0, Number(data.total_ttc) - paid)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Facture #{data.number}</h1>
        <div className="flex gap-2">
          <button onClick={downloadPdf} className="border px-3 py-2 rounded">Télécharger PDF</button>
          <button onClick={archiveInvoice} className="border px-3 py-2 rounded text-red-600">Archiver</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="font-medium">Client</div>
          <div className="text-sm">{data.client?.name}</div>
          {data.client?.email && <div className="text-sm">{data.client.email}</div>}
          {data.client?.address && <div className="text-sm">{data.client.address}</div>}
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-medium">Infos</div>
          <div className="text-sm">Date: {data.issue_date}</div>
          {data.due_date && <div className="text-sm">Échéance: {data.due_date}</div>}
          <div className="text-sm">Statut: <span className="capitalize">{data.status}</span></div>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-medium">Montants</div>
          <div className="text-sm">HT: $ {Number(data.total_ht).toFixed(2)}</div>
          <div className="text-sm">TVA: {(Number(data.tva_rate)*100).toFixed(0)}%</div>
          <div className="text-sm">TTC: $ {Number(data.total_ttc).toFixed(2)}</div>
          <div className="text-sm">Payé: $ {paid.toFixed(2)}</div>
          <div className="text-sm">Reste: $ {due.toFixed(2)}</div>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Lignes</div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Désignation</th>
              <th className="p-2">PU</th>
              <th className="p-2">Qté</th>
              <th className="p-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((it, idx) => (
              <tr key={idx} className="border-t">
                <td className="p-2">{it.description}</td>
                <td className="p-2">$ {Number(it.unit_price).toFixed(2)}</td>
                <td className="p-2">{it.quantity}</td>
                <td className="p-2">$ {Number(it.total).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="font-medium mb-2">Paiements</div>
          <ul className="text-sm space-y-1">
            {(data.payments||[]).map(p => (
              <li key={p.id} className="flex justify-between items-center border-b py-1">
                <span>$ {Number(p.amount).toFixed(2)} • {p.method} • {p.paid_at}</span>
                <button onClick={()=>deletePayment(p.id)} className="text-red-600">Supprimer</button>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-medium mb-2">Ajouter un paiement</div>
          <form onSubmit={addPayment} className="space-y-2">
            <div className="flex gap-2">
              <input type="number" step="0.01" placeholder="Montant" value={pAmount} onChange={e=>setPAmount(e.target.value)} className="border rounded px-3 py-2 w-32" />
              <select value={pMethod} onChange={e=>setPMethod(e.target.value)} className="border rounded px-3 py-2">
                <option value="especes">Espèces</option>
                <option value="virement">Virement</option>
                <option value="carte">Carte</option>
                <option value="cheque">Chèque</option>
              </select>
              <input type="date" value={pDate} onChange={e=>setPDate(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <input placeholder="Note (optionnel)" value={pNote} onChange={e=>setPNote(e.target.value)} className="border rounded px-3 py-2 w-full" />
            <button className="bg-gray-900 text-white px-4 py-2 rounded">Enregistrer le paiement</button>
          </form>
        </div>
      </div>
    </div>
  )
}
