// Lista de simulacros creados por el docente

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'

export default function ListaSimulacros({ onSimulacroSeleccionado, onSimulacroEliminado, onVerAlumnos }) {
  const [simulacros, setSimulacros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    cargarSimulacros()
  }, [])

  const cargarSimulacros = async () => {
    setLoading(true)
    setError('')

    try {
      const { data, error } = await supabase
        .from('simulacros')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        setError('Error al cargar los simulacros')
        return
      }

      setSimulacros(data || [])
    } catch (err) {
      setError('Error al cargar los simulacros')
    } finally {
      setLoading(false)
    }
  }

  const handleEliminar = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este simulacro?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('simulacros')
        .delete()
        .eq('id', id)

      if (error) {
        setError('Error al eliminar el simulacro')
        return
      }

      // Recargar la lista
      cargarSimulacros()

      // Notificar al componente padre
      if (onSimulacroEliminado) {
        onSimulacroEliminado()
      }
    } catch (err) {
      setError('Error al eliminar el simulacro')
    }
  }

  const handleSeleccionar = (simulacro) => {
    if (onSimulacroSeleccionado) {
      onSimulacroSeleccionado(simulacro)
    }
  }

  const handleVerAlumnos = (simulacro) => {
    if (onVerAlumnos) {
      onVerAlumnos(simulacro)
    }
  }

  const handleToggleActivo = async (simulacro) => {
    try {
      const { error } = await supabase
        .from('simulacros')
        .update({ activo: !simulacro.activo })
        .eq('id', simulacro.id)

      if (error) {
        setError('Error al cambiar estado del simulacro')
        return
      }

      // Recargar la lista
      cargarSimulacros()
    } catch (err) {
      setError('Error al cambiar estado del simulacro')
    }
  }

  if (loading) {
    return (
      <div style={{
        padding: '20px',
        color: brand.colors.textMuted,
        textAlign: 'center',
      }}>
        Cargando simulacros...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        backgroundColor: 'rgba(239, 68, 68, 0.2)',
        border: `1px solid ${brand.colors.error}`,
        color: brand.colors.error,
        textAlign: 'center',
      }}>
        {error}
      </div>
    )
  }

  if (simulacros.length === 0) {
    return (
      <div style={{
        padding: '20px',
        color: brand.colors.textMuted,
        textAlign: 'center',
      }}>
        No hay simulacros creados aún.
      </div>
    )
  }

  return (
    <div>
      <h3 style={{
        color: brand.colors.text,
        marginBottom: '15px',
        fontSize: '18px',
      }}>
        Simulacros creados
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {simulacros.map((simulacro) => (
          <div
            key={simulacro.id}
            style={{
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${brand.colors.electricBlue}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{
                color: brand.colors.text,
                fontSize: '16px',
                fontWeight: 'bold',
                marginBottom: '5px',
              }}>
                {simulacro.titulo}
              </div>
              <div style={{
                color: brand.colors.textMuted,
                fontSize: '14px',
              }}>
                Duración: {simulacro.duracion_minutos} minutos
              </div>
              <div style={{
                color: simulacro.activo ? brand.colors.success : brand.colors.textMuted,
                fontSize: '12px',
                marginTop: '5px',
                fontWeight: 'bold',
              }}>
                {simulacro.activo ? '✓ Activo' : '✗ Inactivo'}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => handleSeleccionar(simulacro)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: brand.colors.electricBlue,
                  color: brand.colors.text,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Ver preguntas
              </button>

              <button
                onClick={() => handleVerAlumnos(simulacro)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: brand.colors.violetNeon,
                  color: brand.colors.text,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Ver alumnos
              </button>

              <button
                onClick={() => handleToggleActivo(simulacro)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: simulacro.activo ? brand.colors.success : brand.colors.warning,
                  color: brand.colors.text,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                {simulacro.activo ? 'Desactivar' : 'Activar'}
              </button>

              <button
                onClick={() => handleEliminar(simulacro.id)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  backgroundColor: brand.colors.error,
                  color: brand.colors.text,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => e.target.style.opacity = '0.8'}
                onMouseOut={(e) => e.target.style.opacity = '1'}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
