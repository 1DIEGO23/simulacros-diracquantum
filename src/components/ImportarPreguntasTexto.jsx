// Componente para importar preguntas desde texto plano
// Formato: ### PREGUNTA, ENUNCIADO (múltiples líneas), A) B) C) D), RESPUESTA: X
// LaTeX: $...$ (en línea) y $$...$$ (en bloque), respeta barras invertidas tal cual

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from './TextoMatematico'

export default function ImportarPreguntasTexto({ simulacroId, onImportado }) {
  const [texto, setTexto] = useState('')
  const [parseado, setParseado] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const parsearTexto = (texto) => {
    const bloques = texto.trim().split(/### PREGUNTA/i)
    const preguntas = []

    for (let i = 1; i < bloques.length; i++) {
      const bloque = bloques[i].trim()
      if (!bloque) continue

      const pregunta = {
        numero: i,
        enunciado: '',
        alternativas: { A: '', B: '', C: '', D: '' },
        correcta: '',
        error: null
      }

      const lineas = bloque.split('\n')
      let estado = 'enunciado' // enunciado, alternativas, respuesta

      for (const linea of lineas) {
        const lineaTrim = linea.trim()

        if (!lineaTrim) continue

        // Detectar alternativas
        const matchAlt = lineaTrim.match(/^([A-D])\)\s*(.+)$/)
        if (matchAlt) {
          const letra = matchAlt[1].toUpperCase()
          pregunta.alternativas[letra] = matchAlt[2].trim()
          estado = 'alternativas'
          continue
        }

        // Detectar respuesta
        const matchRespuesta = lineaTrim.toUpperCase().match(/^RESPUESTA:\s*([A-D])\s*$/)
        if (matchRespuesta) {
          pregunta.correcta = matchRespuesta[1]
          estado = 'respuesta'
          continue
        }

        // Si es enunciado, agregar líneas
        if (estado === 'enunciado') {
          if (pregunta.enunciado) {
            pregunta.enunciado += '\n' + lineaTrim
          } else {
            pregunta.enunciado = lineaTrim
          }
        }
      }

      preguntas.push(pregunta)
    }

    return preguntas
  }

  const validarPregunta = (pregunta) => {
    const errores = []

    if (!pregunta.enunciado.trim()) {
      errores.push('Enunciado vacío')
    }

    if (!pregunta.alternativas.A.trim()) {
      errores.push('Falta alternativa A')
    }
    if (!pregunta.alternativas.B.trim()) {
      errores.push('Falta alternativa B')
    }
    if (!pregunta.alternativas.C.trim()) {
      errores.push('Falta alternativa C')
    }
    if (!pregunta.alternativas.D.trim()) {
      errores.push('Falta alternativa D')
    }

    if (!pregunta.correcta) {
      errores.push('RESPUESTA inválida o ausente')
    }

    return errores
  }

  const handleProcesar = () => {
    setError('')
    const preguntas = parsearTexto(texto)
    const preguntasConErrores = []

    preguntas.forEach((pregunta) => {
      const errores = validarPregunta(pregunta)
      if (errores.length > 0) {
        pregunta.error = errores
        preguntasConErrores.push(pregunta)
      }
    })

    setParseado(preguntas)
  }

  const handleGuardar = async () => {
    if (!simulacroId) {
      setError('No hay simulacro seleccionado')
      return
    }

    setError('')
    setCargando(true)

    try {
      // Obtener el siguiente orden
      const { data: ultima } = await supabase
        .from('preguntas')
        .select('orden')
        .eq('simulacro_id', simulacroId)
        .order('orden', { ascending: false })
        .limit(1)

      const ordenInicial = (ultima?.[0]?.orden ?? 0) + 1

      // Filtrar solo preguntas válidas
      const preguntasValidas = parseado.filter(p => !p.error)

      if (preguntasValidas.length === 0) {
        setError('No hay preguntas válidas para guardar')
        setCargando(false)
        return
      }

      // Insertar preguntas válidas
      for (let i = 0; i < preguntasValidas.length; i++) {
        const pregunta = preguntasValidas[i]

        const { error } = await supabase.rpc('agregar_pregunta', {
          p_simulacro_id: simulacroId,
          p_enunciado: pregunta.enunciado,
          p_alternativas: pregunta.alternativas,
          p_correcta: pregunta.correcta,
          p_orden: ordenInicial + i,
          p_imagen_url: null,
        })

        if (error) {
          throw new Error(`Error en pregunta ${i + 1}: ${error.message}`)
        }
      }

      const cantidadGuardada = preguntasValidas.length
      setTexto('')
      setParseado([])

      if (onImportado) {
        onImportado(cantidadGuardada)
      }
    } catch (error) {
      setError(`Error al guardar: ${error.message}`)
    } finally {
      setCargando(false)
    }
  }

  const handleArchivo = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const lector = new FileReader()
    lector.onload = (event) => {
      setTexto(event.target.result)
    }
    lector.readAsText(archivo)
  }

  const descartarErrores = () => {
    const preguntasValidas = parseado.filter(p => !p.error)
    setParseado(preguntasValidas)
  }

  return (
    <div style={{
      padding: '20px',
      borderRadius: '8px',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      border: `1px solid ${brand.colors.violetNeon}`,
      marginBottom: '20px',
    }}>
      <h3 style={{
        color: brand.colors.text,
        marginBottom: '15px',
        fontSize: '18px',
      }}>
        Importar preguntas (texto)
      </h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          color: brand.colors.text,
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          Archivo .txt
        </label>
        <input
          type="file"
          accept=".txt"
          onChange={handleArchivo}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: `1px solid ${brand.colors.violetNeon}`,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: brand.colors.text,
            fontSize: '14px',
          }}
        />
      </div>

      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          color: brand.colors.text,
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          O pega el texto
        </label>
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="### PREGUNTA
ENUNCIADO: Calcule $\displaystyle\int_0^1 2x\,dx$.
A) $0$
B) $1$
C) $2$
D) $\tfrac{1}{2}$
RESPUESTA: B"
          rows={10}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: `1px solid ${brand.colors.violetNeon}`,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: brand.colors.text,
            fontSize: '14px',
            resize: 'vertical',
            fontFamily: 'monospace',
          }}
        />
      </div>

      <button
        onClick={handleProcesar}
        disabled={!texto.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: brand.colors.electricBlue,
          color: brand.colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: !texto.trim() ? 'not-allowed' : 'pointer',
          opacity: !texto.trim() ? 0.5 : 1,
        }}
      >
        Procesar texto
      </button>

      {error && (
        <div style={{
          marginTop: '15px',
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

      {parseado.length > 0 && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{
            color: brand.colors.text,
            marginBottom: '15px',
            fontSize: '16px',
          }}>
            Vista previa ({parseado.length} preguntas)
          </h4>

          <div style={{
            marginBottom: '15px',
            padding: '10px',
            borderRadius: '6px',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            border: `1px solid ${brand.colors.electricBlue}`,
            fontSize: '14px',
            color: brand.colors.text,
          }}>
            {parseado.filter(p => !p.error).length} preguntas válidas, {parseado.filter(p => p.error).length} con errores
          </div>

          {parseado.map((pregunta, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: pregunta.error ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                border: pregunta.error ? `1px solid ${brand.colors.error}` : `1px solid ${brand.colors.electricBlue}`,
                marginBottom: '12px',
              }}
            >
              <p style={{
                color: brand.colors.text,
                fontSize: '14px',
                marginBottom: '8px',
                whiteSpace: 'pre-wrap',
              }}>
                <strong>{pregunta.numero}. </strong> <TextoMatematico texto={pregunta.enunciado} />
              </p>

              {pregunta.error && (
                <div style={{
                  marginBottom: '8px',
                  padding: '8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(239, 68, 68, 0.2)',
                  fontSize: '12px',
                  color: brand.colors.error,
                }}>
                  {pregunta.error.join(', ')}
                </div>
              )}

              <div style={{ fontSize: '13px', color: brand.colors.text }}>
                <p>A) <TextoMatematico texto={pregunta.alternativas.A} /></p>
                <p>B) <TextoMatematico texto={pregunta.alternativas.B} /></p>
                <p>C) <TextoMatematico texto={pregunta.alternativas.C} /></p>
                <p>D) <TextoMatematico texto={pregunta.alternativas.D} /></p>
                <p>
                  Respuesta: <strong style={{ color: brand.colors.success }}>
                    {pregunta.correcta} {pregunta.correcta && ' ✓'}
                  </strong>
                </p>
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
            <button
              onClick={descartarErrores}
              disabled={parseado.filter(p => !p.error).length === parseado.length}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.warning}`,
                backgroundColor: 'transparent',
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: parseado.filter(p => !p.error).length === parseado.length ? 'not-allowed' : 'pointer',
                opacity: parseado.filter(p => !p.error).length === parseado.length ? 0.5 : 1,
              }}
            >
              Descartar errores
            </button>

            <button
              onClick={handleGuardar}
              disabled={cargando || parseado.filter(p => !p.error).length === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: brand.colors.success,
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: cargando || parseado.filter(p => !p.error).length === 0 ? 'not-allowed' : 'pointer',
                opacity: cargando || parseado.filter(p => !p.error).length === 0 ? 0.5 : 1,
              }}
            >
              {cargando ? 'Guardando...' : 'Guardar todas'}
            </button>

            <button
              onClick={() => {
                setTexto('')
                setParseado([])
                setError('')
              }}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.textMuted}`,
                backgroundColor: 'transparent',
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
