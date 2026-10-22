// Página de Login
// Permite a los usuarios iniciar sesión con correo y contraseña

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Mensajes de error claros en español, sin detalles técnicos
        if (error.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu correo electrónico')
        } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo')
        }
        return
      }

      // Si el login es exitoso, la redirección se maneja en el componente App
      // gracias al context AuthContext
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: brand.colors.background,
      padding: '20px',
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        padding: '40px',
        borderRadius: '12px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: `1px solid ${brand.colors.violetNeon}`,
        boxShadow: `0 0 20px rgba(139, 92, 246, 0.3)`,
      }}>
        <h1 style={{
          color: brand.colors.text,
          textAlign: 'center',
          marginBottom: '10px',
          fontSize: '24px',
        }}>
          {brand.name}
        </h1>
        <p style={{
          color: brand.colors.textMuted,
          textAlign: 'center',
          marginBottom: '30px',
          fontSize: '14px',
        }}>
          {brand.slogan}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{
              display: 'block',
              color: brand.colors.text,
              marginBottom: '8px',
              fontSize: '14px',
            }}>
              Correo electrónico
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.violetNeon}`,
                backgroundColor: 'rgba(5, 6, 15, 0.5)',
                color: brand.colors.text,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="tu@ejemplo.com"
            />
          </div>

          <div>
            <label style={{
              display: 'block',
              color: brand.colors.text,
              marginBottom: '8px',
              fontSize: '14px',
            }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.violetNeon}`,
                backgroundColor: 'rgba(5, 6, 15, 0.5)',
                color: brand.colors.text,
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: '6px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${brand.colors.error}`,
              color: brand.colors.error,
              fontSize: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '6px',
              border: 'none',
              backgroundColor: brand.colors.violetNeon,
              color: brand.colors.text,
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
