-- ==========================================
-- MODIFICACIONES PARA EL PANEL DOCENTE
-- ==========================================
-- Ejecutar este archivo en el SQL Editor de Supabase
-- ==========================================

-- 1. Agregar columna creado_por a la tabla simulacros
ALTER TABLE simulacros ADD COLUMN IF NOT EXISTS creado_por UUID REFERENCES alumnos(id) ON DELETE SET NULL;

-- 2. Crear una función para insertar simulacro con el creador
CREATE OR REPLACE FUNCTION crear_simulacro(p_titulo VARCHAR, p_duracion INTEGER)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO simulacros (titulo, duracion_minutos, activo, creado_por)
  VALUES (p_titulo, p_duracion, true, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Modificar la tabla preguntas para usar JSONB en alternativas
-- Primero, creamos una columna temporal para migrar datos si es necesario
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS alternativas_jsonb JSONB;

-- Función para migrar datos existentes si hay alguna
CREATE OR REPLACE FUNCTION migrar_alternativas()
RETURNS VOID AS $$
BEGIN
  UPDATE preguntas
  SET alternativas_jsonb = jsonb_build_object(
    'A', alternativa_a,
    'B', alternativa_b,
    'C', alternativa_c,
    'D', alternativa_d
  )
  WHERE alternativas_jsonb IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ejecutar migración
SELECT migrar_alternativas();

-- Eliminar las columnas antiguas de alternativas
ALTER TABLE preguntas DROP COLUMN IF EXISTS alternativa_a;
ALTER TABLE preguntas DROP COLUMN IF EXISTS alternativa_b;
ALTER TABLE preguntas DROP COLUMN IF EXISTS alternativa_c;
ALTER TABLE preguntas DROP COLUMN IF EXISTS alternativa_d;

-- Renombrar la columna nueva
ALTER TABLE preguntas RENAME COLUMN alternativas_jsonb TO alternativas;

-- 4. Actualizar políticas RLS para permitir que docentes creen simulacros
-- (la política actual ya permite esto con es_docente(), pero nos aseguramos)

-- 5. Crear función para agregar pregunta
CREATE OR REPLACE FUNCTION agregar_pregunta(
  p_simulacro_id UUID,
  p_enunciado TEXT,
  p_alternativas JSONB,
  p_correcta CHAR(1),
  p_orden INTEGER
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO preguntas (simulacro_id, enunciado, alternativas, clave, orden)
  VALUES (p_simulacro_id, p_enunciado, p_alternativas, p_correcta, p_orden)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Grant de ejecución de las nuevas funciones
GRANT EXECUTE ON FUNCTION crear_simulacro(VARCHAR, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION agregar_pregunta(UUID, TEXT, JSONB, CHAR(1), INTEGER) TO authenticated;

-- 7. Revoke de PUBLIC y anon
REVOKE EXECUTE ON FUNCTION crear_simulacro(VARCHAR, INTEGER) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION agregar_pregunta(UUID, TEXT, JSONB, CHAR(1), INTEGER) FROM PUBLIC, anon;

-- 8. Limpiar función de migración (opcional)
DROP FUNCTION IF EXISTS migrar_alternadas();
