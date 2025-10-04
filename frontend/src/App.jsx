import { BrowserRouter, Routes, Route, Navigate, Link, Outlet } from 'react-router-dom'
import { useEffect, useState } from 'react'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Invoices from './pages/Invoices.jsx'
import InvoiceForm from './pages/InvoiceForm.jsx'
import InvoiceView from './pages/InvoiceView.jsx'
import Clients from './pages/Clients.jsx'
import Users from './pages/Users.jsx'
import Audit from './pages/Audit.jsx'
import { getToken, clearToken } from './auth.js'
import { api } from './api.js'

function Protected({ children }) {
  const [ok] = useState(() => !!getToken())
  if (!ok) return <Navigate to="/login" replace />
  return children
}

function NavBar() {
  const [role, setRole] = useState(null)
  useEffect(() => {
    (async () => {
      try {
        const r = await api('/auth/me')
        setRole(r.user?.role || null)
      } catch {}
    })()
  }, [])
  const isAdmin = role === 'admin'
  return (
    <nav className="bg-gray-900 text-white px-4 py-2 flex gap-4 items-center justify-between">
      <div className="flex gap-4 items-center">
        <span className="font-semibold">Facturo</span>
        <Link className="hover:underline" to="/dashboard">Dashboard</Link>
        <Link className="hover:underline" to="/invoices">Factures</Link>
        <Link className="hover:underline" to="/clients">Clients</Link>
        {isAdmin && <Link className="hover:underline" to="/users">Utilisateurs</Link>}
        {isAdmin && <Link className="hover:underline" to="/audit">Audit</Link>}
      </div>
      <button className="text-sm" onClick={() => { clearToken(); window.location.href = '/login' }}>Déconnexion</button>
    </nav>
  )
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="p-4">
        <Outlet />
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/"
          element={
            <Protected>
              <AppLayout />
            </Protected>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/new" element={<InvoiceForm />} />
          <Route path="invoices/:id" element={<InvoiceView />} />
          <Route path="clients" element={<Clients />} />
          <Route path="users" element={<Users />} />
          <Route path="audit" element={<Audit />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}