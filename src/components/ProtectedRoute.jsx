// Componente que protege las rutas
// Si no hay sesión, redirige al login
// Si un alumno intenta entrar a /docente, lo redirige a /alumno

import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export function ProtectedRoute({ children, allowedRole }) {
  const { session, loading, userRole } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#e2e8f0',
      }}>
        Cargando...
      </div>
    )
  }

  // Si no hay sesión, redirigir al login
  if (!session) {
    return <Navigate to="/login" replace />
  }

  // Si se requiere un rol específico y el usuario no lo tiene, redirigir
  if (allowedRole && userRole !== allowedRole) {
    // Si es alumno intentando entrar a docente, ir a alumno
    if (allowedRole === 'docente' && userRole === 'alumno') {
      return <Navigate to="/alumno" replace />
    }
    // Si es docente intentando entrar a alumno, ir a docente
    if (allowedRole === 'alumno' && userRole === 'docente') {
      return <Navigate to="/docente" replace />
    }
  }

  return children
}

// NOTA: Esta protección de rutas es solo por comodidad.
// La seguridad real está en la base de datos con Row Level Security (RLS).
