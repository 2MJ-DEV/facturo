import { useEffect, useState } from 'react'
import { api } from '../api'

const ROLES = ['admin','accountant','employee']

export default function Users() {
  const [rows, setRows] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api('/users')
      setRows(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function changeRole(id, role) {
    try {
      await api(`/users/${id}/role`, { method: 'PUT', body: { role } })
      await load()
    } catch (e) { setError(e.message) }
  }

  async function removeUser(id) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await api(`/users/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Utilisateurs</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Email</th>
              <th className="p-2">Rôle</th>
              <th className="p-2">Créé le</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={4}>Chargement...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={4}>Aucun utilisateur</td></tr>
            ) : rows.map(u => (
              <tr key={u.id} className="border-t">
                <td className="p-2">{u.email}</td>
                <td className="p-2">
                  <select value={u.role} onChange={e=>changeRole(u.id, e.target.value)} className="border rounded px-2 py-1">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td className="p-2">{u.created_at}</td>
                <td className="p-2"><button className="text-red-600" onClick={()=>removeUser(u.id)}>Supprimer</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
