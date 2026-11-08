// Componente para importar preguntas desde texto plano
// Formato (acepta "### PREGUNTA" o "#1", "#2", ...):
//   enunciado (varias líneas, LaTeX con $...$)
//   A) ...  B) ...  C) ...  D) ...
//   RESPUESTA: X
//   FIGURA: svg   (opcional; el código va después, hasta FIN o la siguiente pregunta)
//   FIN           (opcional)

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from './TextoMatematico'
import RenderFiguraCodigo from './RenderFiguraCodigo'

const PLACEHOLDER = `#1
Calcula sen(θ) en el triángulo ABC.
A) 7/25
B) 24/25
C) 7/24
D) 24/7
RESPUESTA: A
FIGURA: svg
<svg viewBox="0 0 320 230" xmlns="http://www.w3.org/2000/svg">...</svg>
FIN

#2
Calcula 2 + 2.
A) 3
B) 4
C) 5
D) 6
RESPUESTA: B
FIN`

export default function ImportarPreguntasTexto({ simulacroId, onImportado }) {
  const [texto, setTexto] = useState('')
  const [parseado, setParseado] = useState([])
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  const parsearTexto = (texto) => {
    const lineas = texto.replace(/\r/g, '').split('\n')
    const preguntas = []
    let actual = null
    let estado = null
    let ultimaAlt = null

    const nueva = () => ({
      enun: [],
      alts: { A: '', B: '', C: '', D: '' },
      clave: '',
      figTipo: '',
      fig: [],
    })

    const cerrar = () => {
      if (!actual) return
      const enunciado = actual.enun.join('\n').trim()
      const codigo = actual.fig.join('\n').trim()
      const errores = []

      if (!enunciado) errores.push('Enunciado vacío')
      for (const l of ['A', 'B', 'C', 'D']) {
        if (!actual.alts[l].trim()) errores.push(`Falta alternativa ${l}`)
      }
      if (!actual.clave) errores.push('RESPUESTA inválida o ausente')
      if (actual.figTipo && !codigo) errores.push('FIGURA sin código')
      if (codigo && actual.figTipo === 'svg' && !codigo.includes('<svg')) {
        errores.push('El código de la figura no parece SVG')
      }

      preguntas.push({
        numero: preguntas.length + 1,
        enunciado,
        alternativas: actual.alts,
        correcta: actual.clave,
        figura_tipo: codigo ? actual.figTipo || 'svg' : null,
        figura_codigo: codigo || null,
        error: errores.length > 0 ? errores : null,
      })
      actual = null
      estado = null
      ultimaAlt = null
    }

    for (const linea of lineas) {
      const t = linea.trim()

      // Inicio de pregunta: "### PREGUNTA" o "#1"
      if (/^(###\s*PREGUNTA\b.*|#\s*\d+)$/i.test(t)) {
        cerrar()
        actual = nueva()
        estado = 'enunciado'
        continue
      }
      if (!actual) continue

      if (/^FIN$/i.test(t)) {
        cerrar()
        continue
      }

      const resp = t.match(/^RESPUESTA\s*:\s*([A-D])\b/i)
      if (resp) {
        actual.clave = resp[1].toUpperCase()
        if (estado !== 'figura') estado = 'respuesta'
        continue
      }

      const fig = t.match(/^FIGURA\s*:\s*(svg|jsxgraph)\b/i)
      if (fig) {
        actual.figTipo = fig[1].toLowerCase()
        estado = 'figura'
        continue
      }

      if (estado === 'figura') {
        actual.fig.push(linea)
        continue
      }

      if (!t) continue

      const alt = t.match(/^([A-D])\s*[).]\s*(.*)$/i)
      if (alt) {
        ultimaAlt = alt[1].toUpperCase()
        actual.alts[ultimaAlt] = alt[2].trim()
        estado = 'alternativas'
        continue
      }

      if (estado === 'alternativas' && ultimaAlt) {
        actual.alts[ultimaAlt] += ' ' + t
      } else if (estado === 'enunciado') {
        const limpio = actual.enun.length === 0 ? t.replace(/^ENUNCIADO\s*:\s*/i, '') : t
        actual.enun.push(limpio)
      }
    }
    cerrar()
    return preguntas
  }

  const handleProcesar = () => {
    setError('')
    const preguntas = parsearTexto(texto)
    if (preguntas.length === 0) {
      setError('No encontré preguntas. Cada pregunta debe empezar con #1, #2... o con ### PREGUNTA.')
    }
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
      const { data: ultima } = await supabase
        .from('preguntas')
        .select('orden')
        .eq('simulacro_id', simulacroId)
        .order('orden', { ascending: false })
        .limit(1)

      const ordenInicial = (ultima?.[0]?.orden ?? 0) + 1

      const preguntasValidas = parseado.filter((p) => !p.error)

      if (preguntasValidas.length === 0) {
        setError('No hay preguntas válidas para guardar')
        setCargando(false)
        return
      }

      for (let i = 0; i < preguntasValidas.length; i++) {
        const pregunta = preguntasValidas[i]
        const orden = ordenInicial + i

        const { error: errorRpc } = await supabase.rpc('agregar_pregunta', {
          p_simulacro_id: simulacroId,
          p_enunciado: pregunta.enunciado,
          p_alternativas: pregunta.alternativas,
          p_correcta: pregunta.correcta,
          p_orden: orden,
          p_imagen_url: null,
          p_figura_svg: null,
          p_figura_codigo: pregunta.figura_codigo,
          p_figura_tipo: pregunta.figura_tipo,
        })

        if (errorRpc) {
          throw new Error(`Error en pregunta ${i + 1}: ${errorRpc.message}`)
        }
      }

      const cantidadGuardada = preguntasValidas.length
      setTexto('')
      setParseado([])

      if (onImportado) {
        onImportado(cantidadGuardada)
      }
    } catch (err) {
      setError(`Error al guardar: ${err.message}`)
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
    setParseado(parseado.filter((p) => !p.error))
  }

  const validas = parseado.filter((p) => !p.error).length
  const conErrores = parseado.length - validas

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
          placeholder={PLACEHOLDER}
          rows={10}
          spellCheck={false}
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
            boxSizing: 'border-box',
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
            {validas} preguntas válidas, {conErrores} con errores
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

              {pregunta.figura_codigo && (
                <RenderFiguraCodigo tipo={pregunta.figura_tipo} codigo={pregunta.figura_codigo} />
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
              disabled={conErrores === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.warning}`,
                backgroundColor: 'transparent',
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: conErrores === 0 ? 'not-allowed' : 'pointer',
                opacity: conErrores === 0 ? 0.5 : 1,
              }}
            >
              Descartar errores
            </button>

            <button
              onClick={handleGuardar}
              disabled={cargando || validas === 0}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: brand.colors.success,
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: cargando || validas === 0 ? 'not-allowed' : 'pointer',
                opacity: cargando || validas === 0 ? 0.5 : 1,
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
