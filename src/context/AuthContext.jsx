// Contexto de autenticación
// Maneja el estado de sesión del usuario en toda la aplicación

import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [userRole, setUserRole] = useState(null)

  useEffect(() => {
    // Verificar sesión al cargar la página
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      if (session) {
        // Obtener el rol del usuario desde la tabla alumnos
        const { data: alumno } = await supabase
          .from('alumnos')
          .select('rol')
          .eq('id', session.user.id)
          .single()

        if (alumno) {
          setUserRole(alumno.rol)
        }
      }

      setLoading(false)
    }

    checkSession()

    // Escuchar cambios en la autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)

        if (session) {
          const { data: alumno } = await supabase
            .from('alumnos')
            .select('rol')
            .eq('id', session.user.id)
            .single()

          if (alumno) {
            setUserRole(alumno.rol)
          }
        } else {
          setUserRole(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    session,
    loading,
    userRole,
    setUserRole,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
