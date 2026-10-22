// Componente principal de la aplicación
// Configura las rutas y el contexto de autenticación

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Login from './pages/Login'
import Alumno from './pages/Alumno'
import Docente from './pages/Docente'
import { brand } from './config/brand'

function AppRoutes() {
  const { session, loading, userRole } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: brand.colors.background,
        color: brand.colors.text,
      }}>
        Cargando...
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={
        session ? (
          // Si ya hay sesión, redirigir según el rol
          userRole === 'docente' ? <Navigate to="/docente" replace /> : <Navigate to="/alumno" replace />
        ) : (
          <Login />
        )
      } />

      <Route path="/alumno" element={
        <ProtectedRoute allowedRole="alumno">
          <Alumno />
        </ProtectedRoute>
      } />

      <Route path="/docente" element={
        <ProtectedRoute allowedRole="docente">
          <Docente />
        </ProtectedRoute>
      } />

      <Route path="/" element={
        session ? (
          userRole === 'docente' ? <Navigate to="/docente" replace /> : <Navigate to="/alumno" replace />
        ) : (
          <Navigate to="/login" replace />
        )
      } />
    </Routes>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
