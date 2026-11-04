// Componente para importar preguntas desde CSV
// Formato CSV: simulacro, numero, enunciado, A, B, C, D, correcta, tema, imagen

import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from './TextoMatematico'

export default function ImportarPreguntaCSV({ simulacroId, onImportado }) {
  const [csvData, setCsvData] = useState('')
  const [parseado, setParseado] = useState([])
  const [errores, setErrores] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  const parsearCSV = (texto) => {
    const lineas = texto.trim().split('\n')
    const headers = lineas[0].split(',').map(h => h.trim().toLowerCase())
    const filas = []

    for (let i = 1; i < lineas.length; i++) {
      if (!lineas[i].trim()) continue

      // Parsear CSV simple (manejar comillas en el futuro si es necesario)
      const valores = lineas[i].split(',').map(v => v.trim())
      const fila = {}

      headers.forEach((header, index) => {
        fila[header] = valores[index] || ''
      })

      filas.push(fila)
    }

    return filas
  }

  const validarFila = (fila) => {
    const erroresFila = []

    if (!fila.simulacro) erroresFila.push('Falta simulacro')
    if (!fila.numero) erroresFila.push('Falta número')
    if (!fila.enunciado) erroresFila.push('Falta enunciado')
    if (!fila.a) erroresFila.push('Falta alternativa A')
    if (!fila.b) erroresFila.push('Falta alternativa B')
    if (!fila.c) erroresFila.push('Falta alternativa C')
    if (!fila.d) erroresFila.push('Falta alternativa D')
    if (!fila.correcta || !['a', 'b', 'c', 'd'].includes(fila.correcta.toLowerCase())) {
      erroresFila.push('Correcta debe ser A, B, C o D')
    }

    return erroresFila
  }

  const handleArchivo = (e) => {
    const archivo = e.target.files[0]
    if (!archivo) return

    const lector = new FileReader()
    lector.onload = (event) => {
      setCsvData(event.target.result)
    }
    lector.readAsText(archivo)
  }

  const handleProcesar = () => {
    const filas = parsearCSV(csvData)
    const erroresTotales = []

    filas.forEach((fila, index) => {
      const erroresFila = validarFila(fila)
      if (erroresFila.length > 0) {
        erroresTotales.push({ fila: index + 1, errores: erroresFila, datos: fila })
      }
    })

    setParseado(filas)
    setErrores(erroresTotales)
    setMostrarVistaPrevia(true)
  }

  const handleSubirImagen = async (fila, filaIndex) => {
    if (!fila.imagen || fila.imagen.startsWith('http')) return fila

    try {
      const extension = fila.imagen.split('.').pop()
      const nombreArchivo = `${Date.now()}_${filaIndex}.${extension}`

      const { error } = await supabase.storage
        .from('preguntas')
        .upload(nombreArchivo, fila.imagen)

      if (error) throw error

      const { data } = supabase.storage.from('preguntas').getPublicUrl(nombreArchivo)
      return { ...fila, imagen_url: data.publicUrl }
    } catch (error) {
      console.error('Error al subir imagen:', error)
      return { ...fila, error_imagen: true }
    }
  }

  const handleImportar = async () => {
    if (errores.length > 0) {
      alert('Hay filas con errores. Corrígelos antes de importar.')
      return
    }

    setCargando(true)

    try {
      // Subir imágenes primero
      const filasConImagenes = await Promise.all(
        parseado.map((fila, index) => handleSubirImagen(fila, index))
      )

      // Importar preguntas
      for (const fila of filasConImagenes) {
        const alternativas = {
          A: fila.a,
          B: fila.b,
          C: fila.c,
          D: fila.d,
        }

        const { error } = await supabase.rpc('agregar_pregunta', {
          p_simulacro_id: simulacroId,
          p_enunciado: fila.enunciado,
          p_alternativas: alternativas,
          p_correcta: fila.correcta.toUpperCase(),
          p_orden: parseInt(fila.numero),
          p_imagen_url: fila.imagen_url || null,
        })

        if (error) throw error
      }

      setCsvData('')
      setParseado([])
      setErrores([])
      setMostrarVistaPrevia(false)

      if (onImportado) onImportado()
    } catch (error) {
      alert(`Error al importar: ${error.message}`)
    } finally {
      setCargando(false)
    }
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
        Importar preguntas desde CSV
      </h3>

      <div style={{ marginBottom: '15px' }}>
        <label style={{
          display: 'block',
          color: brand.colors.text,
          marginBottom: '8px',
          fontSize: '14px',
        }}>
          Archivo CSV
        </label>
        <input
          type="file"
          accept=".csv"
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
          O pega el contenido del CSV
        </label>
        <textarea
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder="simulacro,numero,enunciado,A,B,C,D,correcta,tema,imagen"
          rows={5}
          style={{
            width: '100%',
            padding: '10px',
            borderRadius: '6px',
            border: `1px solid ${brand.colors.violetNeon}`,
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            color: brand.colors.text,
            fontSize: '14px',
            resize: 'vertical',
          }}
        />
      </div>

      <button
        onClick={handleProcesar}
        disabled={!csvData.trim()}
        style={{
          padding: '10px 20px',
          borderRadius: '6px',
          border: 'none',
          backgroundColor: brand.colors.electricBlue,
          color: brand.colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: !csvData.trim() ? 'not-allowed' : 'pointer',
          opacity: !csvData.trim() ? 0.5 : 1,
        }}
      >
        Procesar CSV
      </button>

      {mostrarVistaPrevia && (
        <div style={{ marginTop: '20px' }}>
          <h4 style={{
            color: brand.colors.text,
            marginBottom: '15px',
            fontSize: '16px',
          }}>
            Vista previa ({parseado.length} preguntas)
          </h4>

          {errores.length > 0 && (
            <div style={{
              padding: '15px',
              borderRadius: '8px',
              backgroundColor: 'rgba(239, 68, 68, 0.2)',
              border: `1px solid ${brand.colors.error}`,
              marginBottom: '20px',
            }}>
              <h5 style={{
                color: brand.colors.error,
                marginBottom: '10px',
                fontSize: '14px',
              }}>
                Errores encontrados ({errores.length} filas):
              </h5>
              {errores.map((error, index) => (
                <div key={index} style={{
                  marginBottom: '8px',
                  fontSize: '13px',
                  color: brand.colors.text,
                }}>
                  <strong>Fila {error.fila}:</strong> {error.errores.join(', ')}
                </div>
              ))}
            </div>
          )}

          {parseado.map((fila, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${brand.colors.electricBlue}`,
                marginBottom: '12px',
              }}
            >
              <p style={{
                color: brand.colors.text,
                fontSize: '14px',
                marginBottom: '8px',
              }}>
                <strong>Pregunta {fila.numero}:</strong> <TextoMatematico texto={fila.enunciado} />
              </p>
              {fila.imagen && (
                <img
                  src={fila.imagen.startsWith('http') ? fila.imagen : URL.createObjectURL(new Blob([fila.imagen]))}
                  alt="Imagen"
                  style={{ maxWidth: '100%', maxHeight: '200px', borderRadius: '6px', marginBottom: '10px' }}
                />
              )}
              <div style={{ fontSize: '13px', color: brand.colors.textMuted }}>
                <p>A: <TextoMatematico texto={fila.a} /></p>
                <p>B: <TextoMatematico texto={fila.b} /></p>
                <p>C: <TextoMatematico texto={fila.c} /></p>
                <p>D: <TextoMatematico texto={fila.d} /></p>
                <p>Correcta: <strong>{fila.correcta.toUpperCase()}</strong></p>
                {fila.tema && <p>Tema: {fila.tema}</p>}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
            <button
              onClick={handleImportar}
              disabled={cargando || errores.length > 0}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: brand.colors.success,
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: cargando || errores.length > 0 ? 'not-allowed' : 'pointer',
                opacity: cargando || errores.length > 0 ? 0.5 : 1,
              }}
            >
              {cargando ? 'Importando...' : 'Importar preguntas'}
            </button>

            <button
              onClick={() => {
                setCsvData('')
                setParseado([])
                setErrores([])
                setMostrarVistaPrevia(false)
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
