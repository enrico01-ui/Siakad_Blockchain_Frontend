// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InputData from './pages/InputData'
import Verifikasi from './pages/Verifikasi'
import AuditTrail from './pages/AuditTrail'
import ManajemenUser from './pages/ManajemenUser'
import Layout from './components/Layout'
import Dokumen from './pages/Dokumen'

function PrivateRoute({ children, roles }) {
  const { user, token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user?.role)) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="input" element={<PrivateRoute roles={['admin','dosen']}><InputData /></PrivateRoute>} />
            <Route path="verifikasi" element={<Verifikasi />} />
            <Route path="dokumen" element={<PrivateRoute><Dokumen /></PrivateRoute>} />
            <Route path="audit" element={<PrivateRoute roles={['admin','dosen']}><AuditTrail /></PrivateRoute>} />
            <Route path="users" element={<PrivateRoute roles={['admin']}><ManajemenUser /></PrivateRoute>} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}