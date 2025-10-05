 
import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Dashboard() {
  const [totals, setTotals] = useState(null)
  const [monthly, setMonthly] = useState([])
  const [status, setStatus] = useState([])
  const [top, setTop] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      api('/dashboard/totals'),
      api('/dashboard/monthly'),
      api('/dashboard/status'),
      api('/dashboard/top-clients'),
    ]).then(([t, m, s, tc]) => {
      setTotals(t)
      setMonthly(m)
      setStatus(s)
      setTop(tc)
    }).catch(e => setError(e.message))
  }, [])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Tableau de bord</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white border rounded p-4">
            <div className="text-gray-500 text-sm">Total factures</div>
            <div className="text-2xl font-bold">$ {totals.total_invoices.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-4">
            <div className="text-gray-500 text-sm">Total encaissé</div>
            <div className="text-2xl font-bold text-green-700">$ {totals.total_paid.toFixed(2)}</div>
          </div>
          <div className="bg-white border rounded p-4">
            <div className="text-gray-500 text-sm">Restant dû</div>
            <div className="text-2xl font-bold text-amber-600">$ {totals.total_due.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded p-4">
          <div className="font-medium mb-2">Revenus par mois</div>
          <ul className="text-sm space-y-1">
            {monthly.map(r => (
              <li key={r.month} className="flex justify-between"><span>{r.month}</span><span>$ {Number(r.revenue).toFixed(2)}</span></li>
            ))}
          </ul>
        </div>
        <div className="bg-white border rounded p-4">
          <div className="font-medium mb-2">Statut des factures</div>
          <ul className="text-sm space-y-1">
            {status.map(s => (
              <li key={s.status} className="flex justify-between"><span>{s.status}</span><span>{s.count} • $ {Number(s.total).toFixed(2)}</span></li>
            ))}
          </ul>
        </div>
      </div>

      <div className="bg-white border rounded p-4">
        <div className="font-medium mb-2">Top clients (payés)</div>
        <ul className="text-sm space-y-1">
          {top.map((t, i) => (
            <li key={i} className="flex justify-between"><span>{t.client}</span><span>$ {Number(t.paid).toFixed(2)}</span></li>
          ))}
        </ul>
      </div>
    </div>
  )
}
