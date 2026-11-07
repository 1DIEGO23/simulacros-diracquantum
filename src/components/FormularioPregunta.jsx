import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from './TextoMatematico'
import RenderFiguraCodigo from './RenderFiguraCodigo'

const LETRAS = ['A', 'B', 'C', 'D']

const estiloCampo = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: `1px solid ${brand.colors.violetNeon}`,
  backgroundColor: 'rgba(0, 0, 0, 0.3)',
  color: brand.colors.text,
  fontSize: '14px',
  boxSizing: 'border-box',
  marginBottom: '14px',
}

const estiloEtiqueta = {
  display: 'block',
  color: brand.colors.text,
  fontSize: '14px',
  marginBottom: '6px',
}

export default function FormularioPregunta({
  inicial,
  textoBoton,
  onGuardar,
  onCancelar,
  limpiarAlGuardar,
}) {
  const [enunciado, setEnunciado] = useState(inicial?.enunciado || '')
  const [alternativas, setAlternativas] = useState({
    A: '',
    B: '',
    C: '',
    D: '',
    ...(inicial?.alternativas || {}),
  })
  const [correcta, setCorrecta] = useState(inicial?.clave || 'A')
  const [imagenUrl, setImagenUrl] = useState(inicial?.imagen_url || '')
  const [figuraTipo, setFiguraTipo] = useState(inicial?.figura_tipo || 'svg')
  const [figuraCodigo, setFiguraCodigo] = useState(inicial?.figura_codigo || '')
  const [subiendo, setSubiendo] = useState(false)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mostrarVistaPrevia, setMostrarVistaPrevia] = useState(false)

  const handleImagen = async (e) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return

    if (!archivo.type.startsWith('image/')) {
      setError('El archivo debe ser una imagen.')
      return
    }
    if (archivo.size > 5 * 1024 * 1024) {
      setError('La imagen es muy pesada (máximo 5 MB).')
      return
    }

    setError('')
    setSubiendo(true)

    const extension = archivo.name.split('.').pop()
    const ruta = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('preguntas')
      .upload(ruta, archivo)

    if (errorSubida) {
      console.error('Error al subir imagen:', errorSubida)
      setError('No se pudo subir la imagen.')
      setSubiendo(false)
      return
    }

    const { data } = supabase.storage.from('preguntas').getPublicUrl(ruta)
    setImagenUrl(data.publicUrl)
    setSubiendo(false)
  }

  const handleGuardar = async () => {
    setError('')

    if (!enunciado.trim()) {
      setError('Escribe la pregunta.')
      return
    }
    for (const letra of LETRAS) {
      if (!alternativas[letra]?.trim()) {
        setError(`Falta la alternativa ${letra}.`)
        return
      }
    }

    const codigoLimpio = figuraCodigo.trim()

    setGuardando(true)
    try {
      await onGuardar({
        enunciado: enunciado.trim(),
        alternativas,
        clave: correcta,
        imagen_url: imagenUrl || null,
        figura_tipo: codigoLimpio ? figuraTipo : null,
        figura_codigo: codigoLimpio || null,
      })
      if (limpiarAlGuardar) {
        setEnunciado('')
        setAlternativas({ A: '', B: '', C: '', D: '' })
        setCorrecta('A')
        setImagenUrl('')
        setFiguraCodigo('')
        setFiguraTipo('svg')
      }
    } catch (err) {
      console.error('Error al guardar pregunta:', err)
      setError('No se pudo guardar la pregunta.')
    }
    setGuardando(false)
  }

  return (
    <div>
      <label style={estiloEtiqueta}>Enunciado</label>
      <textarea
        value={enunciado}
        onChange={(e) => setEnunciado(e.target.value)}
        placeholder="Escribe la pregunta aquí..."
        rows={3}
        style={{ ...estiloCampo, resize: 'vertical' }}
      />

      <label style={estiloEtiqueta}>Imagen (opcional)</label>
      <input
        type="file"
        accept="image/*"
        onChange={handleImagen}
        style={{ ...estiloCampo, border: `1px dashed ${brand.colors.textMuted}` }}
      />
      {subiendo && (
        <p style={{ color: brand.colors.textMuted, fontSize: '13px', marginTop: '-6px' }}>
          Subiendo imagen...
        </p>
      )}
      {imagenUrl && (
        <div style={{ marginBottom: '14px' }}>
          <img
            src={imagenUrl}
            alt="Imagen de la pregunta"
            style={{ maxWidth: '100%', maxHeight: '260px', borderRadius: '6px', display: 'block' }}
          />
          <button
            type="button"
            onClick={() => setImagenUrl('')}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${brand.colors.error}`,
              backgroundColor: 'transparent',
              color: brand.colors.error,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Quitar imagen
          </button>
        </div>
      )}

      {/* Figura generada por código */}
      <label style={estiloEtiqueta}>Figura por código (opcional)</label>
      <select
        value={figuraTipo}
        onChange={(e) => setFiguraTipo(e.target.value)}
        style={estiloCampo}
      >
        <option value="svg">SVG</option>
        <option value="jsxgraph">JSXGraph</option>
      </select>
      <textarea
        value={figuraCodigo}
        onChange={(e) => setFiguraCodigo(e.target.value)}
        placeholder={
          figuraTipo === 'svg'
            ? '<svg viewBox="0 0 320 230" xmlns="http://www.w3.org/2000/svg">...</svg>'
            : "var A = board.create('point', [-3, -2]);\nvar B = board.create('point', [3, -2]);\nboard.create('segment', [A, B]);"
        }
        rows={6}
        spellCheck={false}
        style={{ ...estiloCampo, resize: 'vertical', fontFamily: 'monospace', fontSize: '13px' }}
      />
      {figuraCodigo.trim() && (
        <div style={{ marginBottom: '14px' }}>
          <p style={{ color: brand.colors.textMuted, fontSize: '13px', marginBottom: '4px' }}>
            Vista previa de la figura:
          </p>
          <RenderFiguraCodigo tipo={figuraTipo} codigo={figuraCodigo} />
          <button
            type="button"
            onClick={() => setFiguraCodigo('')}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: `1px solid ${brand.colors.error}`,
              backgroundColor: 'transparent',
              color: brand.colors.error,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            Quitar figura
          </button>
        </div>
      )}

      {LETRAS.map((letra) => (
        <div key={letra}>
          <label style={estiloEtiqueta}>Alternativa {letra}</label>
          <input
            type="text"
            value={alternativas[letra]}
            onChange={(e) => setAlternativas({ ...alternativas, [letra]: e.target.value })}
            placeholder={`Opción ${letra}`}
            style={estiloCampo}
          />
        </div>
      ))}

      <label style={estiloEtiqueta}>Respuesta correcta</label>
      <select
        value={correcta}
        onChange={(e) => setCorrecta(e.target.value)}
        style={estiloCampo}
      >
        {LETRAS.map((letra) => (
          <option key={letra} value={letra}>
            {letra}
          </option>
        ))}
      </select>

      {error && (
        <p style={{ color: brand.colors.error, fontSize: '14px', marginBottom: '14px' }}>{error}</p>
      )}

      {/* Vista previa de la pregunta */}
      <button
        type="button"
        onClick={() => setMostrarVistaPrevia(!mostrarVistaPrevia)}
        style={{
          padding: '8px 16px',
          borderRadius: '6px',
          border: `1px solid ${brand.colors.violetNeon}`,
          backgroundColor: mostrarVistaPrevia ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
          color: brand.colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          marginBottom: '14px',
        }}
      >
        {mostrarVistaPrevia ? 'Ocultar vista previa' : 'Ver vista previa'}
      </button>

      {mostrarVistaPrevia && (
        <div style={{
          padding: '20px',
          borderRadius: '8px',
          backgroundColor: 'rgba(5, 6, 15, 0.5)',
          border: `1px solid ${brand.colors.electricBlue}`,
          marginBottom: '20px',
        }}>
          <h4 style={{
            color: brand.colors.text,
            marginBottom: '15px',
            fontSize: '16px',
          }}>
            Vista previa de la pregunta
          </h4>

          {imagenUrl && (
            <img
              src={imagenUrl}
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

          <p style={{
            color: brand.colors.text,
            fontSize: '16px',
            marginBottom: '15px',
            lineHeight: '1.6',
          }}>
            <TextoMatematico texto={enunciado || 'Enunciado de la pregunta...'} />
          </p>

          {figuraCodigo.trim() && (
            <RenderFiguraCodigo tipo={figuraTipo} codigo={figuraCodigo} />
          )}

          {LETRAS.map((letra) => (
            <div
              key={letra}
              style={{
                padding: '10px',
                marginBottom: '8px',
                borderRadius: '6px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                border: `1px solid ${brand.colors.electricBlue}`,
              }}
            >
              <span style={{
                color: brand.colors.violetNeon,
                fontWeight: 'bold',
                marginRight: '10px',
              }}>
                {letra})
              </span>
              <TextoMatematico texto={alternativas[letra] || `Alternativa ${letra}...`} />
            </div>
          ))}

          <p style={{
            color: brand.colors.success,
            fontSize: '14px',
            marginTop: '15px',
            fontWeight: 'bold',
          }}>
            Correcta: {correcta}
          </p>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px' }}>
        <button
          type="button"
          onClick={handleGuardar}
          disabled={guardando || subiendo}
          style={{
            padding: '10px 20px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: brand.colors.electricBlue,
            color: brand.colors.text,
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: guardando || subiendo ? 'not-allowed' : 'pointer',
            opacity: guardando || subiendo ? 0.6 : 1,
          }}
        >
          {guardando ? 'Guardando...' : textoBoton}
        </button>

        {onCancelar && (
          <button
            type="button"
            onClick={onCancelar}
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
        )}
      </div>
    </div>
  )
}
