// Componente para renderizar texto con fórmulas matemáticas usando KaTeX
// Soporta LaTeX en línea: $...$ y en bloque: $$...$$

import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

export default function TextoMatematico({ texto }) {
  if (!texto) {
    return null
  }

  try {
    // Dividir el texto en partes con y sin LaTeX
    const partes = texto.split(/(\$\$[\s\S]*?\$\$|\$[^$\n]*?\$)/g)

    return (
      <span>
        {partes.map((parte, index) => {
          // Fórmula en bloque: $$...$$
          if (parte.startsWith('$$') && parte.endsWith('$$')) {
            const latex = parte.slice(2, -2).trim()
            return (
              <BlockMath
                key={index}
                math={latex}
                errorColor="#ef4444"
                renderError={(error) => (
                  <span style={{ color: '#ef4444', fontSize: '0.9em' }}>
                    {parte}
                  </span>
                )}
              />
            )
          }

          // Fórmula en línea: $...$
          if (parte.startsWith('$') && parte.endsWith('$')) {
            const latex = parte.slice(1, -1).trim()
            return (
              <InlineMath
                key={index}
                math={latex}
                errorColor="#ef4444"
                renderError={(error) => (
                  <span style={{ color: '#ef4444', fontSize: '0.9em' }}>
                    {parte}
                  </span>
                )}
              />
            )
          }

          // Texto normal
          return <span key={index}>{parte}</span>
        })}
      </span>
    )
  } catch (error) {
    // Si hay error al procesar, mostrar el texto crudo
    return <span>{texto}</span>
  }
}
