import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from './TextoMatematico'
import RenderFiguraCodigo from './RenderFiguraCodigo'

export default function ListaPreguntas({ simulacroId, refrescar }) {
  const [preguntas, setPreguntas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const cargar = async () => {
      setCargando(true)
      const { data, error } = await supabase
        .from('preguntas')
        .select('*')
        .eq('simulacro_id', simulacroId)
        .order('orden', { ascending: true })

      if (error) {
        console.error('Error al cargar preguntas:', error)
        setError('No se pudieron cargar las preguntas.')
      } else {
        setError('')
        setPreguntas(data || [])
      }
      setCargando(false)
    }
    cargar()
  }, [simulacroId, refrescar])

  return (
    <div style={{ marginTop: '30px' }}>
      <h3 style={{ color: brand.colors.text, marginBottom: '15px', fontSize: '18px' }}>
        Preguntas de este simulacro ({preguntas.length})
      </h3>

      {cargando && <p style={{ color: brand.colors.textMuted }}>Cargando...</p>}
      {error && <p style={{ color: brand.colors.error }}>{error}</p>}
      {!cargando && !error && preguntas.length === 0 && (
        <p style={{ color: brand.colors.textMuted }}>Aún no hay preguntas.</p>
      )}

      {preguntas.map((p, i) => {
        // Soporta figura nueva (figura_codigo + figura_tipo) y la antigua (figura_svg)
        const figuraCodigo = p.figura_codigo || p.figura_svg || null
        const figuraTipo = p.figura_codigo ? p.figura_tipo || 'svg' : p.figura_svg ? 'svg' : null

        return (
          <div
            key={p.id}
            style={{
              padding: '16px',
              borderRadius: '8px',
              border: `1px solid ${brand.colors.textMuted}`,
              marginBottom: '12px',
            }}
          >
            {p.imagen_url && (
              <img
                src={p.imagen_url}
                alt="Imagen de la pregunta"
                style={{
                  maxWidth: '100%',
                  maxHeight: '300px',
                  borderRadius: '6px',
                  marginBottom: '15px',
                  display: 'block',
                }}
              />
            )}

            <p style={{ color: brand.colors.text, fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>
              {i + 1}. <TextoMatematico texto={p.enunciado} />
            </p>

            {figuraCodigo && <RenderFiguraCodigo tipo={figuraTipo} codigo={figuraCodigo} />}

            {Object.entries(p.alternativas || {}).map(([letra, texto]) => (
              <p
                key={letra}
                style={{
                  color: letra === p.clave ? '#22c55e' : brand.colors.textMuted,
                  fontSize: '14px',
                  margin: '6px 0',
                  lineHeight: '1.6',
                }}
              >
                <span style={{ fontWeight: 'bold', marginRight: '8px' }}>
                  {letra})
                </span>
                <TextoMatematico texto={texto} />
                {letra === p.clave && <span style={{ marginLeft: '8px' }}>✓</span>}
              </p>
            ))}
          </div>
        )
      })}
    </div>
  )
}
