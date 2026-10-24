# Simulacros DiracQuantum - Etapa 1: Login
# Etapa 2: Panel Docente
# Etapa 3: Fórmulas matemáticas e imágenes

Esta es la primera etapa del proyecto DiracQuantum. Por ahora incluye el sistema de login, la redirección por rol, el panel docente para crear simulacros, y soporte para fórmulas matemáticas (KaTeX) e imágenes.

## Archivos creados y su función

### Configuración del proyecto
- **package.json**: Lista las librerías que necesitamos (React, Supabase, Router, etc.)
- **vite.config.js**: Configuración de Vite (la herramienta que crea la página web)
- **index.html**: La página HTML principal que carga la aplicación
- **.gitignore**: Archivo que dice a Git qué NO guardar (como las claves secretas)
- **.env.example**: Plantilla para el archivo .env (no tiene valores reales)

### Código de la aplicación
- **src/config/brand.ts**: Configuración de la marca (colores, nombre, lema). Todos los colores de la interfaz se leen de aquí.
- **src/lib/supabase.ts**: Cliente de Supabase. Este es el único archivo que crea la conexión con Supabase. El resto del proyecto lo importa de aquí.
- **src/context/AuthContext.jsx**: Maneja el estado de sesión del usuario (si está logueado, cuál es su rol, etc.) en toda la aplicación.
- **src/components/ProtectedRoute.jsx**: Componente que protege las rutas. Si no hay sesión, manda al login. Si un alumno intenta entrar a /docente, lo manda a /alumno.
- **src/pages/Login.jsx**: Página de login con correo y contraseña.
- **src/pages/Alumno.jsx**: Página para los alumnos (muestra saludo y botón de cerrar sesión).
- **src/pages/Docente.jsx**: Página para los docentes (muestra saludo y botón de cerrar sesión).
- **src/App.jsx**: Componente principal que configura las rutas.
- **src/main.jsx**: Punto de entrada de la aplicación.
- **src/index.css**: Estilos globales (colores de la barra de desplazamiento, fuentes, etc.).

## Librerías usadas y para qué sirven

- **react**: Framework para crear interfaces de usuario.
- **react-dom**: Conecta React con el navegador.
- **@supabase/supabase-js**: Librería oficial de Supabase para conectar con la base de datos.
- **react-router-dom**: Librería para manejar las rutas (navegación entre páginas).
- **@vitejs/plugin-react**: Plugin de Vite para usar React.
- **vite**: Herramienta para crear y ejecutar la aplicación (más rápida que otras alternativas).

## Instrucciones paso a paso (Windows)

### 1. Instalar Node.js

- Ve a https://nodejs.org/
- Descarga la versión "LTS" (la recomendada para la mayoría de usuarios)
- Ejecuta el instalador
- Acepta todas las opciones por defecto
- Para verificar que se instaló, abre la terminal (PowerShell o CMD) y escribe:
  ```
  node --version
  ```
  Debería mostrar algo como "v20.x.x"

### 2. Instalar las dependencias del proyecto

- Abre la terminal
- Navega a la carpeta del proyecto:
  ```
  cd "C:\Users\Usuario\Desktop\CODIGO DE CURSO DE PYTHON\CURSO DE PYTHON\PAGINA DE GRUPO\simulacros-diracquantum"
  ```
- Ejecuta:
  ```
  npm install
  ```
  Esto descargará todas las librerías necesarias (puede tardar unos minutos)

### 3. Crear el archivo .env

- En la carpeta del proyecto, hay un archivo llamado `.env.example`
- Copia ese archivo y llámalo `.env` (sin el .example al final)
- Abre el archivo `.env` con un editor de texto (notepad, VS Code, etc.)
- Tienes que reemplazar los valores con los tuyos de Supabase

### 4. Obtener la URL y la clave anon de Supabase

- Entra a tu cuenta de Supabase: https://supabase.com/dashboard
- Selecciona tu proyecto
- En el menú izquierdo, haz clic en "Project Settings" (icono de engranaje)
- Luego en "API"
- Verás dos campos importantes:
  - **Project URL**: Cópialo y pégalo donde dice `VITE_SUPABASE_URL=tu_url_aqui`
  - **anon / public key**: Cópialo y pégalo donde dice `VITE_SUPABASE_ANON_KEY=tu_clave_anon_aqui`

### 5. Ejecutar el proyecto

- En la terminal, estando en la carpeta del proyecto, ejecuta:
  ```
  npm run dev
  ```
- Verás algo como:
  ```
  VITE v5.x.x ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ```
- Abre tu navegador y entra a esa dirección (http://localhost:5173/)

### 6. Probar el login

- Verás la pantalla de login
- Usa la cuenta de **docente** (yo te daré el correo y contraseña si hace falta)
- Debería redirigirte a la página /docente
- Cierra sesión
- Usa la cuenta de **alumno**
- Debería redirigirte a la página /alumno

## Pruebas que debes hacer

1. **Entrar como docente**
   - Inicia sesión con la cuenta de docente
   - Resultado esperado: Redirige a /docente, muestra "Hola, [correo]. Rol: Docente"

2. **Entrar como alumno**
   - Inicia sesión con la cuenta de alumno
   - Resultado esperado: Redirige a /alumno, muestra "Hola, [correo]. Rol: Alumno"

3. **Alumno intentando entrar a /docente**
   - Inicia sesión como alumno
   - En la barra de direcciones, escribe manualmente http://localhost:5173/docente
   - Resultado esperado: Redirige automáticamente a /alumno (no puede entrar a docente)

4. **Cerrar sesión**
   - Desde cualquier página, haz clic en "Cerrar sesión"
   - Resultado esperado: Redirige a /login

5. **Recargar la página**
   - Inicia sesión
   - Recarga la página (F5 o el botón de recargar del navegador)
   - Resultado esperado: Sigues logueado en la misma página (la sesión se mantiene)

## Notas importantes

- **Seguridad**: Nunca uses la clave "service_role" o "secret" de Supabase en el navegador. Solo usamos la clave "anon/public".
- **Git**: El archivo .env está en .gitignore, así que Git no lo subirá. Nunca pongas claves reales en el código.
- **Base de datos**: No toques la base de datos. Ya está lista y verificada. Si necesitas un cambio, dímelo y yo lo reviso.
- **Publicación**: Por ahora no subas nada a GitHub ni publiques en Cloudflare. Eso será en etapas posteriores.

## Lo que NO está hecho todavía

- Registro público de usuarios
- Recuperación de contraseña
- Panel del alumno (ver simulacros, hacer pruebas)
- Panel del docente (crear simulacros, ver resultados)
- Importador de preguntas

Todo eso se hará en etapas posteriores.
