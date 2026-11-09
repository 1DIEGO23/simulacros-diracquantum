import { useEffect, useRef, useState } from 'react'

const JSX_JS = 'https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.9.2/jsxgraphcore.js'
const JSX_CSS = 'https://cdnjs.cloudflare.com/ajax/libs/jsxgraph/1.9.2/jsxgraph.min.css'

let jsxPromise
function cargarJSXGraph() {
  if (window.JXG) return Promise.resolve(window.JXG)
  if (!jsxPromise) {
    jsxPromise = new Promise((resolve, reject) => {
      const css = document.createElement('link')
      css.rel = 'stylesheet'
      css.href = JSX_CSS
      document.head.appendChild(css)
      const s = document.createElement('script')
      s.src = JSX_JS
      s.onload = () => resolve(window.JXG)
      s.onerror = () => {
        jsxPromise = null
        reject(new Error('No se pudo cargar JSXGraph'))
      }
      document.head.appendChild(s)
    })
  }
  return jsxPromise
}

const caja = {
  background: '#ffffff',
  borderRadius: 8,
  padding: 8,
  margin: '12px auto',
  maxWidth: 420,
  textAlign: 'center',
}

export default function RenderFiguraCodigo({ tipo, codigo, figuraTipo, figuraCodigo }) {
  // Soportar ambos nombres de props para compatibilidad
  const tipoFinal = tipo || figuraTipo
  const codigoFinal = codigo || figuraCodigo
  const idRef = useRef('jxg_' + Math.random().toString(36).slice(2))
  const [error, setError] = useState(null)

  useEffect(() => {
    if (tipoFinal !== 'jsxgraph' || !codigoFinal) return
    let board = null
    let cancelado = false
    setError(null)
    cargarJSXGraph()
      .then((JXG) => {
        if (cancelado) return
        try {
          board = JXG.JSXGraph.initBoard(idRef.current, {
            boundingbox: [-6, 6, 6, -6],
            axis: false,
            showCopyright: false,
            showNavigation: false,
            keepAspectRatio: true,
            pan: { enabled: false },
            zoom: { enabled: false },
          })
          new Function('board', 'JXG', codigo)(board, JXG)
        } catch (e) {
          setError(e.message)
        }
      })
      .catch((e) => setError(e.message))
    return () => {
      cancelado = true
      if (board && window.JXG) window.JXG.JSXGraph.freeBoard(board)
    }
  }, [tipoFinal, codigoFinal])

  if (!codigoFinal || !tipoFinal) return null

  if (tipoFinal === 'svg') {
    const limpio = codigoFinal.includes('xmlns')
      ? codigoFinal
      : codigoFinal.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')
    const src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(limpio)
    return (
      <div style={caja}>
        <img src={src} alt="Figura de la pregunta" style={{ maxWidth: '100%', height: 'auto' }} />
      </div>
    )
  }

  if (tipoFinal === 'jsxgraph') {
    return (
      <div style={caja}>
        {error && <p style={{ color: '#b00020', fontSize: 13 }}>Error en la figura: {error}</p>}
        <div id={idRef.current} style={{ width: '100%', aspectRatio: '1 / 1' }} />
      </div>
    )
  }

  return null
}
