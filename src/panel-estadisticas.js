/* DiracQuantum – Panel "ANÁLISIS DE TU RENDIMIENTO"
 * Autónomo: no depende de librerías. Inyecta su propio CSS.
 * Preguntas 1–30 = Competencia Lectora (RV) · 31–60 = Competencias Matemáticas (RM)
 *
 * USO:
 *   const r = PanelEstadisticas.calcular(items);
 *   if (r.ok) PanelEstadisticas.render(contenedor, r, { puntaje: tuPuntajeReal, puntajeMax: tuMax });
 *
 * items = [{ orden: 1..60, correcta: 'A', marcada: 'B' | null | '' }, ...]
 *   orden   = número ORIGINAL de la pregunta en el simulacro (no el orden en que se mostró)
 *   correcta = alternativa correcta guardada en la BD
 *   marcada  = alternativa que marcó el alumno (null o '' si la dejó en blanco)
 */
(function (global) {
  'use strict';

  var AREAS = [
    { id: 'rv', nombre: 'Competencia Lectora', sigla: 'RV', desde: 1, hasta: 30, color: '#38bdf8' },
    { id: 'rm', nombre: 'Competencias Matemáticas', sigla: 'RM', desde: 31, hasta: 60, color: '#a78bfa' }
  ];
  var POR_AREA = 30, TOTAL = 60;
  var UMBRAL_SIMILAR = 5;   // diferencia en puntos porcentuales para decir "equilibrado"
  var UMBRAL_BAJO = 40;     // por debajo de esto un área se considera baja

  function norm(x) { return (x === null || x === undefined) ? '' : String(x).trim().toUpperCase(); }

  function calcular(items) {
    var vacio = { ok: false, error: '' };
    if (!Array.isArray(items) || items.length < 2) { vacio.error = 'Sin datos del intento.'; return vacio; }
    var N = items.length, mitad = Math.floor(N / 2);
    // Primera mitad = RV (Lectora), segunda mitad = RM (Matemáticas). Con 60 preguntas: 1-30 y 31-60.
    var rangos = { rv: [1, mitad], rm: [mitad + 1, N] };
    var vistos = {}, i, it;
    for (i = 0; i < N; i++) {
      it = items[i];
      var o = Number(it && it.orden);
      if (!(o >= 1 && o <= N) || o % 1 !== 0) { vacio.error = 'Número de orden inválido.'; return vacio; }
      if (vistos[o]) { vacio.error = 'Pregunta repetida: ' + o; return vacio; }
      vistos[o] = it;
    }

    var res = { ok: true, areas: {}, total: { preguntas: N, correctas: 0, incorrectas: 0, sinResponder: 0 } };
    AREAS.forEach(function (a) {
      var d = rangos[a.id][0], h = rangos[a.id][1], n = h - d + 1, c = 0, inc = 0, sr = 0;
      for (var k = d; k <= h; k++) {
        var m = norm(vistos[k].marcada);
        if (m === '') sr++;
        else if (m === norm(vistos[k].correcta)) c++;
        else inc++;
      }
      if (c + inc + sr !== n) { vacio.error = 'Conteo inconsistente en ' + a.nombre; return; }
      res.areas[a.id] = {
        id: a.id, nombre: a.nombre, sigla: a.sigla, color: a.color,
        preguntas: n, correctas: c, incorrectas: inc, sinResponder: sr,
        respondidas: c + inc,
        pctAciertos: (c / n) * 100,
        pctRespondidas: ((c + inc) / n) * 100
      };
      res.total.correctas += c; res.total.incorrectas += inc; res.total.sinResponder += sr;
    });
    if (!res.areas.rv || !res.areas.rm) return vacio;
    var t = res.total;
    if (t.correctas + t.incorrectas + t.sinResponder !== N) { vacio.error = 'La suma no coincide con el total.'; return vacio; }
    t.pctAciertos = (t.correctas / N) * 100;
    res.diagnostico = diagnostico(res.areas.rv, res.areas.rm);
    return res;
  }

  function diagnostico(rv, rm) {
    var a = rv.pctAciertos, b = rm.pctAciertos, dif = Math.abs(a - b);
    var mejor = a > b ? rv : rm, peor = a > b ? rm : rv;
    var texto;
    if (a < UMBRAL_BAJO && b < UMBRAL_BAJO) {
      texto = 'Necesitas reforzar ambas competencias. Te recomendamos continuar practicando y revisar tus respuestas incorrectas.';
    } else if (dif <= UMBRAL_SIMILAR) {
      texto = 'Tu rendimiento fue equilibrado en ambas áreas. Sigue practicando para mejorar tus resultados.';
    } else if (mejor.id === 'rm') {
      texto = 'Tu mejor desempeño fue en Competencias Matemáticas. Sigue fortaleciendo tus habilidades en esta área y refuerza Competencia Lectora.';
    } else {
      texto = 'Tu mejor desempeño fue en Competencia Lectora. Te recomendamos mantener este nivel y reforzar Matemática.';
    }
    return { texto: texto, mejor: dif <= UMBRAL_SIMILAR ? null : mejor.id, reforzar: dif <= UMBRAL_SIMILAR ? null : peor.id };
  }

  function fmt(p) { return (Math.round(p * 10) / 10).toString().replace('.', ',') + ' %'; }

  function donut(pct, color, etiqueta) {
    var r = 52, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return '<svg class="dqe-donut" viewBox="0 0 140 140" role="img" aria-label="' + etiqueta + ': ' + fmt(pct) + ' de aciertos">' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="14"/>' +
      '<circle cx="70" cy="70" r="' + r + '" fill="none" stroke="' + color + '" stroke-width="14" stroke-linecap="round" ' +
      'stroke-dasharray="' + c.toFixed(2) + '" stroke-dashoffset="' + off.toFixed(2) + '" transform="rotate(-90 70 70)"/>' +
      '<text x="70" y="68" text-anchor="middle" class="dqe-donut-n">' + Math.round(pct) + '%</text>' +
      '<text x="70" y="88" text-anchor="middle" class="dqe-donut-l">aciertos</text></svg>';
  }

  function bloque(a) {
    return '<section class="dqe-card dqe-area" style="--c:' + a.color + '">' +
      '<h3>' + a.nombre + ' <span class="dqe-sigla">' + a.sigla + '</span></h3>' +
      donut(a.pctAciertos, a.color, a.nombre) +
      '<div class="dqe-trio">' +
      '<div><b class="ok">' + a.correctas + '</b><span>Correctas</span></div>' +
      '<div><b class="bad">' + a.incorrectas + '</b><span>Incorrectas</span></div>' +
      '<div><b class="nul">' + a.sinResponder + '</b><span>Sin responder</span></div></div>' +
      '<div class="dqe-bar" aria-hidden="true"><i style="width:' + a.pctAciertos.toFixed(1) + '%"></i></div>' +
      '<p class="dqe-note">Aciertos: ' + fmt(a.pctAciertos) + ' · Respondiste ' + a.respondidas + ' de ' + a.preguntas + '</p></section>';
  }

  function comp(a, mejor, reforzar) {
    var tag = a.id === mejor ? '<em class="dqe-tag g">Mejor desempeño</em>' : (a.id === reforzar ? '<em class="dqe-tag r">A reforzar</em>' : '');
    return '<div class="dqe-row"><div class="dqe-row-h"><span>' + a.nombre + '</span>' + tag + '<strong>' + fmt(a.pctAciertos) + '</strong></div>' +
      '<div class="dqe-bar big" style="--c:' + a.color + '"><i style="width:' + a.pctAciertos.toFixed(1) + '%"></i></div></div>';
  }

  var CSS = '.dqe{--bg:#12102a;--card:#1b1840;--tx:#eef0ff;--mut:#a5a9d6;color:var(--tx);font-family:inherit;max-width:1000px;margin:24px auto;padding:0 12px;box-sizing:border-box}' +
    '.dqe *{box-sizing:border-box}.dqe h2{font-size:1.6rem;margin:0 0 16px;letter-spacing:.01em}.dqe h3{font-size:1.05rem;margin:0 0 8px}' +
    '.dqe-card{background:var(--card);border:1px solid rgba(167,139,250,.25);border-radius:14px;padding:18px}' +
    '.dqe-sum{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-bottom:14px}' +
    '.dqe-sum .dqe-card{text-align:center;padding:14px 8px}.dqe-sum b{display:block;font-size:2rem;line-height:1.1}.dqe-sum span{font-size:.8rem;color:var(--mut)}' +
    '.dqe-areas{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px}' +
    '.dqe-area{border-top:4px solid var(--c);text-align:center}.dqe-sigla{font-size:.75rem;color:var(--c);border:1px solid var(--c);border-radius:6px;padding:1px 6px;margin-left:4px}' +
    '.dqe-donut{width:100%;max-width:170px;height:auto;display:block;margin:6px auto}.dqe-donut-n{fill:var(--tx);font-size:28px;font-weight:700}.dqe-donut-l{fill:var(--mut);font-size:11px}' +
    '.dqe-trio{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:10px 0}.dqe-trio b{display:block;font-size:1.6rem}.dqe-trio span{font-size:.75rem;color:var(--mut)}' +
    '.ok{color:#4ade80}.bad{color:#f87171}.nul{color:#fbbf24}' +
    '.dqe-bar{height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}.dqe-bar i{display:block;height:100%;background:var(--c,#38bdf8);border-radius:99px}.dqe-bar.big{height:14px}' +
    '.dqe-note{margin:8px 0 0;font-size:.8rem;color:var(--mut)}' +
    '.dqe-cmp{margin-bottom:14px}.dqe-row{margin:12px 0}.dqe-row-h{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}.dqe-row-h strong{margin-left:auto;font-size:1.2rem}' +
    '.dqe-tag{font-style:normal;font-size:.72rem;padding:2px 8px;border-radius:99px}.dqe-tag.g{background:rgba(74,222,128,.15);color:#4ade80}.dqe-tag.r{background:rgba(251,191,36,.15);color:#fbbf24}' +
    '.dqe-diag p{margin:0;font-size:1.02rem;line-height:1.55;max-width:70ch}.dqe-err{color:var(--mut);padding:12px}' +
    '@media(max-width:760px){.dqe-sum{grid-template-columns:1fr 1fr}.dqe-sum .dqe-card:first-child{grid-column:1/-1}.dqe-areas{grid-template-columns:1fr}.dqe h2{font-size:1.3rem}}';

  function render(el, r, opts) {
    opts = opts || {};
    if (!document.getElementById('dqe-css')) {
      var s = document.createElement('style'); s.id = 'dqe-css'; s.textContent = CSS; document.head.appendChild(s);
    }
    if (!r || !r.ok) { el.innerHTML = '<div class="dqe"><p class="dqe-err">No se pudo generar el análisis' + (r && r.error ? ': ' + r.error : '.') + '</p></div>'; return; }
    var t = r.total, rv = r.areas.rv, rm = r.areas.rm, d = r.diagnostico;
    var puntaje = (opts.puntaje === undefined || opts.puntaje === null) ? '' :
      '<div class="dqe-card"><b>' + opts.puntaje + (opts.puntajeMax ? '<small>/' + opts.puntajeMax + '</small>' : '') + '</b><span>Puntaje total</span></div>';
    el.innerHTML = '<div class="dqe"><h2>ANÁLISIS DE TU RENDIMIENTO</h2>' +
      '<div class="dqe-sum">' + puntaje +
      '<div class="dqe-card"><b class="ok">' + t.correctas + '</b><span>Correctas</span></div>' +
      '<div class="dqe-card"><b class="bad">' + t.incorrectas + '</b><span>Incorrectas</span></div>' +
      '<div class="dqe-card"><b class="nul">' + t.sinResponder + '</b><span>Sin responder</span></div>' +
      '<div class="dqe-card"><b>' + fmt(t.pctAciertos) + '</b><span>Aciertos sobre ' + t.preguntas + '</span></div></div>' +
      '<div class="dqe-areas">' + bloque(rv) + bloque(rm) + '</div>' +
      '<section class="dqe-card dqe-cmp"><h3>Comparación entre áreas</h3>' + comp(rv, d.mejor, d.reforzar) + comp(rm, d.mejor, d.reforzar) + '</section>' +
      '<section class="dqe-card dqe-diag"><h3>¿CÓMO FUE TU DESEMPEÑO?</h3><p>' + d.texto + '</p></section></div>';
  }

  global.PanelEstadisticas = { calcular: calcular, render: render };
})(window);
