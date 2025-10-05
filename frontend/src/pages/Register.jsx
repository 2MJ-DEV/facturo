import { useState } from 'react'
import { api } from '../api.js'
import { Link, useNavigate } from 'react-router-dom'

export default function Register() {
  const nav = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await api('/auth/register', { method: 'POST', body: { email, password } })
      nav('/login')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white shadow rounded p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Créer un compte</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="block text-sm mb-1">Email</label>
        <input className="border rounded w-full px-3 py-2 mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="block text-sm mb-1">Mot de passe</label>
        <input type="password" className="border rounded w-full px-3 py-2 mb-4" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} className="bg-gray-900 text-white w-full py-2 rounded disabled:opacity-50">{loading ? 'Création...' : 'Créer le compte'}</button>
        <div className="text-sm text-center mt-3">Déjà un compte ? <Link className="text-blue-600" to="/login">Se connecter</Link></div>
      </form>
    </div>
  )
}
