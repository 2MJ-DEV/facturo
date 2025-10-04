import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api'

export default function InvoiceForm() {
  const nav = useNavigate()
  const [clients, setClients] = useState([])
  const [clientQ, setClientQ] = useState('')
  const [clientId, setClientId] = useState('')
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0,10))
  const [dueDate, setDueDate] = useState('')
  const [tvaRate, setTvaRate] = useState(0.2)
  const [items, setItems] = useState([{ description: '', unit_price: 0, quantity: 1 }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { searchClients('') }, [])

  async function searchClients(q) {
    try {
      const data = await api(`/clients/search?q=${encodeURIComponent(q)}`)
      setClients(data)
    } catch (e) { /* ignore */ }
  }

  function updateItem(idx, key, val) {
    setItems(prev => prev.map((it, i) => i===idx ? { ...it, [key]: val } : it))
  }

  function addRow() { setItems(prev => [...prev, { description: '', unit_price: 0, quantity: 1 }]) }
  function delRow(idx) { setItems(prev => prev.filter((_, i) => i!==idx)) }

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (!clientId) throw new Error('Sélectionnez un client')
      const clean = items.filter(i => i.description && Number(i.unit_price)>=0 && Number(i.quantity)>0)
      if (clean.length === 0) throw new Error('Ajoutez au moins une ligne')
      const res = await api('/invoices', { method: 'POST', body: {
        client_id: Number(clientId),
        issue_date: issueDate,
        due_date: dueDate || null,
        tva_rate: Number(tvaRate),
        items: clean.map(i => ({ description: i.description, unit_price: Number(i.unit_price), quantity: Number(i.quantity) }))
      }})
      nav(`/invoices/${res.id}`)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const totalHT = items.reduce((s,i)=> s + (Number(i.unit_price)||0)*(Number(i.quantity)||0), 0)
  const totalTTC = totalHT * (1 + Number(tvaRate||0))

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">Nouvelle facture</h1>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="bg-white border rounded p-4 space-y-3">
          <div className="flex gap-3 items-end">
            <div>
              <label className="text-sm">Recherche client</label>
              <input value={clientQ} onChange={e=>{setClientQ(e.target.value); searchClients(e.target.value)}} className="border rounded px-3 py-2 block" placeholder="Nom ou email" />
            </div>
            <div>
              <label className="text-sm">Client</label>
              <select value={clientId} onChange={e=>setClientId(e.target.value)} className="border rounded px-3 py-2">
                <option value="">— Sélectionner —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name} {c.email?`<${c.email}>`:''}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm">Date</label>
              <input type="date" value={issueDate} onChange={e=>setIssueDate(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">Échéance</label>
              <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} className="border rounded px-3 py-2" />
            </div>
            <div>
              <label className="text-sm">TVA</label>
              <input type="number" step="0.01" value={tvaRate} onChange={e=>setTvaRate(e.target.value)} className="border rounded px-3 py-2 w-24" />
            </div>
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
                <th className="p-2"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((it, idx) => (
                <tr key={idx} className="border-t">
                  <td className="p-1"><input value={it.description} onChange={e=>updateItem(idx,'description',e.target.value)} className="border rounded px-2 py-1 w-full" /></td>
                  <td className="p-1"><input type="number" step="0.01" value={it.unit_price} onChange={e=>updateItem(idx,'unit_price',e.target.value)} className="border rounded px-2 py-1 w-28" /></td>
                  <td className="p-1"><input type="number" step="0.01" value={it.quantity} onChange={e=>updateItem(idx,'quantity',e.target.value)} className="border rounded px-2 py-1 w-24" /></td>
                  <td className="p-1">$ {((Number(it.unit_price)||0)*(Number(it.quantity)||0)).toFixed(2)}</td>
                  <td className="p-1"><button type="button" onClick={()=>delRow(idx)} className="text-red-600">Suppr</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addRow} className="mt-2 border px-3 py-1 rounded text-sm">Ajouter une ligne</button>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">Total HT: $ {totalHT.toFixed(2)} • TVA: {(Number(tvaRate)*100).toFixed(0)}% • TTC: $ {totalTTC.toFixed(2)}</div>
          <div className="flex gap-2">
            <button type="button" onClick={()=>nav(-1)} className="border px-3 py-2 rounded">Annuler</button>
            <button disabled={loading} className="bg-gray-900 text-white px-4 py-2 rounded">Créer</button>
          </div>
        </div>
      </form>
    </div>
  )
}
