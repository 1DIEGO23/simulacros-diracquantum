// Página del Docente
// Muestra un mensaje de bienvenida y un botón para cerrar sesión

import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'

export default function Docente() {
  const { session, userRole } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error al cerrar sesión:', error)
    }
    navigate('/login')
  }

  if (!session) {
    return null // El ProtectedRoute manejará la redirección
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brand.colors.background,
      padding: '40px 20px',
    }}>
      <div style={{
        maxWidth: '600px',
        margin: '0 auto',
        padding: '40px',
        borderRadius: '12px',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        border: `1px solid ${brand.colors.electricBlue}`,
        boxShadow: `0 0 20px rgba(59, 130, 246, 0.3)`,
      }}>
        <h1 style={{
          color: brand.colors.text,
          marginBottom: '20px',
          fontSize: '28px',
        }}>
          Hola, {session.user.email}
        </h1>

        <p style={{
          color: brand.colors.textMuted,
          marginBottom: '30px',
          fontSize: '16px',
        }}>
          Rol: {userRole === 'docente' ? 'Docente' : userRole}
        </p>

        <p style={{
          color: brand.colors.textMuted,
          marginBottom: '30px',
          fontSize: '14px',
        }}>
          Próximamente podrás crear simulacros, ver los resultados de los alumnos y gestionar el contenido.
        </p>

        <button
          onClick={handleLogout}
          style={{
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: brand.colors.violetNeon,
            color: brand.colors.text,
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.8'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
