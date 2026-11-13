// Página de Login
// Portada de dos columnas con temario y formulario de login

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import { temario } from '../config/temario'

// Componente de acordeón para el temario
function Acordeon({ titulo, items, abierto, onToggle }) {
  return (
    <div style={{
      marginBottom: '12px',
      border: `1px solid ${brand.colors.violetNeon}`,
      borderRadius: '8px',
      overflow: 'hidden',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
    }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          padding: '12px 16px',
          backgroundColor: abierto ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
          border: 'none',
          color: brand.colors.text,
          fontSize: '14px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          transition: 'background-color 0.2s',
        }}
      >
        {titulo}
        <span style={{ fontSize: '18px' }}>{abierto ? '−' : '+'}</span>
      </button>
      {abierto && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${brand.colors.violetNeon}33`,
        }}>
          <ul style={{
            margin: 0,
            paddingLeft: '20px',
            color: brand.colors.textMuted,
            fontSize: '13px',
            lineHeight: '1.6',
          }}>
            {items.map((item, idx) => (
              <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// Componente de tarjeta de temario
function TarjetaTemario({ categoria }) {
  const [abiertos, setAbiertos] = useState({})

  const toggle = (idx) => {
    setAbiertos(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      border: `1px solid ${brand.colors.violetNeon}`,
      boxShadow: `0 0 15px rgba(139, 92, 246, 0.2)`,
      maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: `${brand.colors.violetNeon}44 transparent`,
    }}>
      <h3 style={{
        color: brand.colors.text,
        marginBottom: '16px',
        fontSize: '18px',
        fontWeight: 'bold',
        textAlign: 'center',
      }}>
        {categoria.titulo}
      </h3>
      {categoria.secciones.map((seccion, idx) => (
        <Acordeon
          key={idx}
          titulo={seccion.titulo}
          items={seccion.items}
          abierto={abiertos[idx]}
          onToggle={() => toggle(idx)}
        />
      ))}
    </div>
  )
}

// Componente de panel de temario completo
function PanelTemario({ onCerrar }) {
  const [abiertosLectora, setAbiertosLectora] = useState({})
  const [abiertosMatematica, setAbiertosMatematica] = useState({})

  const toggleLectora = (idx) => {
    setAbiertosLectora(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  const toggleMatematica = (idx) => {
    setAbiertosMatematica(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <div style={{
      width: '100%',
      padding: '24px',
      borderRadius: '12px',
      backgroundColor: 'rgba(139, 92, 246, 0.08)',
      border: `1px solid ${brand.colors.violetNeon}`,
      boxShadow: `0 0 20px rgba(139, 92, 246, 0.3)`,
      maxHeight: 'calc(100vh - 80px)',
      overflowY: 'auto',
      scrollbarWidth: 'thin',
      scrollbarColor: `${brand.colors.violetNeon}44 transparent`,
      animation: 'fadeIn 0.3s ease-in-out',
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px',
      }}>
        <h2 style={{
          color: brand.colors.text,
          fontSize: '20px',
          fontWeight: 'bold',
          margin: 0,
        }}>
          Temario ENP - Beca 18
        </h2>
        <button
          onClick={onCerrar}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            backgroundColor: 'transparent',
            color: brand.colors.textMuted,
            fontSize: '13px',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          Cerrar
        </button>
      </div>

      <p style={{
        color: brand.colors.textMuted,
        fontSize: '14px',
        marginBottom: '24px',
        textAlign: 'center',
      }}>
        60 preguntas: 30 de Competencia Lectora y 30 de Competencia Matemática
      </p>

      <div style={{ marginBottom: '20px' }}>
        <h3 style={{
          color: brand.colors.text,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
        }}>
          {temario.competenciaLectora.titulo}
        </h3>
        {temario.competenciaLectora.secciones.map((seccion, idx) => (
          <Acordeon
            key={idx}
            titulo={seccion.titulo}
            items={seccion.items}
            abierto={abiertosLectora[idx]}
            onToggle={() => toggleLectora(idx)}
          />
        ))}
      </div>

      <div>
        <h3 style={{
          color: brand.colors.text,
          marginBottom: '12px',
          fontSize: '16px',
          fontWeight: 'bold',
        }}>
          {temario.matematica.titulo}
        </h3>
        {temario.matematica.secciones.map((seccion, idx) => (
          <Acordeon
            key={idx}
            titulo={seccion.titulo}
            items={seccion.items}
            abierto={abiertosMatematica[idx]}
            onToggle={() => toggleMatematica(idx)}
          />
        ))}
      </div>
    </div>
  )
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarTemario, setMostrarTemario] = useState(false)
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
        if (error.message.includes('Invalid login credentials')) {
          setError('Correo o contraseña incorrectos')
        } else if (error.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu correo electrónico')
        } else {
          setError('Error al iniciar sesión. Inténtalo de nuevo')
        }
        return
      }
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: brand.colors.background,
      padding: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div className="login-container" style={{
        maxWidth: '1200px',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '40px',
        alignItems: 'start',
      }}>
        {/* Columna IZQUIERDA: Botón de temario */}
        <div className="left-column" style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px',
        }}>
          {!mostrarTemario ? (
            <button
              onClick={() => setMostrarTemario(true)}
              style={{
                padding: '24px 48px',
                borderRadius: '12px',
                border: `2px solid ${brand.colors.violetNeon}`,
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
                color: brand.colors.text,
                fontSize: '20px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.2s',
                boxShadow: `0 0 20px rgba(139, 92, 246, 0.3)`,
              }}
              onMouseOver={(e) => {
                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.2)'
                e.target.style.boxShadow = `0 0 30px rgba(139, 92, 246, 0.5)`
              }}
              onMouseOut={(e) => {
                e.target.style.backgroundColor = 'rgba(139, 92, 246, 0.1)'
                e.target.style.boxShadow = `0 0 20px rgba(139, 92, 246, 0.3)`
              }}
            >
              Temario ENP - Beca 18
            </button>
          ) : (
            <PanelTemario onCerrar={() => setMostrarTemario(false)} />
          )}

          {!mostrarTemario && (
            <p style={{
              color: brand.colors.textMuted,
              textAlign: 'center',
              marginTop: '12px',
              fontSize: '13px',
            }}>
              Examen Nacional de Preselección
            </p>
          )}
        </div>

        {/* Columna DERECHA: Logo, título, botón, formulario */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
        }}>
          <img
            src="/logo.png"
            alt="Logo DiracQuantum"
            style={{
              maxWidth: '250px',
              width: '100%',
              height: 'auto',
              marginBottom: '24px',
            }}
          />

          <h1 style={{
            color: brand.colors.text,
            textAlign: 'center',
            marginBottom: '12px',
            fontSize: '28px',
            lineHeight: 1.3,
            fontWeight: 'bold',
          }}>
            Bienvenidos a la plataforma de simulacros de DiracQuantum!
          </h1>

          <p style={{
            color: brand.colors.textMuted,
            textAlign: 'center',
            marginBottom: '32px',
            fontSize: '16px',
          }}>
            Preparamos tu mente para tu éxito académico
          </p>

          {!mostrarFormulario ? (
            <button
              onClick={() => setMostrarFormulario(true)}
              style={{
                padding: '16px 48px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: brand.colors.violetNeon,
                color: brand.colors.text,
                fontSize: '18px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'opacity 0.2s',
                boxShadow: `0 0 20px rgba(139, 92, 246, 0.4)`,
              }}
              onMouseOver={(e) => e.target.style.opacity = '0.8'}
              onMouseOut={(e) => e.target.style.opacity = '1'}
            >
              Iniciar sesión
            </button>
          ) : (
            <div style={{
              width: '100%',
              maxWidth: '400px',
              padding: '24px',
              borderRadius: '12px',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              border: `1px solid ${brand.colors.violetNeon}`,
              boxShadow: `0 0 20px rgba(139, 92, 246, 0.3)`,
              animation: 'fadeIn 0.3s ease-in-out',
            }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
                  {loading ? 'Iniciando sesión...' : 'Ingresar'}
                </button>

                <button
                  type="button"
                  onClick={() => setMostrarFormulario(false)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: brand.colors.textMuted,
                    fontSize: '13px',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Volver
                </button>
              </form>
            </div>
          )}

          <p style={{
            color: brand.colors.textMuted,
            textAlign: 'center',
            marginTop: '32px',
            fontSize: '12px',
            fontStyle: 'italic',
          }}>
            Tu esfuerzo de hoy es tu ingreso de mañana.
          </p>

          {/* Botón de temario para móvil (solo visible en pantallas pequeñas) */}
          <div style={{
            display: 'none',
            marginTop: '24px',
          }} className="mobile-temario-button">
            {!mostrarTemario ? (
              <button
                onClick={() => setMostrarTemario(true)}
                style={{
                  padding: '16px 32px',
                  borderRadius: '8px',
                  border: `2px solid ${brand.colors.violetNeon}`,
                  backgroundColor: 'rgba(139, 92, 246, 0.1)',
                  color: brand.colors.text,
                  fontSize: '16px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: `0 0 15px rgba(139, 92, 246, 0.3)`,
                }}
              >
                Temario ENP - Beca 18
              </button>
            ) : (
              <PanelTemario onCerrar={() => setMostrarTemario(false)} />
            )}
            {!mostrarTemario && (
              <p style={{
                color: brand.colors.textMuted,
                textAlign: 'center',
                marginTop: '8px',
                fontSize: '12px',
              }}>
                Examen Nacional de Preselección
              </p>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr !important;
          }

          .left-column {
            display: none !important;
          }

          .mobile-temario-button {
            display: block !important;
          }
        }
      `}</style>
    </div>
  )
}
