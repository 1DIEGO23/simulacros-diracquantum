// Página de Login - Portada profesional DiracQuantum
// Simulacros ENP - Beca 18

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import { temario } from '../config/temario'

// Componente de acordeón
function Acordeon({ titulo, contenido, abierto, onToggle }) {
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
        aria-expanded={abierto}
      >
        {titulo}
        <span style={{ fontSize: '18px' }}>{abierto ? '−' : '+'}</span>
      </button>
      {abierto && (
        <div style={{
          padding: '12px 16px',
          borderTop: `1px solid ${brand.colors.violetNeon}33`,
          color: brand.colors.textMuted,
          fontSize: '13px',
          lineHeight: '1.6',
        }}>
          {contenido}
        </div>
      )}
    </div>
  )
}

// Panel de temario completo
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
          aria-label="Cerrar temario"
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
            contenido={<ul style={{ margin: 0, paddingLeft: '20px' }}>
              {seccion.items.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
            </ul>}
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
            contenido={<ul style={{ margin: 0, paddingLeft: '20px' }}>
              {seccion.items.map((item, i) => <li key={i} style={{ marginBottom: '4px' }}>{item}</li>)}
            </ul>}
            abierto={abiertosMatematica[idx]}
            onToggle={() => toggleMatematica(idx)}
          />
        ))}
      </div>
    </div>
  )
}

// Cuenta regresiva
function CuentaRegresiva() {
  const [tiempo, setTiempo] = useState({ dias: 0, horas: 0, minutos: 0 })
  const [yaPaso, setYaPaso] = useState(false)

  useEffect(() => {
    const calcularTiempo = () => {
      const ahora = new Date()
      const examen = new Date(brand.examenFecha)
      const diferencia = examen - ahora

      if (diferencia <= 0) {
        setYaPaso(true)
        return
      }

      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24))
      const horas = Math.floor((diferencia % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutos = Math.floor((diferencia % (1000 * 60 * 60)) / (1000 * 60))

      setTiempo({ dias, horas, minutos })
    }

    calcularTiempo()
    const intervalo = setInterval(calcularTiempo, 60000) // Actualizar cada minuto

    return () => clearInterval(intervalo)
  }, [])

  if (yaPaso) {
    return (
      <div style={{
        padding: '20px',
        borderRadius: '12px',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        border: `1px solid ${brand.colors.success}`,
        textAlign: 'center',
      }}>
        <p style={{
          color: brand.colors.success,
          fontSize: '18px',
          fontWeight: 'bold',
          margin: 0,
        }}>
          ¡Mucho éxito en tu examen!
        </p>
      </div>
    )
  }

  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: 'rgba(139, 92, 246, 0.1)',
      border: `1px solid ${brand.colors.violetNeon}`,
      textAlign: 'center',
    }}>
      <p style={{
        color: brand.colors.text,
        fontSize: '14px',
        marginBottom: '12px',
        margin: 0,
      }}>
        Faltan {tiempo.dias} días para el ENP
      </p>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '20px',
        flexWrap: 'wrap',
      }}>
        <div>
          <span style={{
            color: brand.colors.violetNeon,
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${brand.colors.violetNeon}`,
          }}>
            {tiempo.dias}
          </span>
          <span style={{ color: brand.colors.textMuted, fontSize: '12px', marginLeft: '4px' }}>días</span>
        </div>
        <div>
          <span style={{
            color: brand.colors.violetNeon,
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${brand.colors.violetNeon}`,
          }}>
            {tiempo.horas}
          </span>
          <span style={{ color: brand.colors.textMuted, fontSize: '12px', marginLeft: '4px' }}>horas</span>
        </div>
        <div>
          <span style={{
            color: brand.colors.violetNeon,
            fontSize: '32px',
            fontWeight: 'bold',
            textShadow: `0 0 10px ${brand.colors.violetNeon}`,
          }}>
            {tiempo.minutos}
          </span>
          <span style={{ color: brand.colors.textMuted, fontSize: '12px', marginLeft: '4px' }}>min</span>
        </div>
      </div>
    </div>
  )
}

// Tarjeta con icono
function Tarjeta({ icono, texto, delay }) {
  return (
    <div style={{
      padding: '20px',
      borderRadius: '12px',
      backgroundColor: 'rgba(59, 130, 246, 0.08)',
      border: `1px solid ${brand.colors.electricBlue}`,
      display: 'flex',
      alignItems: 'center',
      gap: '16px',
      animation: `fadeInUp 0.5s ease-in-out ${delay}s both`,
    }}>
      <div style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderRadius: '8px',
        color: brand.colors.electricBlue,
      }}>
        {icono}
      </div>
      <p style={{
        color: brand.colors.text,
        fontSize: '14px',
        margin: 0,
        lineHeight: '1.4',
      }}>
        {texto}
      </p>
    </div>
  )
}

// Sección "Así funciona"
function ComoFunciona() {
  const pasos = [
    {
      numero: '1',
      titulo: 'Recibe tu cuenta',
      descripcion: 'Te entregamos tu usuario para ingresar.',
    },
    {
      numero: '2',
      titulo: 'Rinde tus simulacros',
      descripcion: 'Resuelve con temporizador y recibe tu nota.',
    },
    {
      numero: '3',
      titulo: 'Mira tu rendimiento',
      descripcion: 'Consulta tu estadística y mejora en cada intento.',
    },
  ]

  return (
    <section style={{
      padding: '60px 20px',
      backgroundColor: 'rgba(139, 92, 246, 0.05)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
      }}>
        <h2 style={{
          color: brand.colors.text,
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '48px',
        }}>
          Así funciona
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '40px',
          position: 'relative',
        }}>
          {pasos.map((paso, idx) => (
            <div
              key={idx}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                position: 'relative',
              }}
            >
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: brand.colors.violetNeon,
                color: brand.colors.background,
                fontSize: '28px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px',
                boxShadow: `0 0 20px rgba(139, 92, 246, 0.4)`,
              }}>
                {paso.numero}
              </div>
              <h3 style={{
                color: brand.colors.text,
                fontSize: '18px',
                fontWeight: 'bold',
                marginBottom: '8px',
                margin: 0,
              }}>
                {paso.titulo}
              </h3>
              <p style={{
                color: brand.colors.textMuted,
                fontSize: '14px',
                margin: 0,
                lineHeight: '1.5',
              }}>
                {paso.descripcion}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// FAQ
function FAQ() {
  const [abiertos, setAbiertos] = useState({})

  const preguntas = [
    {
      pregunta: '¿Cómo obtengo mi cuenta?',
      respuesta: (
        <>
          Escríbenos por{' '}
          <a
            href={brand.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: brand.colors.violetNeon,
              textDecoration: 'underline',
            }}
          >
            WhatsApp
          </a>{' '}
          y te la entregamos.
        </>
      ),
    },
    {
      pregunta: '¿Cuántas preguntas tiene cada simulacro?',
      respuesta: '60 preguntas de alternativas, con temporizador.',
    },
    {
      pregunta: '¿Veré mis errores?',
      respuesta: 'Sí, al terminar ves la respuesta correcta de cada pregunta.',
    },
  ]

  const toggle = (idx) => {
    setAbiertos(prev => ({ ...prev, [idx]: !prev[idx] }))
  }

  return (
    <section style={{
      padding: '60px 20px',
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
      }}>
        <h2 style={{
          color: brand.colors.text,
          fontSize: '28px',
          fontWeight: 'bold',
          textAlign: 'center',
          marginBottom: '32px',
        }}>
          Preguntas frecuentes
        </h2>
        {preguntas.map((p, idx) => (
          <Acordeon
            key={idx}
            titulo={p.pregunta}
            contenido={p.respuesta}
            abierto={abiertos[idx]}
            onToggle={() => toggle(idx)}
          />
        ))}
      </div>
    </section>
  )
}

// Botón flotante de WhatsApp
function WhatsAppFlotante() {
  return (
    <a
      href={brand.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        backgroundColor: '#25D366',
        color: '#fff',
        padding: '12px 20px',
        borderRadius: '50px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        textDecoration: 'none',
        fontWeight: 'bold',
        fontSize: '14px',
        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
        transition: 'transform 0.2s',
        zIndex: 1000,
      }}
      onMouseOver={(e) => e.target.style.transform = 'scale(1.05)'}
      onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
      aria-label="Contactar por WhatsApp"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
      <span className="whatsapp-text">¿Quieres inscribirte? Escríbenos</span>
    </a>
  )
}

// Pie de página
function Footer() {
  return (
    <footer style={{
      padding: '40px 20px',
      backgroundColor: 'rgba(5, 6, 15, 0.8)',
      borderTop: `1px solid ${brand.colors.violetNeon}33`,
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}>
        <img
          src={brand.logoUrl}
          alt="Logo DiracQuantum"
          style={{
            width: '80px',
            height: 'auto',
          }}
        />
        <p style={{
          color: brand.colors.textMuted,
          fontSize: '13px',
          margin: 0,
          textAlign: 'center',
        }}>
          © 2026 DiracQuantum - Nivel UNI
        </p>
        <p style={{
          color: brand.colors.textMuted,
          fontSize: '13px',
          margin: 0,
          textAlign: 'center',
        }}>
          {brand.slogan}
        </p>
        <a
          href={brand.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: brand.colors.violetNeon,
            textDecoration: 'underline',
            fontSize: '13px',
          }}
        >
          Contáctanos por WhatsApp
        </a>
      </div>
    </footer>
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
    <>
      {/* Fondo animado con símbolos matemáticos */}
      <div className="background-symbols" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}>
        {['Ψ', '∫', 'π', '√', 'Σ', 'e^(iπ)+1=0'].map((simbolo, idx) => (
          <div
            key={idx}
            style={{
              position: 'absolute',
              color: idx % 2 === 0 ? brand.colors.violetNeon : brand.colors.electricBlue,
              fontSize: '120px',
              opacity: '0.03',
              fontWeight: 'bold',
              animation: `float ${10 + idx * 2}s infinite ease-in-out`,
              left: `${10 + idx * 15}%`,
              top: `${10 + idx * 12}%`,
            }}
          >
            {simbolo}
          </div>
        ))}
      </div>

      {/* Contenido principal */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        minHeight: '100vh',
        backgroundColor: brand.colors.background,
      }}>
        {/* Sección hero */}
        <div className="hero-section" style={{
          padding: '40px 20px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '40px',
          maxWidth: '1200px',
          margin: '0 auto',
          alignItems: 'start',
        }}>
          {/* Columna izquierda */}
          <div className="left-column" style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}>
            {/* Botón de temario */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
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
                  aria-label="Ver temario ENP - Beca 18"
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
                  margin: '8px 0 0 0',
                }}>
                  Examen Nacional de Preselección
                </p>
              )}
            </div>

            {/* Cuenta regresiva */}
            <CuentaRegresiva />

            {/* Tarjetas */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}>
              <Tarjeta
                icono={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                texto="Simulacros de 60 preguntas con temporizador"
                delay="0.2"
              />
              <Tarjeta
                icono={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14l-5-5 1.41-1.41L12 14.17l4.59-4.58L18 11l-6 6z"/></svg>}
                texto="Tu nota sobre 20 al instante"
                delay="0.4"
              />
              <Tarjeta
                icono={<svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>}
                texto="Revisión con la respuesta correcta"
                delay="0.6"
              />
            </div>
          </div>

          {/* Columna derecha */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}>
            <img
              src={brand.logoUrl}
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
              {brand.slogan}
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
                aria-label="Iniciar sesión"
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
                      aria-label="Correo electrónico"
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
                      aria-label="Contraseña"
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
                    }} role="alert">
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

            {/* Botón de temario para móvil */}
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

        {/* Secciones adicionales */}
        <ComoFunciona />
        <FAQ />
        <Footer />

        {/* Botón flotante de WhatsApp */}
        <WhatsAppFlotante />
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @media (max-width: 768px) {
          .hero-section {
            grid-template-columns: 1fr !important;
            gap: '24px !important';
            padding: '24px 16px !important';
          }

          .left-column {
            display: flex !important;
            order: 2 !important;
          }

          .mobile-temario-button {
            display: none !important;
          }

          .whatsapp-text {
            display: none !important;
          }

          .background-symbols div {
            fontSize: '60px !important';
          }
        }

        @media (max-width: 480px) {
          .hero-section {
            padding: '20px 12px !important';
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </>
  )
}
