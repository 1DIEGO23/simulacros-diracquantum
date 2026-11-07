// Convierte el texto pegado (formato #1 ... FIN) en preguntas ordenadas
export function parsearPreguntas(texto) {
  const lineas = texto.replace(/\r/g, '').split('\n')
  const preguntas = []
  let actual = null
  let modo = null
  let ultimaAlt = null

  const nueva = () => ({
    enunciado: [],
    alternativas: { A: '', B: '', C: '', D: '' },
    clave: '',
    figuraTipo: '',
    figura: [],
  })

  const cerrar = () => {
    if (!actual) return
    const enunciado = actual.enunciado.join('\n').trim()
    const codigo = actual.figura.join('\n').trim()
    const problemas = []
    if (!enunciado) problemas.push('falta el enunciado')
    for (const l of ['A', 'B', 'C', 'D']) {
      if (!actual.alternativas[l]) problemas.push(`falta la alternativa ${l}`)
    }
    if (!actual.clave) problemas.push('falta RESPUESTA')
    if (actual.figuraTipo && !codigo) problemas.push('FIGURA sin código')
    preguntas.push({
      numero: preguntas.length + 1,
      enunciado,
      alternativas: actual.alternativas,
      clave: actual.clave,
      figura_tipo: codigo ? actual.figuraTipo || 'svg' : null,
      figura_codigo: codigo || null,
      problemas,
    })
    actual = null
    modo = null
    ultimaAlt = null
  }

  for (const linea of lineas) {
    const t = linea.trim()

    if (/^#\s*\d+\s*$/.test(t)) {
      cerrar()
      actual = nueva()
      modo = 'enunciado'
      continue
    }
    if (!actual) continue

    if (/^FIN$/i.test(t)) {
      cerrar()
      continue
    }

    const resp = t.match(/^RESPUESTA\s*:\s*([A-D])/i)
    if (resp) {
      actual.clave = resp[1].toUpperCase()
      modo = null
      continue
    }

    const fig = t.match(/^FIGURA\s*:\s*(svg|jsxgraph)/i)
    if (fig) {
      actual.figuraTipo = fig[1].toLowerCase()
      modo = 'figura'
      continue
    }

    if (modo === 'figura') {
      actual.figura.push(linea)
      continue
    }

    const alt = t.match(/^([A-D])\s*[).]\s*(.*)$/)
    if (alt) {
      ultimaAlt = alt[1]
      actual.alternativas[ultimaAlt] = alt[2].trim()
      modo = 'alt'
      continue
    }

    if (modo === 'alt' && ultimaAlt && t) {
      actual.alternativas[ultimaAlt] += ' ' + t
    } else if (modo === 'enunciado') {
      actual.enunciado.push(linea)
    }
  }
  cerrar()
  return preguntas
}
