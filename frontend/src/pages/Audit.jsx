import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Audit() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    (async () => {
      setLoading(true)
      setError('')
      try {
        const data = await api('/audit')
        setRows(data)
      } catch (e) { setError(e.message) }
      finally { setLoading(false) }
    })()
  }, [])

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Journal d'audit</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Date</th>
              <th className="p-2">Utilisateur</th>
              <th className="p-2">Action</th>
              <th className="p-2">Entité</th>
              <th className="p-2">Détails</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={5}>Chargement...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={5}>Aucun log</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-t">
                <td className="p-2">{r.created_at}</td>
                <td className="p-2">{r.user_email || '-'}</td>
                <td className="p-2">{r.action}</td>
                <td className="p-2">{r.entity}{r.entity_id ? `#${r.entity_id}` : ''}</td>
                <td className="p-2">
                  <pre className="whitespace-pre-wrap break-words">{r.details ? JSON.stringify(r.details) : ''}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
