// Formulario para crear un nuevo simulacro

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'

export default function CrearSimulacro({ onSimulacroCreado }) {
  const [titulo, setTitulo] = useState('')
  const [duracion, setDuracion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error } = await supabase.rpc('crear_simulacro', {
        p_titulo: titulo,
        p_duracion: parseInt(duracion),
      })

      if (error) {
        setError('Error al crear el simulacro. Inténtalo de nuevo.')
        return
      }

      // Limpiar formulario
      setTitulo('')
      setDuracion('')

      // Notificar al componente padre
      if (onSimulacroCreado) {
        onSimulacroCreado()
      }
    } catch (err) {
      setError('Error al crear el simulacro. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      border: `1px solid ${brand.colors.electricBlue}`,
      marginBottom: '20px',
    }}>
      <h3 style={{
        color: brand.colors.text,
        marginBottom: '15px',
        fontSize: '18px',
      }}>
        Crear nuevo simulacro
      </h3>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{
            display: 'block',
            color: brand.colors.text,
            marginBottom: '5px',
            fontSize: '14px',
          }}>
            Título del simulacro
          </label>
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: `1px solid ${brand.colors.electricBlue}`,
              backgroundColor: 'rgba(5, 6, 15, 0.5)',
              color: brand.colors.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
            placeholder="Ej: Simulacro de Matemáticas"
          />
        </div>

        <div>
          <label style={{
            display: 'block',
            color: brand.colors.text,
            marginBottom: '5px',
            fontSize: '14px',
          }}>
            Duración (minutos)
          </label>
          <input
            type="number"
            value={duracion}
            onChange={(e) => setDuracion(e.target.value)}
            required
            min="1"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '6px',
              border: `1px solid ${brand.colors.electricBlue}`,
              backgroundColor: 'rgba(5, 6, 15, 0.5)',
              color: brand.colors.text,
              fontSize: '14px',
              boxSizing: 'border-box',
            }}
            placeholder="30"
          />
        </div>

        {error && (
          <div style={{
            padding: '10px',
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
            padding: '12px 24px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: brand.colors.electricBlue,
            color: brand.colors.text,
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}
        >
          {loading ? 'Creando...' : 'Crear simulacro'}
        </button>
      </form>
    </div>
  )
}
