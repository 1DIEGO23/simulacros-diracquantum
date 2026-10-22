// Cliente de Supabase
// Este es el único archivo que crea el cliente de Supabase
// El resto del proyecto debe importarlo desde aquí

import { createClient } from '@supabase/supabase-js'

// Usamos las variables de entorno que se cargan desde el archivo .env
// VITE_ es el prefijo que Vite usa para las variables de entorno en el navegador
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
