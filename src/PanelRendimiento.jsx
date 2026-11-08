import { useEffect, useRef } from 'react';
import './panel-estadisticas.js';

export default function PanelRendimiento({ items, puntaje, puntajeMax }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!ref.current || !items) return;
    const r = window.PanelEstadisticas.calcular(items);
    window.PanelEstadisticas.render(ref.current, r, { puntaje, puntajeMax });
  }, [items, puntaje, puntajeMax]);

  return <div ref={ref} />;
}
