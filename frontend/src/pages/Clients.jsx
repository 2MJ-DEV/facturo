import { useEffect, useState } from 'react'
import { api } from '../api'

export default function Clients() {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [form, setForm] = useState({ name: '', email: '', address: '' })
  const [editId, setEditId] = useState(null)
  const [edit, setEdit] = useState({ name: '', email: '', address: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError('')
    try {
      const data = await api('/clients')
      setRows(data)
    } catch (e) { setError(e.message) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function createClient(e) {
    e.preventDefault()
    try {
      await api('/clients', { method: 'POST', body: form })
      setForm({ name: '', email: '', address: '' })
      await load()
    } catch (e) { setError(e.message) }
  }

  function startEdit(c) {
    setEditId(c.id)
    setEdit({ name: c.name || '', email: c.email || '', address: c.address || '' })
  }

  async function saveEdit(id) {
    try {
      await api(`/clients/${id}`, { method: 'PUT', body: edit })
      setEditId(null)
      await load()
    } catch (e) { setError(e.message) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Clients</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      <form onSubmit={createClient} className="bg-white border rounded p-4 grid grid-cols-1 md:grid-cols-4 gap-2">
        <input placeholder="Nom" className="border rounded px-3 py-2" value={form.name} onChange={e=>setForm(f=>({ ...f, name: e.target.value }))} required />
        <input placeholder="Email" className="border rounded px-3 py-2" value={form.email} onChange={e=>setForm(f=>({ ...f, email: e.target.value }))} />
        <input placeholder="Adresse" className="border rounded px-3 py-2" value={form.address} onChange={e=>setForm(f=>({ ...f, address: e.target.value }))} />
        <button className="bg-gray-900 text-white rounded px-4">Ajouter</button>
      </form>

      <div className="flex gap-2">
        <input placeholder="Recherche..." className="border rounded px-3 py-2" value={q} onChange={e=>setQ(e.target.value)} />
        <button onClick={async()=>{
          try { const data = await api(`/clients/search?q=${encodeURIComponent(q)}`); setRows(data) } catch(e){ setError(e.message) }
        }} className="border rounded px-3 py-2">Filtrer</button>
        <button onClick={load} className="border rounded px-3 py-2">Tout</button>
      </div>

      <div className="bg-white border rounded overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2">Nom</th>
              <th className="p-2">Email</th>
              <th className="p-2">Adresse</th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td className="p-2" colSpan={4}>Chargement...</td></tr>
            ) : rows.length === 0 ? (
              <tr><td className="p-2" colSpan={4}>Aucun client</td></tr>
            ) : rows.map(c => (
              <tr key={c.id} className="border-t">
                <td className="p-2">
                  {editId===c.id ? <input className="border rounded px-2 py-1 w-full" value={edit.name} onChange={e=>setEdit(ed=>({...ed, name:e.target.value}))} /> : c.name}
                </td>
                <td className="p-2">
                  {editId===c.id ? <input className="border rounded px-2 py-1 w-full" value={edit.email} onChange={e=>setEdit(ed=>({...ed, email:e.target.value}))} /> : (c.email||'')}
                </td>
                <td className="p-2">
                  {editId===c.id ? <input className="border rounded px-2 py-1 w-full" value={edit.address} onChange={e=>setEdit(ed=>({...ed, address:e.target.value}))} /> : (c.address||'')}
                </td>
                <td className="p-2">
                  {editId===c.id ? (
                    <div className="flex gap-2">
                      <button type="button" className="border px-3 py-1 rounded" onClick={()=>saveEdit(c.id)}>Enregistrer</button>
                      <button type="button" className="text-red-600" onClick={()=>setEditId(null)}>Annuler</button>
                    </div>
                  ) : (
                    <button type="button" className="text-blue-600" onClick={()=>startEdit(c)}>Modifier</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
