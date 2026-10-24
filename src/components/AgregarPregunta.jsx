import { supabase } from '../lib/supabase'
import { brand } from '../config/brand'
import FormularioPregunta from './FormularioPregunta'

export default function AgregarPregunta({ simulacroId, onPreguntaAgregada }) {
  const guardar = async (datos) => {
    const { data: ultima } = await supabase
      .from('preguntas')
      .select('orden')
      .eq('simulacro_id', simulacroId)
      .order('orden', { ascending: false })
      .limit(1)

    const orden = (ultima?.[0]?.orden ?? 0) + 1

    const { error } = await supabase.rpc('agregar_pregunta', {
      p_simulacro_id: simulacroId,
      p_enunciado: datos.enunciado,
      p_alternativas: datos.alternativas,
      p_correcta: datos.clave,
      p_orden: orden,
      p_imagen_url: datos.imagen_url,
    })

    if (error) throw error
    if (onPreguntaAgregada) onPreguntaAgregada()
  }

  return (
    <div
      style={{
        padding: '24px',
        borderRadius: '8px',
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        border: `1px solid ${brand.colors.violetNeon}`,
      }}
    >
      <h3 style={{ color: brand.colors.text, marginBottom: '16px', fontSize: '18px' }}>
        Agregar pregunta
      </h3>
      <FormularioPregunta
        textoBoton="Agregar pregunta"
        onGuardar={guardar}
        limpiarAlGuardar
      />
    </div>
  )
}