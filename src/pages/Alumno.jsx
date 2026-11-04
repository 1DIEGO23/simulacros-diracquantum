// Página del Alumno
// Lista de simulacros, examen con temporizador, resultado y revisión.
// Usa las vistas y funciones de supabase/etapa2_alumno.sql:
//   preguntas_alumno, intentos_alumno, respuestas_alumno
//   iniciar_intento, registrar_respuesta, finalizar_intento, revision_intento

import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import TextoMatematico from '../components/TextoMatematico'

// ---------------------------------------------------------------------
// Colores (toma los de brand y usa respaldo si alguno no existe)
// ---------------------------------------------------------------------
const C = {
  fondo: brand?.colors?.background ?? '#05060f',
  texto: brand?.colors?.text ?? '#e5e7eb',
  suave: brand?.colors?.textMuted ?? '#9ca3af',
  violeta: brand?.colors?.violetNeon ?? '#8b5cf6',
  azul: brand?.colors?.electricBlue ?? '#3b82f6',
  ok: '#22c55e',
  mal: '#ef4444',
}

const LETRAS = ['A', 'B', 'C', 'D', 'E']

// ---------------------------------------------------------------------
// Estilos reutilizables
// ---------------------------------------------------------------------
const pagina = { minHeight: '100vh', backgroundColor: C.fondo, padding: '20px 12px', color: C.texto }
const caja = { maxWidth: 900, margin: '0 auto' }
const tarjeta = {
  borderRadius: 12,
  backgroundColor: 'rgba(139, 92, 246, 0.08)',
  border: `1px solid ${C.violeta}66`,
  padding: 24,
}
const boton = (bg, desactivado = false) => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: 'none',
  backgroundColor: bg,
  color: '#fff',
  fontSize: 15,
  fontWeight: 'bold',
  cursor: desactivado ? 'not-allowed' : 'pointer',
  opacity: desactivado ? 0.45 : 1,
})
const botonLinea = (desactivado = false) => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: `1px solid ${C.azul}`,
  backgroundColor: 'transparent',
  color: C.texto,
  fontSize: 15,
  fontWeight: 'bold',
  cursor: desactivado ? 'not-allowed' : 'pointer',
  opacity: desactivado ? 0.45 : 1,
})

// ---------------------------------------------------------------------
// Utilidades
// ---------------------------------------------------------------------

// Acepta varios formatos posibles del campo "alternativas" (jsonb)
function normalizarAlternativas(alt) {
  let data = alt
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      return []
    }
  }
  const letraValida = (valor, i) => {
    const l = String(valor ?? '').trim().toUpperCase()
    return LETRAS.includes(l) ? l : LETRAS[i] ?? String(i + 1)
  }
  if (Array.isArray(data)) {
    return data.map((item, i) => {
      if (typeof item === 'string') return { letra: LETRAS[i] ?? String(i + 1), texto: item, imagen: null }
      const letra = letraValida(item.letra ?? item.id ?? item.opcion ?? item.clave ?? item.key, i)
      const texto = item.texto ?? item.text ?? item.contenido ?? item.valor ?? item.value ?? item.descripcion ?? ''
      return { letra, texto: String(texto), imagen: item.imagen_url ?? item.imagen ?? null }
    })
  }
  if (data && typeof data === 'object') {
    return Object.entries(data).map(([k, v], i) => ({
      letra: letraValida(k, i),
      texto: typeof v === 'string' ? v : String(v?.texto ?? v?.text ?? ''),
      imagen: typeof v === 'object' && v ? v.imagen_url ?? v.imagen ?? null : null,
    }))
  }
  return []
}

function formatearTiempo(seg) {
  if (seg === null || seg === undefined) return '--:--'
  const s = Math.max(seg, 0)
  const h = Math.floor(s / 3600)
  const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0')
  const r = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${m}:${r}` : `${m}:${r}`
}

// ---------------------------------------------------------------------
// Piezas pequeñas
// ---------------------------------------------------------------------
function Aviso({ children, tipo = 'error' }) {
  const color = tipo === 'error' ? C.mal : C.azul
  return (
    <div
      role="alert"
      style={{
        border: `1px solid ${color}`,
        backgroundColor: `${color}22`,
        color: C.texto,
        borderRadius: 8,
        padding: '10px 14px',
        marginBottom: 16,
        fontSize: 14,
      }}
    >
      {children}
    </div>
  )
}

// estado: 'normal' | 'elegida' | 'correcta' | 'incorrecta'
function Opcion({ letra, texto, imagen, estado = 'normal', etiqueta, onClick }) {
  const colores = {
    normal: { borde: 'rgba(255,255,255,0.15)', fondo: 'rgba(255,255,255,0.03)', letra: 'rgba(255,255,255,0.12)' },
    elegida: { borde: C.violeta, fondo: 'rgba(139,92,246,0.25)', letra: C.violeta },
    correcta: { borde: C.ok, fondo: 'rgba(34,197,94,0.15)', letra: C.ok },
    incorrecta: { borde: C.mal, fondo: 'rgba(239,68,68,0.15)', letra: C.mal },
  }[estado]
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      aria-pressed={estado === 'elegida'}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'flex-start',
        width: '100%',
        textAlign: 'left',
        padding: '12px 14px',
        marginBottom: 10,
        borderRadius: 10,
        border: `1px solid ${colores.borde}`,
        backgroundColor: colores.fondo,
        color: C.texto,
        fontSize: 16,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <span
        style={{
          flexShrink: 0,
          width: 30,
          height: 30,
          borderRadius: '50%',
          backgroundColor: colores.letra,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: 14,
        }}
      >
        {letra}
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <TextoMatematico texto={texto} />
        {imagen && (
          <img src={imagen} alt={`Alternativa ${letra}`} style={{ maxWidth: '100%', marginTop: 8, borderRadius: 8 }} />
        )}
        {etiqueta && (
          <span style={{ display: 'block', marginTop: 6, fontSize: 12, color: C.suave }}>{etiqueta}</span>
        )}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------
export default function Alumno() {
  const { session } = useAuth()
  const navigate = useNavigate()

  const [vista, setVista] = useState('lista') // lista | examen | resultado | revision
  const [simulacros, setSimulacros] = useState([])
  const [intentos, setIntentos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [aviso, setAviso] = useState('')

  const [examen, setExamen] = useState(null) // { simulacro, intentoId, inicio, preguntas }
  const [respuestas, setRespuestas] = useState({}) // preguntaId -> 'A'..'E' | null
  const [actual, setActual] = useState(0)
  const [restante, setRestante] = useState(null)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [fallo, setFallo] = useState(false)
  const [resultado, setResultado] = useState(null)
  const [revision, setRevision] = useState(null)

  const cola = useRef({}) // cola de guardado por pregunta (mantiene el orden)
  const finalizando = useRef(false)

  // ----- Lista -----
  const cargarLista = useCallback(async () => {
    setCargando(true)
    setError('')
    const [s, i] = await Promise.all([
      supabase.from('simulacros').select('id, titulo, duracion_minutos').eq('activo', true),
      supabase
        .from('intentos_alumno')
        .select('id, simulacro_id, inicio, fin, nota, correctas, incorrectas, en_blanco'),
    ])
    if (s.error) setError(`No se pudieron cargar los simulacros: ${s.error.message}`)
    else setSimulacros(s.data ?? [])
    if (i.error) setError(`No se pudieron cargar tus intentos: ${i.error.message}`)
    else setIntentos(i.data ?? [])
    setCargando(false)
  }, [])

  useEffect(() => {
    if (session) cargarLista()
  }, [session, cargarLista])

  const cerrarSesion = async () => {
    const { error: e } = await supabase.auth.signOut()
    if (e) console.error('Error al cerrar sesión:', e)
    navigate('/login')
  }

  const volverALista = () => {
    setExamen(null)
    setRespuestas({})
    setResultado(null)
    setRevision(null)
    setActual(0)
    setRestante(null)
    setConfirmando(false)
    setEnviando(false)
    setFallo(false)
    setAviso('')
    cola.current = {}
    finalizando.current = false
    setVista('lista')
    cargarLista()
  }

  // ----- Empezar o continuar un simulacro -----
  const empezar = async (sim) => {
    setError('')
    setAviso('')
    setCargando(true)
    try {
      const { data: intentoId, error: e1 } = await supabase.rpc('iniciar_intento', {
        p_simulacro_id: sim.id,
      })
      if (e1) throw e1

      const { data: fila, error: e2 } = await supabase
        .from('intentos_alumno')
        .select('id, inicio')
        .eq('id', intentoId)
        .single()
      if (e2) throw e2

      const { data: pregs, error: e3 } = await supabase
        .from('preguntas_alumno')
        .select('id, enunciado, alternativas, imagen_url, orden')
        .eq('simulacro_id', sim.id)
        .order('orden', { ascending: true })
        .order('id', { ascending: true })
      if (e3) throw e3
      if (!pregs || pregs.length === 0) {
        throw new Error('Este simulacro todavía no tiene preguntas. Avisa a tu docente.')
      }

      const { data: resp } = await supabase
        .from('respuestas_alumno')
        .select('pregunta_id, alternativa_elegida')
        .eq('intento_id', intentoId)
      const mapa = {}
      ;(resp ?? []).forEach((r) => {
        const l = (r.alternativa_elegida ?? '').trim()
        mapa[r.pregunta_id] = l || null
      })

      cola.current = {}
      finalizando.current = false
      setFallo(false)
      setExamen({
        simulacro: sim,
        intentoId,
        inicio: fila.inicio,
        preguntas: pregs.map((p) => ({ ...p, opciones: normalizarAlternativas(p.alternativas) })),
      })
      setRespuestas(mapa)
      setActual(0)
      setResultado(null)
      setVista('examen')
    } catch (e) {
      setError(e.message ?? 'No se pudo iniciar el simulacro.')
    } finally {
      setCargando(false)
    }
  }

  // ----- Temporizador (se calcula con la hora de inicio del intento) -----
  useEffect(() => {
    if (vista !== 'examen' || !examen) return undefined
    const total = examen.simulacro.duracion_minutos * 60
    const inicioMs = new Date(examen.inicio).getTime()
    const tick = () => setRestante(Math.floor(total - (Date.now() - inicioMs) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [vista, examen])

  // ----- Guardar respuesta -----
  const elegir = (pregunta, letra) => {
    if (!examen || finalizando.current) return
    setAviso('')
    const previa = respuestas[pregunta.id] ?? null
    const nueva = previa === letra ? null : letra // tocar la misma alternativa la deja en blanco
    setRespuestas((r) => ({ ...r, [pregunta.id]: nueva }))

    const intentoId = examen.intentoId
    const anterior = cola.current[pregunta.id] ?? Promise.resolve()
    cola.current[pregunta.id] = anterior.then(async () => {
      const { error: e } = await supabase.rpc('registrar_respuesta', {
        p_intento_id: intentoId,
        p_pregunta_id: pregunta.id,
        p_alternativa: nueva,
      })
      if (e) {
        setRespuestas((r) => ({ ...r, [pregunta.id]: previa }))
        setAviso(`No se pudo guardar tu respuesta: ${e.message}`)
      }
    })
  }

  // ----- Finalizar -----
  const finalizar = async (porTiempo = false) => {
    if (finalizando.current || !examen) return
    finalizando.current = true
    setEnviando(true)
    setConfirmando(false)
    setAviso('')
    await Promise.allSettled(Object.values(cola.current))
    const { data, error: e } = await supabase.rpc('finalizar_intento', {
      p_intento_id: examen.intentoId,
    })
    if (e) {
      finalizando.current = false
      setEnviando(false)
      if (/ya finalizado|no valido/i.test(e.message)) {
        volverALista()
        return
      }
      setFallo(true)
      setAviso(`No se pudo enviar el examen: ${e.message}`)
      return
    }
    const fila = Array.isArray(data) ? data[0] : data
    setResultado({ ...fila, porTiempo })
    cola.current = {}
    setEnviando(false)
    setVista('resultado')
  }

  // Al llegar a 0 se envía solo
  useEffect(() => {
    if (vista === 'examen' && restante !== null && restante <= 0 && !enviando && !fallo) {
      finalizar(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restante, vista, enviando, fallo])

  // ----- Revisión -----
  const verRevision = async (intentoId, titulo) => {
    setError('')
    setCargando(true)
    const { data, error: e } = await supabase.rpc('revision_intento', { p_intento_id: intentoId })
    setCargando(false)
    if (e) {
      setError(`No se pudo cargar la revisión: ${e.message}`)
      return
    }
    setRevision({
      titulo,
      filas: (data ?? []).map((f) => ({ ...f, opciones: normalizarAlternativas(f.alternativas) })),
    })
    setVista('revision')
  }

  if (!session) return null // ProtectedRoute se encarga de redirigir

  // =====================================================================
  // VISTA: LISTA
  // =====================================================================
  if (vista === 'lista') {
    return (
      <div style={pagina}>
        <div style={caja}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
              <img
                src={brand.logoUrl}
                alt="Logo DiracQuantum"
                style={{
                  width: 50,
                  height: 50,
                  objectFit: 'contain',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0 }}>
                <h1 style={{ margin: 0, fontSize: 24, lineHeight: 1.2 }}>Mis simulacros</h1>
                <p style={{ margin: '4px 0 0', color: C.suave, fontSize: 13, wordBreak: 'break-word' }}>{session.user.email}</p>
              </div>
            </div>
            <button type="button" style={boton(C.azul)} onClick={cerrarSesion}>
              Cerrar sesión
            </button>
          </div>

          {error && <Aviso>{error}</Aviso>}

          {cargando ? (
            <p style={{ color: C.suave }}>Cargando…</p>
          ) : simulacros.length === 0 ? (
            <div style={tarjeta}>
              <p style={{ margin: 0 }}>Todavía no hay simulacros disponibles. Vuelve más tarde.</p>
            </div>
          ) : (
            simulacros.map((s) => {
              const intento = intentos.find((x) => x.simulacro_id === s.id)
              return (
                <div
                  key={s.id}
                  style={{
                    ...tarjeta,
                    marginBottom: 14,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div>
                    <h2 style={{ margin: 0, fontSize: 18 }}>{s.titulo}</h2>
                    <p style={{ margin: '6px 0 0', color: C.suave, fontSize: 14 }}>
                      Duración: {s.duracion_minutos} minutos
                    </p>
                    {intento?.fin && (
                      <p style={{ margin: '6px 0 0', fontSize: 14 }}>
                        Tu nota: <strong>{Number(intento.nota).toFixed(2)}</strong> / 20
                      </p>
                    )}
                    {intento && !intento.fin && (
                      <p style={{ margin: '6px 0 0', color: C.suave, fontSize: 14 }}>
                        Tienes un intento en curso.
                      </p>
                    )}
                  </div>
                  {!intento && (
                    <button type="button" style={boton(C.violeta)} onClick={() => empezar(s)}>
                      Iniciar
                    </button>
                  )}
                  {intento && !intento.fin && (
                    <button type="button" style={boton(C.violeta)} onClick={() => empezar(s)}>
                      Continuar
                    </button>
                  )}
                  {intento?.fin && (
                    <button type="button" style={botonLinea()} onClick={() => verRevision(intento.id, s.titulo)}>
                      Ver revisión
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // =====================================================================
  // VISTA: EXAMEN
  // =====================================================================
  if (vista === 'examen' && examen) {
    const p = examen.preguntas[actual]
    const total = examen.preguntas.length
    const respondidas = examen.preguntas.filter((q) => respuestas[q.id]).length
    const faltan = total - respondidas
    const urgente = restante !== null && restante <= 300

    return (
      <div style={pagina}>
        <div style={caja}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 20 }}>{examen.simulacro.titulo}</h1>
            <div
              aria-live="off"
              style={{
                fontSize: 26,
                fontWeight: 'bold',
                fontVariantNumeric: 'tabular-nums',
                color: urgente ? C.mal : C.texto,
                border: `1px solid ${urgente ? C.mal : C.violeta}`,
                borderRadius: 10,
                padding: '6px 14px',
              }}
            >
              {formatearTiempo(restante)}
            </div>
          </div>

          {aviso && <Aviso>{aviso}</Aviso>}
          {fallo && (
            <div style={{ marginBottom: 16 }}>
              <button type="button" style={boton(C.violeta)} onClick={() => { setFallo(false); finalizar(restante !== null && restante <= 0) }}>
                Reintentar envío
              </button>
            </div>
          )}

          <div style={{ ...tarjeta, marginBottom: 16 }}>
            <p style={{ margin: '0 0 12px', color: C.suave, fontSize: 14 }}>
              Pregunta {actual + 1} de {total}. Respondidas: {respondidas}.
            </p>
            <div style={{ fontSize: 18, lineHeight: 1.6, marginBottom: 12 }}>
              <TextoMatematico texto={p.enunciado} />
            </div>
            {p.imagen_url && (
              <img
                src={p.imagen_url}
                alt="Imagen de la pregunta"
                style={{ maxWidth: '100%', borderRadius: 8, margin: '4px 0 16px' }}
              />
            )}
            {p.opciones.length === 0 && (
              <Aviso>Esta pregunta no tiene alternativas cargadas. Avisa a tu docente.</Aviso>
            )}
            {p.opciones.map((op) => (
              <Opcion
                key={op.letra}
                letra={op.letra}
                texto={op.texto}
                imagen={op.imagen}
                estado={respuestas[p.id] === op.letra ? 'elegida' : 'normal'}
                onClick={() => elegir(p, op.letra)}
              />
            ))}
            <p style={{ margin: '4px 0 0', color: C.suave, fontSize: 13 }}>
              Toca la alternativa elegida otra vez para dejarla en blanco.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
            <button
              type="button"
              style={botonLinea(actual === 0)}
              disabled={actual === 0}
              onClick={() => setActual((a) => a - 1)}
            >
              Anterior
            </button>
            <button
              type="button"
              style={botonLinea(actual === total - 1)}
              disabled={actual === total - 1}
              onClick={() => setActual((a) => a + 1)}
            >
              Siguiente
            </button>
            <button
              type="button"
              style={{ ...boton(C.violeta, enviando), marginLeft: 'auto' }}
              disabled={enviando}
              onClick={() => setConfirmando(true)}
            >
              {enviando ? 'Enviando…' : 'Finalizar examen'}
            </button>
          </div>

          <div style={tarjeta}>
            <p style={{ margin: '0 0 12px', color: C.suave, fontSize: 14 }}>
              Ir a una pregunta. Las respondidas se ven en azul.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))', gap: 8 }}>
              {examen.preguntas.map((q, i) => {
                const hecha = Boolean(respuestas[q.id])
                const esActual = i === actual
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setActual(i)}
                    aria-label={`Pregunta ${i + 1}${hecha ? ', respondida' : ''}`}
                    aria-current={esActual ? 'true' : undefined}
                    style={{
                      padding: '8px 0',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      color: '#fff',
                      backgroundColor: hecha ? C.azul : 'transparent',
                      border: `2px solid ${esActual ? C.violeta : hecha ? C.azul : 'rgba(255,255,255,0.2)'}`,
                    }}
                  >
                    {i + 1}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {confirmando && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
              zIndex: 50,
            }}
          >
            <div style={{ ...tarjeta, backgroundColor: '#0b0d1c', maxWidth: 440, width: '100%' }}>
              <h2 style={{ marginTop: 0, fontSize: 20 }}>¿Enviar el examen?</h2>
              <p style={{ color: C.suave, lineHeight: 1.5 }}>
                {faltan > 0
                  ? `Te faltan ${faltan} preguntas por responder. Si envías ahora, quedarán en blanco y ya no podrás volver a rendir este simulacro.`
                  : 'Respondiste todas las preguntas. Después de enviar ya no podrás cambiar tus respuestas.'}
              </p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <button type="button" style={botonLinea()} onClick={() => setConfirmando(false)}>
                  Seguir revisando
                </button>
                <button type="button" style={boton(C.violeta)} onClick={() => finalizar(false)}>
                  Enviar examen
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // =====================================================================
  // VISTA: RESULTADO
  // =====================================================================
  if (vista === 'resultado' && resultado) {
    return (
      <div style={pagina}>
        <div style={{ ...caja, maxWidth: 560 }}>
          <div style={{ ...tarjeta, textAlign: 'center' }}>
            <h1 style={{ marginTop: 0, fontSize: 24 }}>
              {resultado.porTiempo ? 'Se acabó el tiempo' : 'Examen enviado'}
            </h1>
            <p style={{ color: C.suave, margin: '0 0 8px' }}>{examen?.simulacro?.titulo}</p>
            <div style={{ fontSize: 56, fontWeight: 'bold', color: C.violeta, lineHeight: 1.1 }}>
              {Number(resultado.nota).toFixed(2)}
              <span style={{ fontSize: 22, color: C.suave }}> / 20</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 24, margin: '20px 0', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: C.ok }}>{resultado.correctas}</div>
                <div style={{ color: C.suave, fontSize: 14 }}>Correctas</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold', color: C.mal }}>{resultado.incorrectas}</div>
                <div style={{ color: C.suave, fontSize: 14 }}>Incorrectas</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 'bold' }}>{resultado.en_blanco}</div>
                <div style={{ color: C.suave, fontSize: 14 }}>En blanco</div>
              </div>
            </div>
            {error && <Aviso>{error}</Aviso>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                type="button"
                style={boton(C.violeta)}
                onClick={() => verRevision(examen.intentoId, examen.simulacro.titulo)}
              >
                Ver revisión
              </button>
              <button type="button" style={botonLinea()} onClick={volverALista}>
                Volver a mis simulacros
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // =====================================================================
  // VISTA: REVISIÓN
  // =====================================================================
  if (vista === 'revision' && revision) {
    return (
      <div style={pagina}>
        <div style={caja}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <h1 style={{ margin: 0, fontSize: 22 }}>Revisión: {revision.titulo}</h1>
            <button type="button" style={botonLinea()} onClick={volverALista}>
              Volver a mis simulacros
            </button>
          </div>

          {revision.filas.map((f, idx) => {
            const elegida = (f.alternativa_elegida ?? '').trim().toUpperCase() || null
            const clave = (f.clave ?? '').trim().toUpperCase()
            const estado = !elegida ? 'En blanco' : f.correcta ? 'Correcta' : 'Incorrecta'
            const colorEstado = !elegida ? C.suave : f.correcta ? C.ok : C.mal
            return (
              <div key={f.pregunta_id} style={{ ...tarjeta, marginBottom: 16 }}>
                <p style={{ margin: '0 0 10px', fontSize: 14, color: colorEstado, fontWeight: 'bold' }}>
                  Pregunta {idx + 1}: {estado}
                </p>
                <div style={{ fontSize: 17, lineHeight: 1.6, marginBottom: 12 }}>
                  <TextoMatematico texto={f.enunciado} />
                </div>
                {f.imagen_url && (
                  <img
                    src={f.imagen_url}
                    alt="Imagen de la pregunta"
                    style={{ maxWidth: '100%', borderRadius: 8, margin: '4px 0 12px' }}
                  />
                )}
                {f.opciones.map((op) => {
                  const esCorrecta = op.letra === clave
                  const esElegida = op.letra === elegida
                  let estadoOp = 'normal'
                  let etiqueta
                  if (esCorrecta) {
                    estadoOp = 'correcta'
                    etiqueta = esElegida ? 'Tu respuesta, correcta' : 'Respuesta correcta'
                  } else if (esElegida) {
                    estadoOp = 'incorrecta'
                    etiqueta = 'Tu respuesta'
                  }
                  return (
                    <Opcion
                      key={op.letra}
                      letra={op.letra}
                      texto={op.texto}
                      imagen={op.imagen}
                      estado={estadoOp}
                      etiqueta={etiqueta}
                    />
                  )
                })}
              </div>
            )
          })}

          <button type="button" style={boton(C.violeta)} onClick={volverALista}>
            Volver a mis simulacros
          </button>
        </div>
      </div>
    )
  }

  return null
}

