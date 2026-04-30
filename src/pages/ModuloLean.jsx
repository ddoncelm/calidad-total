import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { C, DESPERDICIOS } from '../lib/constants.js'
import { llamarIA, promptLean, extraerPropuestas } from '../lib/ia.js'
import { ModuloWrapper, BtnPrincipal, CargandoIA, AlertaInfo, inputStyle, labelStyle } from '../components/UI.jsx'

export default function ModuloLean({ proceso, participacion, onFinalizar }) {
  const [fase, setFase] = useState(0)
  const [procesoAnalizado, setProcesoAnalizado] = useState('')
  const [seleccionados, setSeleccionados] = useState([])
  const [detalles, setDetalles] = useState({})
  const [analisisIA, setAnalisisIA] = useState('')
  const [propiasMejoras, setPropiasMejoras] = useState('')
  const [cargando, setCargando] = useState(false)

  const toggle = (id) => setSeleccionados(prev =>
    prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
  )

  const analizarIA = async () => {
    setCargando(true); setFase(3)
    try {
      const selObjs = DESPERDICIOS.filter(d => seleccionados.includes(d.id))
      const texto = await llamarIA(promptLean({ unidad: participacion.unidad || proceso.unidad, categoria: participacion.categoria, proceso: procesoAnalizado, desperdicios: selObjs, detalles }))
      setAnalisisIA(texto)
      const props = extraerPropuestas(texto)
      await supabase.from('aportaciones_lean').insert({ participacion_id: participacion.id, proceso_id: proceso.id, proceso_analizado: procesoAnalizado, desperdicios: seleccionados, detalles_desperdicios: detalles, analisis_ia: texto, completed_at: new Date().toISOString() })
      if (props.length > 0) await supabase.from('propuestas').insert(props.map(p => ({ proceso_id: proceso.id, texto: p, origen: 'ia' })))
    } catch (e) { setAnalisisIA('Error al conectar con la IA. Inténtalo de nuevo.') }
    setCargando(false)
  }

  if (fase === 0) return (
    <ModuloWrapper titulo="Mejora Continua" subtitulo="Fase 1 · Proceso a analizar" color={C.verde} onVolver={onFinalizar} progreso={20}>
      <AlertaInfo titulo={`Proceso ${proceso.codigo}`} texto={proceso.titulo} color={C.verde} />
      <label style={labelStyle}>¿Qué proceso o flujo quieres analizar?</label>
      <textarea value={procesoAnalizado} onChange={e => setProcesoAnalizado(e.target.value)}
        placeholder="Ej: Circuito de solicitud y entrega de resultados, gestión de citas..."
        rows={4} style={{ ...inputStyle(procesoAnalizado), resize: 'vertical', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }} />
      <BtnPrincipal onClick={() => procesoAnalizado.trim() && setFase(1)} activo={procesoAnalizado.trim().length > 0} label="Continuar → Identificar desperdicios" />
    </ModuloWrapper>
  )

  if (fase === 1) return (
    <ModuloWrapper titulo="Mejora Continua" subtitulo="Fase 2 · Desperdicios" color={C.verde} onVolver={() => setFase(0)} progreso={40}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, marginBottom: '14px' }}>¿Qué desperdicios identificas en tu unidad?</div>
      {DESPERDICIOS.map(d => (
        <div key={d.id} onClick={() => toggle(d.id)} style={{ background: seleccionados.includes(d.id) ? `${C.verde}12` : C.blanco, border: `2px solid ${seleccionados.includes(d.id) ? C.verde : '#e0e0e0'}`, borderRadius: '14px', padding: '14px', marginBottom: '10px', cursor: 'pointer', transition: 'all 0.2s' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>{d.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: '700', color: C.texto }}>{d.label}</div>
              <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '2px' }}>{d.desc}</div>
            </div>
            <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: seleccionados.includes(d.id) ? C.verde : 'transparent', border: `2px solid ${seleccionados.includes(d.id) ? C.verde : '#ccc'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.blanco, fontSize: '12px', flexShrink: 0 }}>
              {seleccionados.includes(d.id) ? '✓' : ''}
            </div>
          </div>
        </div>
      ))}
      <BtnPrincipal onClick={() => seleccionados.length > 0 && setFase(2)} activo={seleccionados.length > 0} label={`Continuar con ${seleccionados.length} seleccionado(s) →`} />
    </ModuloWrapper>
  )

  if (fase === 2) return (
    <ModuloWrapper titulo="Mejora Continua" subtitulo="Fase 3 · Detalle" color={C.verde} onVolver={() => setFase(1)} progreso={60}>
      <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, marginBottom: '14px' }}>Describe brevemente cada desperdicio identificado</div>
      {DESPERDICIOS.filter(d => seleccionados.includes(d.id)).map(d => (
        <div key={d.id} style={{ marginBottom: '16px' }}>
          <label style={{ ...labelStyle, color: C.verde }}>{d.emoji} {d.label}</label>
          <textarea value={detalles[d.id] || ''} onChange={e => setDetalles(prev => ({ ...prev, [d.id]: e.target.value }))}
            placeholder="¿Cómo se manifiesta en tu unidad?" rows={3}
            style={{ ...inputStyle(detalles[d.id]), resize: 'vertical', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      ))}
      <BtnPrincipal onClick={analizarIA} label="🤖 Analizar con IA →" color={C.teal} />
    </ModuloWrapper>
  )

  if (fase === 3) return (
    <ModuloWrapper titulo="Mejora Continua" subtitulo="Fase 4 · Análisis IA" color={C.verde} onVolver={() => !cargando && setFase(2)} progreso={80}>
      {cargando ? <CargandoIA color={C.verde} mensaje={`Analizando desperdicios en ${proceso.unidad}...`} /> : (
        <div>
          <div style={{ background: `${C.verde}08`, border: `1px solid ${C.verde}20`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: C.verde, marginBottom: '12px' }}>🤖 ANÁLISIS LEAN · {proceso.unidad.toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: C.texto, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{analisisIA}</div>
          </div>
          <label style={labelStyle}>¿Quieres añadir alguna propuesta propia?</label>
          <textarea value={propiasMejoras} onChange={e => setPropiasMejoras(e.target.value)}
            placeholder="Tus propuestas adicionales..." rows={3}
            style={{ ...inputStyle(propiasMejoras), resize: 'vertical', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }} />
          <BtnPrincipal onClick={() => setFase(4)} label="Finalizar aportación →" />
        </div>
      )}
    </ModuloWrapper>
  )

  return (
    <ModuloWrapper titulo="Mejora Continua" subtitulo="¡Aportación registrada!" color={C.verde} onVolver={onFinalizar} progreso={100}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.verde, marginBottom: '8px' }}>Aportación registrada</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '24px' }}>
          Tu análisis contribuye al plan de mejora colectivo del proceso <strong>{proceso.codigo}</strong>.
        </div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver al inicio" color={C.azul} />
      </div>
    </ModuloWrapper>
  )
}
