// Página del Docente
// Panel para crear simulacros y gestionar preguntas

import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import CrearSimulacro from '../components/CrearSimulacro'
import ListaSimulacros from '../components/ListaSimulacros'
import AgregarPregunta from '../components/AgregarPregunta'
import ListaPreguntas from '../components/ListaPreguntas'
import ImportarPreguntaCSV from '../components/ImportarPreguntaCSV'
import ImportarPreguntasTexto from '../components/ImportarPreguntasTexto'

export default function Docente() {
  const { session, userRole } = useAuth()
  const navigate = useNavigate()
  const [simulacroSeleccionado, setSimulacroSeleccionado] = useState(null)
  const [vista, setVista] = useState('lista') // 'lista', 'crear', 'preguntas', 'alumnos'
  const [refrescar, setRefrescar] = useState(0)
  const [mostrarImportarTexto, setMostrarImportarTexto] = useState(false)
  const [alumnos, setAlumnos] = useState([])
  const [cargandoAlumnos, setCargandoAlumnos] = useState(false)

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      console.error('Error al cerrar sesión:', error)
    }
    navigate('/login')
  }

  const handleSimulacroCreado = () => {
    setVista('lista')
  }

  const handleSimulacroSeleccionado = (simulacro) => {
    setSimulacroSeleccionado(simulacro)
    setVista('preguntas')
  }

  const handleSimulacroEliminado = () => {
    setSimulacroSeleccionado(null)
  }

  const handleVolver = () => {
    setSimulacroSeleccionado(null)
    setVista('lista')
  }

  const handleVerAlumnos = async (simulacro) => {
    setSimulacroSeleccionado(simulacro)
    setCargandoAlumnos(true)
    setVista('alumnos')

    // Cargar alumnos desde la tabla alumnos
    const { data: alumnosData, error: errorAlumnos } = await supabase
      .from('alumnos')
      .select('id, email, rol')
      .eq('rol', 'alumno')

    if (errorAlumnos) {
      console.error('Error al cargar alumnos:', errorAlumnos)
      setAlumnos([])
    } else {
      // Para cada alumno, buscar si tiene intento en este simulacro
      const alumnosConIntentos = await Promise.all(
        (alumnosData || []).map(async (alumno) => {
          const { data: intentosData } = await supabase
            .from('intentos')
            .select('id, inicio, fin, nota, correctas, incorrectas')
            .eq('simulacro_id', simulacro.id)
            .eq('alumno_id', alumno.id)
            .order('inicio', { ascending: false })
            .limit(1)

          return {
            ...alumno,
            intento: intentosData?.[0] || null
          }
        })
      )

      setAlumnos(alumnosConIntentos)
    }
    setCargandoAlumnos(false)
  }

  const handleReiniciarExamen = async (alumnoId, simulacroId) => {
    if (!confirm('¿Reiniciar el examen de este alumno? Esto eliminará sus respuestas y podrá volver a tomar el examen.')) {
      return
    }

    // Buscar el intento del alumno en este simulacro
    const { data: intento } = await supabase
      .from('intentos')
      .select('id')
      .eq('simulacro_id', simulacroId)
      .eq('alumno_id', alumnoId)
      .single()

    if (!intento) {
      alert('Este alumno no tiene intentos en este simulacro.')
      return
    }

    // Primero eliminar respuestas
    const { error: errorRespuestas } = await supabase
      .from('respuestas')
      .delete()
      .eq('intento_id', intento.id)

    if (errorRespuestas) {
      alert('Error al eliminar respuestas: ' + errorRespuestas.message)
      return
    }

    // Luego eliminar el intento
    const { error: errorIntento } = await supabase
      .from('intentos')
      .delete()
      .eq('id', intento.id)

    if (errorIntento) {
      alert('Error al eliminar intento: ' + errorIntento.message)
      return
    }

    alert('Examen reiniciado correctamente')
    // Recargar lista de alumnos
    handleVerAlumnos(simulacroSeleccionado)
  }

  if (!session) {
    return null // El ProtectedRoute manejará la redirección
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brand.colors.background,
      padding: '20px 12px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        {/* Encabezado */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: 12,
        }}>
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
              <h1 style={{
                color: brand.colors.text,
                marginBottom: '6px',
                fontSize: 24,
                lineHeight: 1.2,
              }}>
                Panel Docente
              </h1>
              <p style={{
                color: brand.colors.textMuted,
                fontSize: 13,
                wordBreak: 'break-word',
              }}>
                {session.user.email} · {userRole === 'docente' ? 'Docente' : userRole}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
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
            Cerrar sesión
          </button>
        </div>

        {/* Botones de navegación */}
        <div style={{
          display: 'flex',
          gap: '10px',
          marginBottom: '30px',
        }}>
          <button
            onClick={() => setVista('lista')}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: vista === 'lista' ? `2px solid ${brand.colors.electricBlue}` : `1px solid ${brand.colors.textMuted}`,
              backgroundColor: vista === 'lista' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: brand.colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Lista de simulacros
          </button>

          <button
            onClick={() => setVista('crear')}
            style={{
              padding: '10px 20px',
              borderRadius: '6px',
              border: vista === 'crear' ? `2px solid ${brand.colors.violetNeon}` : `1px solid ${brand.colors.textMuted}`,
              backgroundColor: vista === 'crear' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              color: brand.colors.text,
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'opacity 0.2s',
            }}
            onMouseOver={(e) => e.target.style.opacity = '0.8'}
            onMouseOut={(e) => e.target.style.opacity = '1'}
          >
            Crear simulacro
          </button>
        </div>

        {/* Contenido según vista */}
        {vista === 'lista' && (
          <ListaSimulacros
            onSimulacroSeleccionado={handleSimulacroSeleccionado}
            onSimulacroEliminado={handleSimulacroEliminado}
            onVerAlumnos={handleVerAlumnos}
          />
        )}

        {vista === 'crear' && (
          <CrearSimulacro onSimulacroCreado={handleSimulacroCreado} />
        )}

        {vista === 'preguntas' && simulacroSeleccionado && (
          <div>
            <button
              onClick={handleVolver}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.textMuted}`,
                backgroundColor: 'transparent',
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              ← Volver a la lista
            </button>

            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${brand.colors.electricBlue}`,
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: brand.colors.text,
                marginBottom: '10px',
                fontSize: '20px',
              }}>
                {simulacroSeleccionado.titulo}
              </h2>
              <p style={{
                color: brand.colors.textMuted,
                fontSize: '14px',
              }}>
                Duración: {simulacroSeleccionado.duracion_minutos} minutos
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
              <button
                onClick={() => setMostrarImportarTexto(!mostrarImportarTexto)}
                style={{
                  padding: '10px 20px',
                  borderRadius: '6px',
                  border: `1px solid ${brand.colors.violetNeon}`,
                  backgroundColor: mostrarImportarTexto ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
                  color: brand.colors.text,
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                }}
              >
                {mostrarImportarTexto ? 'Ocultar importar (texto)' : 'Importar preguntas (texto)'}
              </button>
            </div>

            {mostrarImportarTexto && (
              <ImportarPreguntasTexto
                simulacroId={simulacroSeleccionado.id}
                onImportado={(cantidad) => {
                  setRefrescar((n) => n + 1)
                  setMostrarImportarTexto(false)
                }}
              />
            )}

            <AgregarPregunta
              simulacroId={simulacroSeleccionado.id}
              onPreguntaAgregada={() => setRefrescar((n) => n + 1)}
            />

            <ImportarPreguntaCSV
              simulacroId={simulacroSeleccionado.id}
              onImportado={() => setRefrescar((n) => n + 1)}
            />

            <ListaPreguntas
              simulacroId={simulacroSeleccionado.id}
              refrescar={refrescar}
            />
          </div>
        )}

        {vista === 'alumnos' && simulacroSeleccionado && (
          <div>
            <button
              onClick={handleVolver}
              style={{
                padding: '10px 20px',
                borderRadius: '6px',
                border: `1px solid ${brand.colors.textMuted}`,
                backgroundColor: 'transparent',
                color: brand.colors.text,
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginBottom: '20px',
                transition: 'opacity 0.2s',
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              ← Volver a la lista
            </button>

            <div style={{
              padding: '20px',
              borderRadius: '8px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              border: `1px solid ${brand.colors.electricBlue}`,
              marginBottom: '20px',
            }}>
              <h2 style={{
                color: brand.colors.text,
                marginBottom: '10px',
                fontSize: '20px',
              }}>
                Alumnos - Simulacro: {simulacroSeleccionado.titulo}
              </h2>
              <p style={{
                color: brand.colors.textMuted,
                fontSize: '14px',
              }}>
                Duración: {simulacroSeleccionado.duracion_minutos} minutos
              </p>
            </div>

            {cargandoAlumnos ? (
              <p style={{ color: brand.colors.textMuted }}>Cargando alumnos...</p>
            ) : alumnos.length === 0 ? (
              <p style={{ color: brand.colors.textMuted }}>No hay alumnos registrados.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {alumnos.map((alumno) => (
                  <div
                    key={alumno.id}
                    style={{
                      padding: '15px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(139, 92, 246, 0.1)',
                      border: `1px solid ${brand.colors.violetNeon}`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '10px',
                    }}>
                      <div>
                        <p style={{ color: brand.colors.text, fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                          {alumno.email}
                        </p>
                        {alumno.intento ? (
                          <>
                            <p style={{ color: brand.colors.textMuted, fontSize: '12px' }}>
                              Inicio: {new Date(alumno.intento.inicio).toLocaleString()}
                            </p>
                            {alumno.intento.fin && (
                              <p style={{ color: brand.colors.textMuted, fontSize: '12px' }}>
                                Fin: {new Date(alumno.intento.fin).toLocaleString()}
                              </p>
                            )}
                          </>
                        ) : (
                          <p style={{ color: brand.colors.textMuted, fontSize: '12px' }}>
                            No ha iniciado el examen
                          </p>
                        )}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        {alumno.intento ? (
                          <>
                            <p style={{ color: brand.colors.success, fontSize: '18px', fontWeight: 'bold' }}>
                              Nota: {alumno.intento.nota || 0}/20
                            </p>
                            <p style={{ color: brand.colors.textMuted, fontSize: '12px' }}>
                              Correctas: {alumno.intento.correctas} | Incorrectas: {alumno.intento.incorrectas}
                            </p>
                          </>
                        ) : (
                          <p style={{ color: brand.colors.textMuted, fontSize: '14px' }}>
                            Pendiente
                          </p>
                        )}
                      </div>
                    </div>
                    {alumno.intento && (
                      <button
                        onClick={() => handleReiniciarExamen(alumno.id, simulacroSeleccionado.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '6px',
                          border: 'none',
                          backgroundColor: brand.colors.warning,
                          color: brand.colors.text,
                          fontSize: '13px',
                          fontWeight: 'bold',
                          cursor: 'pointer',
                        }}
                      >
                        Reiniciar examen
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}