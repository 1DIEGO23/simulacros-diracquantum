-- ==========================================
-- ETAPA 2 - BASE DE DATOS PARA ALUMNOS
-- ==========================================
-- Ejecutar este archivo en el SQL Editor de Supabase
-- ==========================================
-- NOTA: Las tablas intentos y respuestas ya existen en schema.sql
-- Este archivo agrega columnas necesarias y crea funciones para alumnos
-- ==========================================

-- Renombrar columna marcada a alternativa_elegida en respuestas (para mayor claridad)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'respuestas'
    AND column_name = 'marcada'
  ) THEN
    ALTER TABLE respuestas RENAME COLUMN marcada TO alternativa_elegida;
  END IF;
END $$;

-- Actualizar CHECK constraint en respuestas
ALTER TABLE respuestas DROP CONSTRAINT IF EXISTS respuestas_marcada_check;
ALTER TABLE respuestas DROP CONSTRAINT IF EXISTS respuestas_alternativa_elegida_check;
ALTER TABLE respuestas ADD CONSTRAINT respuestas_alternativa_elegida_check CHECK (alternativa_elegida IN ('A', 'B', 'C', 'D'));

-- 1. Agregar columnas de estadísticas a la tabla intentos
-- Asegurar que inicio tenga DEFAULT now()
ALTER TABLE intentos ALTER COLUMN inicio SET DEFAULT NOW();

-- Asegurar los índices únicos
CREATE UNIQUE INDEX IF NOT EXISTS idx_intento_unico ON intentos(alumno_id, simulacro_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_respuesta_unico ON respuestas(intento_id, pregunta_id);

ALTER TABLE intentos ADD COLUMN IF NOT EXISTS correctas INTEGER DEFAULT 0;
ALTER TABLE intentos ADD COLUMN IF NOT EXISTS incorrectas INTEGER DEFAULT 0;
ALTER TABLE intentos ADD COLUMN IF NOT EXISTS en_blanco INTEGER DEFAULT 0;

-- 2. Agregar columna imagen_url a la tabla preguntas (si no existe)
ALTER TABLE preguntas ADD COLUMN IF NOT EXISTS imagen_url TEXT;

-- 3. Verificar/modificar la estructura de alternativas en preguntas
-- (Ya está en JSONB gracias a panel-docente.sql)

-- 4. Soporte para imágenes en alternativas (dentro del JSONB)
-- Se hará a nivel de aplicación, no a nivel de base de datos

-- 5. Función para iniciar un intento de un alumno
CREATE OR REPLACE FUNCTION iniciar_intento(p_simulacro_id UUID)
RETURNS UUID AS $$
DECLARE
  v_resultado UUID;
BEGIN
  -- Validar que el simulacro esté activo
  IF NOT EXISTS (SELECT 1 FROM simulacros WHERE id = p_simulacro_id AND activo = true) THEN
    RAISE EXCEPTION 'El simulacro no está activo';
  END IF;

  -- Validar que el alumno no tenga otro intento del mismo simulacro
  IF EXISTS (
    SELECT 1 FROM intentos
    WHERE alumno_id = auth.uid()
    AND simulacro_id = p_simulacro_id
  ) THEN
    RAISE EXCEPTION 'Ya tienes un intento para este simulacro';
  END IF;

  -- Crear el intento
  INSERT INTO intentos (alumno_id, simulacro_id)
  VALUES (auth.uid(), p_simulacro_id)
  RETURNING id INTO v_resultado;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Función para registrar una respuesta del alumno
CREATE OR REPLACE FUNCTION registrar_respuesta(
  p_intento_id UUID,
  p_pregunta_id UUID,
  p_alternativa_elegida CHAR(1)
)
RETURNS UUID AS $$
DECLARE
  v_resultado UUID;
  v_simulacro_id UUID;
BEGIN
  -- Validar que el intento pertenezca al alumno autenticado
  IF NOT EXISTS (
    SELECT 1 FROM intentos
    WHERE id = p_intento_id
    AND alumno_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'El intento no pertenece al alumno autenticado';
  END IF;

  -- Validar que el intento no haya terminado
  IF EXISTS (SELECT 1 FROM intentos WHERE id = p_intento_id AND fin IS NOT NULL) THEN
    RAISE EXCEPTION 'El intento ya ha finalizado';
  END IF;

  -- Validar que el intento esté dentro del tiempo límite
  IF NOT validar_tiempo_limite(p_intento_id) THEN
    RAISE EXCEPTION 'El tiempo límite ha vencido';
  END IF;

  -- Validar que la pregunta pertenezca al simulacro del intento
  SELECT i.simulacro_id INTO v_simulacro_id
  FROM intentos AS i
  WHERE i.id = p_intento_id;

  IF NOT EXISTS (
    SELECT 1 FROM preguntas
    WHERE id = p_pregunta_id
    AND simulacro_id = v_simulacro_id
  ) THEN
    RAISE EXCEPTION 'La pregunta no pertenece al simulacro del intento';
  END IF;

  -- Validar que p_alternativa_elegida sea A, B, C, D o NULL
  IF p_alternativa_elegida IS NOT NULL AND p_alternativa_elegida NOT IN ('A', 'B', 'C', 'D') THEN
    RAISE EXCEPTION 'La respuesta debe ser A, B, C, D o NULL';
  END IF;

  -- Insertar o actualizar la respuesta
  INSERT INTO respuestas (intento_id, pregunta_id, alternativa_elegida)
  VALUES (p_intento_id, p_pregunta_id, p_alternativa_elegida)
  ON CONFLICT (intento_id, pregunta_id)
  DO UPDATE SET alternativa_elegida = p_alternativa_elegida
  RETURNING id INTO v_resultado;

  RETURN v_resultado;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. Función para validar si el intento está dentro del tiempo límite
CREATE OR REPLACE FUNCTION validar_tiempo_limite(p_intento_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_duracion INTEGER;
  v_inicio TIMESTAMP WITH TIME ZONE;
  v_tiempo_transcurrido INTERVAL;
BEGIN
  -- Obtener duración del simulacro y hora de inicio
  SELECT s.duracion_minutos, i.inicio
  INTO v_duracion, v_inicio
  FROM intentos AS i
  JOIN simulacros AS s ON i.simulacro_id = s.id
  WHERE i.id = p_intento_id;

  -- Calcular tiempo transcurrido
  v_tiempo_transcurrido = NOW() - v_inicio;

  -- Validar que no haya excedido el tiempo límite (con 15 segundos de margen)
  RETURN EXTRACT(EPOCH FROM v_tiempo_transcurrido) <= v_duracion * 60 + 15;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. Función para calcular la nota de un intento
CREATE OR REPLACE FUNCTION calcular_nota_intento(p_intento_id UUID)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_total_preguntas INTEGER;
  v_correctas INTEGER;
  v_nota DECIMAL(5,2);
BEGIN
  -- Contar total de preguntas en el simulacro
  SELECT COUNT(*) INTO v_total_preguntas
  FROM intentos AS i
  JOIN preguntas AS p ON i.simulacro_id = p.simulacro_id
  WHERE i.id = p_intento_id;

  -- Contar respuestas correctas
  SELECT COUNT(*) INTO v_correctas
  FROM respuestas AS r
  JOIN preguntas AS p ON r.pregunta_id = p.id
  WHERE r.intento_id = p_intento_id
  AND r.correcta = true;

  -- Calcular nota sobre 20, limitando a máximo 20
  IF v_total_preguntas > 0 THEN
    v_nota = LEAST((v_correctas::DECIMAL / v_total_preguntas::DECIMAL) * 20, 20);
  ELSE
    v_nota = 0;
  END IF;

  RETURN v_nota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Función para finalizar un intento
CREATE OR REPLACE FUNCTION finalizar_intento(p_intento_id UUID)
RETURNS TABLE (
  id UUID,
  correctas INTEGER,
  incorrectas INTEGER,
  en_blanco INTEGER,
  nota DECIMAL(5,2)
) AS $$
#variable_conflict use_column
DECLARE
  v_duracion INTEGER;
  v_inicio TIMESTAMP WITH TIME ZONE;
  v_fin_calculado TIMESTAMP WITH TIME ZONE;
  v_resultado_id UUID;
  v_correctas INTEGER;
  v_incorrectas INTEGER;
  v_en_blanco INTEGER;
  v_nota DECIMAL(5,2);
  v_total_preguntas INTEGER;
BEGIN
  -- Validar que el intento pertenezca al alumno autenticado
  IF NOT EXISTS (
    SELECT 1 FROM intentos
    WHERE id = p_intento_id
    AND alumno_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'El intento no pertenece al alumno autenticado';
  END IF;

  -- Validar que el intento no haya terminado
  IF EXISTS (SELECT 1 FROM intentos WHERE id = p_intento_id AND fin IS NOT NULL) THEN
    RAISE EXCEPTION 'El intento ya ha finalizado';
  END IF;

  -- Obtener duración e inicio
  SELECT s.duracion_minutos, i.inicio
  INTO v_duracion, v_inicio
  FROM intentos AS i
  JOIN simulacros AS s ON i.simulacro_id = s.id
  WHERE i.id = p_intento_id;

  -- Calcular fin (si el tiempo venció, usar fin = inicio + duración)
  IF NOT validar_tiempo_limite(p_intento_id) THEN
    v_fin_calculado = v_inicio + (v_duracion || ' minutes')::INTERVAL;
  ELSE
    v_fin_calculado = NOW();
  END IF;

  -- Calcular estadísticas
  SELECT COUNT(*) INTO v_correctas
  FROM respuestas AS r
  JOIN preguntas AS p ON r.pregunta_id = p.id
  WHERE r.intento_id = p_intento_id
  AND r.correcta = true;

  SELECT COUNT(*) INTO v_incorrectas
  FROM respuestas AS r
  JOIN preguntas AS p ON r.pregunta_id = p.id
  WHERE r.intento_id = p_intento_id
  AND r.correcta = false;

  -- Calcular en_blanco como total - correctas - incorrectas
  SELECT COUNT(*) INTO v_total_preguntas
  FROM preguntas AS p
  WHERE p.simulacro_id = (SELECT simulacro_id FROM intentos WHERE id = p_intento_id);

  v_en_blanco := v_total_preguntas - v_correctas - v_incorrectas;

  -- Calcular nota
  v_nota = calcular_nota_intento(p_intento_id);

  -- Finalizar el intento y guardar estadísticas
  UPDATE intentos
  SET fin = v_fin_calculado,
      nota = v_nota,
      correctas = v_correctas,
      incorrectas = v_incorrectas,
      en_blanco = v_en_blanco
  WHERE id = p_intento_id
  RETURNING id INTO v_resultado_id;

  RETURN QUERY SELECT v_resultado_id, v_correctas, v_incorrectas, v_en_blanco, v_nota;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. Trigger para actualizar la correcta automáticamente cuando se marca una respuesta
CREATE OR REPLACE FUNCTION actualizar_correcta_respuesta()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que el intento no haya terminado
  IF EXISTS (SELECT 1 FROM intentos WHERE id = NEW.intento_id AND fin IS NOT NULL) THEN
    RAISE EXCEPTION 'No se pueden modificar respuestas de un intento finalizado';
  END IF;

  -- Determinar si la respuesta elegida es correcta (usando la clave de la base de datos)
  NEW.correcta = (NEW.alternativa_elegida = (SELECT clave FROM preguntas WHERE id = NEW.pregunta_id));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recrear el trigger
DROP TRIGGER IF EXISTS trigger_actualizar_correcta ON respuestas;
CREATE TRIGGER trigger_actualizar_correcta
  BEFORE INSERT OR UPDATE ON respuestas
  FOR EACH ROW
  EXECUTE FUNCTION actualizar_correcta_respuesta();

-- 11. Función para revisar un intento finalizado
CREATE OR REPLACE FUNCTION revision_intento(p_intento_id UUID)
RETURNS TABLE (
  pregunta_id UUID,
  enunciado TEXT,
  alternativas JSONB,
  alternativa_elegida CHAR(1),
  clave CHAR(1),
  correcta BOOLEAN,
  imagen_url TEXT
) AS $$
BEGIN
  -- Validar que el intento pertenezca al alumno autenticado o sea docente
  IF NOT EXISTS (
    SELECT 1 FROM intentos
    WHERE id = p_intento_id
    AND (alumno_id = auth.uid() OR (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente')
  ) THEN
    RAISE EXCEPTION 'No tienes permiso para revisar este intento';
  END IF;

  -- Validar que el intento haya finalizado
  IF NOT EXISTS (SELECT 1 FROM intentos WHERE id = p_intento_id AND fin IS NOT NULL) THEN
    RAISE EXCEPTION 'El intento aún no ha finalizado';
  END IF;

  RETURN QUERY
  SELECT
    p.id AS pregunta_id,
    p.enunciado,
    p.alternativas,
    r.alternativa_elegida,
    p.clave,
    r.correcta,
    p.imagen_url
  FROM preguntas AS p
  LEFT JOIN respuestas AS r
    ON r.pregunta_id = p.id AND r.intento_id = p_intento_id
  WHERE p.simulacro_id = (SELECT simulacro_id FROM intentos WHERE id = p_intento_id)
  ORDER BY p.orden;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. Vista para alumnos que oculta la clave y correcta mientras rinden
CREATE OR REPLACE VIEW preguntas_alumno AS
SELECT
  p.id,
  p.simulacro_id,
  p.enunciado,
  p.alternativas,
  p.tema,
  p.imagen_url,
  p.orden,
  p.created_at,
  p.updated_at
FROM preguntas AS p
JOIN simulacros AS s ON p.simulacro_id = s.id
WHERE s.activo = true
AND (
  (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente'
  OR EXISTS (
    SELECT 1 FROM intentos AS i
    WHERE i.simulacro_id = s.id
    AND i.alumno_id = auth.uid()
    AND i.fin IS NULL
  )
);

-- 13. Vista para intentos que oculta la nota hasta finalizar
CREATE OR REPLACE VIEW intentos_alumno AS
SELECT
  i.id,
  i.alumno_id,
  i.simulacro_id,
  i.inicio,
  i.fin,
  CASE
    WHEN i.fin IS NOT NULL OR (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente' THEN i.nota
    ELSE NULL
  END AS nota,
  i.correctas,
  i.incorrectas,
  i.en_blanco,
  i.created_at
FROM intentos AS i
WHERE i.alumno_id = auth.uid() OR (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente';

-- 14. Vista para respuestas que oculta correcta hasta finalizar
CREATE OR REPLACE VIEW respuestas_alumno AS
SELECT
  r.id,
  r.intento_id,
  r.pregunta_id,
  r.alternativa_elegida,
  CASE
    WHEN EXISTS (SELECT 1 FROM intentos WHERE id = r.intento_id AND fin IS NOT NULL)
    OR (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente' THEN r.correcta
    ELSE NULL
  END AS correcta,
  r.created_at
FROM respuestas AS r
JOIN intentos AS i ON r.intento_id = i.id
WHERE i.alumno_id = auth.uid() OR (SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente';

-- 14b. Eliminar políticas de escritura de alumnos (sin depender del nombre)
-- Borra INSERT/ALL en intentos y TODAS las políticas de respuestas.
-- Los alumnos escriben solo mediante las funciones SECURITY DEFINER.
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT policyname, tablename FROM pg_policies
    WHERE schemaname = 'public'
    AND (
      (tablename = 'intentos' AND cmd IN ('INSERT', 'ALL'))
      OR tablename = 'respuestas'
    )
  LOOP
    EXECUTE format('DROP POLICY %I ON %I', r.policyname, r.tablename);
  END LOOP;
END $$;

-- 15. Políticas RLS para alumnos (intentos)
-- Eliminar políticas existentes de schema.sql
DROP POLICY IF EXISTS "Los alumnos pueden ver sus propios intentos" ON intentos;
DROP POLICY IF EXISTS "Solo docentes pueden actualizar intentos" ON intentos;
DROP POLICY IF EXISTS "Los docentes pueden ver todos los intentos" ON intentos;
DROP POLICY IF EXISTS "Los docentes pueden eliminar intentos" ON intentos;

-- Los alumnos solo pueden ver sus propios intentos
CREATE POLICY "Los alumnos pueden ver sus propios intentos"
  ON intentos FOR SELECT
  USING (auth.uid() = alumno_id);

-- Los alumnos NO pueden actualizar intentos (nota es calculada)
CREATE POLICY "Solo docentes pueden actualizar intentos"
  ON intentos FOR UPDATE
  USING ((SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente');

-- Los docentes pueden ver todos los intentos
CREATE POLICY "Los docentes pueden ver todos los intentos"
  ON intentos FOR SELECT
  USING ((SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente');

-- Los docentes pueden eliminar intentos (para permitir reintentos)
CREATE POLICY "Los docentes pueden eliminar intentos"
  ON intentos FOR DELETE
  USING ((SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente');

-- 16. Políticas RLS para alumnos (respuestas)
-- Eliminar políticas existentes de schema.sql
DROP POLICY IF EXISTS "Los alumnos pueden ver sus propias respuestas" ON respuestas;
DROP POLICY IF EXISTS "Los docentes pueden ver todas las respuestas" ON respuestas;

-- Solo los docentes pueden ver todas las respuestas (los alumnos usan vistas)
CREATE POLICY "Los docentes pueden ver todas las respuestas"
  ON respuestas FOR SELECT
  USING ((SELECT rol FROM alumnos WHERE id = auth.uid()) = 'docente');

-- 17. Grants para vistas (solo SELECT)
GRANT SELECT ON preguntas_alumno TO authenticated;
GRANT SELECT ON intentos_alumno TO authenticated;
GRANT SELECT ON respuestas_alumno TO authenticated;

-- 18. Grants para funciones seguras (solo authenticated)
GRANT EXECUTE ON FUNCTION iniciar_intento(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION registrar_respuesta(UUID, UUID, CHAR(1)) TO authenticated;
GRANT EXECUTE ON FUNCTION finalizar_intento(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION revision_intento(UUID) TO authenticated;

-- 19. Revoke ejecución de funciones internas de authenticated
REVOKE EXECUTE ON FUNCTION validar_tiempo_limite(UUID) FROM authenticated;
REVOKE EXECUTE ON FUNCTION calcular_nota_intento(UUID) FROM authenticated;

-- 20. Revoke ejecución de todas las funciones de PUBLIC y anon
REVOKE EXECUTE ON FUNCTION iniciar_intento(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION registrar_respuesta(UUID, UUID, CHAR(1)) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION finalizar_intento(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION revision_intento(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION validar_tiempo_limite(UUID) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION calcular_nota_intento(UUID) FROM PUBLIC, anon;