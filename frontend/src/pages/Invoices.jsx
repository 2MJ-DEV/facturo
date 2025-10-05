import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api'

export default function Invoices() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (q) params.set('q', q)
      if (status) params.set('status', status)
      const data = await api(`/invoices?${params.toString()}`)
      setRows(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Factures</h1>
        <Link to="/invoices/new" className="bg-gray-900 text-white px-3 py-2 rounded text-sm">Nouvelle facture</Link>
      </div>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Recherche (numéro/client)" className="border rounded px-3 py-2 w-full md:w-80" />
        <select value={status} onChange={e=>setStatus(e.target.value)} className="border rounded px-3 py-2">
          <option value="">Tous statuts</option>
          <option value="unpaid">Impayée</option>
          <option value="partial">Partiellement payée</option>
          <option value="paid">Payée</option>
        </select>
        <button onClick={load} className="border px-3 py-2 rounded">Filtrer</button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">#</th>
              <th className="p-2">Client</th>
              <th className="p-2">Date</th>
              <th className="p-2">HT</th>
              <th className="p-2">TTC</th>
              <th className="p-2">Statut</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={7}>Chargement...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={7}>Aucune facture</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.number}</td>
                <td className="p-2">{r.client}</td>
                <td className="p-2">{r.issue_date}</td>
                <td className="p-2">$ {Number(r.total_ht).toFixed(2)}</td>
                <td className="p-2">$ {Number(r.total_ttc).toFixed(2)}</td>
                <td className="p-2 capitalize">{r.status}</td>
                <td className="p-2"><Link className="text-blue-600" to={`/invoices/${r.id}`}>Ouvrir</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
