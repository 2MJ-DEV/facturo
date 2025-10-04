import { useState } from 'react'
import { api } from '../api.js'
import { setToken } from '../auth.js'
import { Link } from 'react-router-dom'

export default function Login() {
  const [email, setEmail] = useState('admin@facturo.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await api('/auth/login', { method: 'POST', body: { email, password } })
      setToken(res.token)
      window.location.href = '/'
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={onSubmit} className="bg-white shadow rounded p-6 w-full max-w-sm">
        <h1 className="text-xl font-semibold mb-4">Se connecter</h1>
        {error && <div className="text-red-600 text-sm mb-2">{error}</div>}
        <label className="block text-sm mb-1">Email</label>
        <input className="border rounded w-full px-3 py-2 mb-3" value={email} onChange={e=>setEmail(e.target.value)} />
        <label className="block text-sm mb-1">Mot de passe</label>
        <input type="password" className="border rounded w-full px-3 py-2 mb-4" value={password} onChange={e=>setPassword(e.target.value)} />
        <button disabled={loading} className="bg-gray-900 text-white w-full py-2 rounded disabled:opacity-50">
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <div className="text-sm text-center mt-3">Pas de compte ? <Link className="text-blue-600" to="/register">Créer un compte</Link></div>
      </form>
    </div>
  )
}
