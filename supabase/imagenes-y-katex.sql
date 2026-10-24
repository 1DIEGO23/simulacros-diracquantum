-- ==========================================
-- MODIFICACIONES PARA IMÁGENES Y KATEX
-- ==========================================
-- Ejecutar este archivo en el SQL Editor de Supabase
-- ==========================================

-- 1. Agregar columna imagen_url a la tabla preguntas
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 2. Actualizar la función agregar_pregunta para aceptar imagen_url
CREATE OR REPLACE FUNCTION agregar_pregunta(
  p_simulacro_id UUID,
  p_enunciado TEXT,
  p_alternativas JSONB,
  p_correcta CHAR(1),
  p_orden INTEGER,
  p_imagen_url TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO preguntas (simulacro_id, enunciado, alternativas, clave, orden, imagen_url)
  VALUES (p_simulacro_id, p_enunciado, p_alternativas, p_correcta, p_orden, p_imagen_url)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant de ejecución de la función actualizada
GRANT EXECUTE ON FUNCTION agregar_pregunta(UUID, TEXT, JSONB, CHAR(1), INTEGER, TEXT) TO authenticated;

-- 4. Revoke de la función anterior (con 5 parámetros)
REVOKE EXECUTE ON FUNCTION agregar_pregunta(UUID, TEXT, JSONB, CHAR(1), INTEGER) FROM authenticated, PUBLIC, anon;

-- Nota: Las imágenes se guardarán en Supabase Storage en un bucket público llamado "preguntas"
-- El bucket debe crearse manualmente en Supabase → Storage → New bucket
-- Nombre del bucket: "preguntas"
-- Es público: true
