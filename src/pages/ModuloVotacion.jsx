import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { C, DIMENSIONES_VOTO } from '../lib/constants.js'
import { BtnPrincipal, CargandoIA } from '../components/UI.jsx'

export default function ModuloVotacion({ proceso, participacion, onFinalizar }) {
  const [propuestas, setPropuestas] = useState([])
  const [indice, setIndice] = useState(0)
  const [votos, setVotos] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [finalizado, setFinalizado] = useState(false)

  useEffect(() => { cargarPropuestas() }, [])

  const cargarPropuestas = async () => {
    const { data } = await supabase.from('propuestas').select('*').eq('proceso_id', proceso.id).eq('activa', true)
    setPropuestas(data || [])
    setCargando(false)
  }

  const setVoto = (propuestaId, dimension, valor) => {
    setVotos(prev => ({ ...prev, [propuestaId]: { ...(prev[propuestaId] || {}), [dimension]: valor } }))
  }

  const propuestaActual = propuestas[indice]
  const votosActuales = propuestaActual ? (votos[propuestaActual.id] || {}) : {}
  const totalDims = DIMENSIONES_VOTO.flatMap(d => d.items).length
  const completa = Object.keys(votosActuales).length >= totalDims

  const siguiente = async () => {
    if (indice < propuestas.length - 1) { setIndice(i => i + 1); return }
    setGuardando(true)
    for (const p of propuestas) {
      const v = votos[p.id] || {}
      if (Object.keys(v).length > 0) {
        await supabase.from('votos').upsert({ propuesta_id: p.id, participacion_id: participacion.id, proceso_id: proceso.id, ...v }, { onConflict: 'propuesta_id,participacion_id' })
      }
    }
    setGuardando(false)
    setFinalizado(true)
  }

  if (cargando) return <CargandoIA color={C.teal} mensaje="Cargando propuestas..." />

  if (propuestas.length === 0) return (
    <div style={{ minHeight: '100vh', background: C.gris, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: C.texto, marginBottom: '8px' }}>Aún no hay propuestas</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '20px' }}>El coordinador todavía no ha habilitado las propuestas para votar.</div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver" color={C.azul} />
      </div>
    </div>
  )

  if (finalizado) return (
    <div style={{ minHeight: '100vh', background: C.gris, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '24px', padding: '36px 28px', textAlign: 'center', maxWidth: '380px', width: '100%' }}>
        <div style={{ fontSize: '52px', marginBottom: '16px' }}>🗳️</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.teal, marginBottom: '8px' }}>Votación completada</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '24px' }}>
          Has valorado {propuestas.length} propuesta(s). Tus votos contribuyen al ranking de prioridades del proceso <strong>{proceso.codigo}</strong>.
        </div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver al inicio" color={C.azul} />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.gris }}>
      <div style={{ background: `linear-gradient(135deg,${C.teal},${C.azul})`, padding: '16px 20px 24px', borderRadius: '0 0 24px 24px', boxShadow: `0 4px 16px ${C.teal}44` }}>
        <button onClick={onFinalizar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '10px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '10px' }}>← Volver</button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: C.blanco }}>Fase de votación</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{proceso.codigo} · Propuesta {indice + 1} de {propuestas.length}</div>
        <div style={{ marginTop: '14px', display: 'flex', gap: '4px' }}>
          {propuestas.map((_, i) => (
            <div key={i} style={{ flex: 1, height: '4px', borderRadius: '4px', background: i < indice ? C.blanco : i === indice ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.2)', transition: 'background 0.3s' }} />
          ))}
        </div>
      </div>

      <div style={{ padding: '16px' }}>
        <div style={{ background: C.blanco, borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: `4px solid ${C.teal}` }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.teal, letterSpacing: '0.5px', marginBottom: '8px' }}>PROPUESTA {indice + 1}</div>
          <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, lineHeight: '1.5' }}>{propuestaActual?.texto}</div>
          <div style={{ marginTop: '12px', fontSize: '11px', color: C.textoSuave }}>{Object.keys(votosActuales).length} / {totalDims} dimensiones valoradas</div>
          <div style={{ marginTop: '6px', height: '3px', background: C.grisMedio, borderRadius: '4px' }}>
            <div style={{ height: '100%', background: C.teal, borderRadius: '4px', width: `${(Object.keys(votosActuales).length / totalDims) * 100}%`, transition: 'width 0.3s' }} />
          </div>
        </div>

        {DIMENSIONES_VOTO.map(bloque => (
          <div key={bloque.bloque} style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: '13px', fontWeight: '700', color: bloque.color, marginBottom: '12px' }}>{bloque.emoji} {bloque.label}</div>
            {bloque.items.map(item => (
              <div key={item.key} style={{ marginBottom: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: C.texto, marginBottom: '4px' }}>{item.label}</div>
                <div style={{ fontSize: '11px', color: C.textoSuave, marginBottom: '8px' }}>{item.desc}</div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {[1, 2, 3].map(val => (
                    <button key={val} onClick={() => setVoto(propuestaActual.id, item.key, val)} style={{
                      flex: 1, padding: '10px 6px',
                      border: `2px solid ${votosActuales[item.key] === val ? bloque.color : '#e0e0e0'}`,
                      borderRadius: '10px',
                      background: votosActuales[item.key] === val ? `${bloque.color}18` : C.blanco,
                      color: votosActuales[item.key] === val ? bloque.color : '#aaa',
                      fontWeight: '700', fontSize: '14px', cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif", transition: 'all 0.15s',
                    }}>
                      {val === 1 ? '🔴' : val === 2 ? '🟡' : '🟢'}
                      <div style={{ fontSize: '10px', marginTop: '2px' }}>{val === 1 ? 'Bajo' : val === 2 ? 'Medio' : 'Alto'}</div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}

        <BtnPrincipal onClick={siguiente} activo={completa && !guardando}
          label={guardando ? 'Guardando...' : indice < propuestas.length - 1 ? 'Siguiente propuesta →' : '✅ Finalizar votación'}
          color={C.teal} />
        {!completa && <div style={{ textAlign: 'center', fontSize: '12px', color: C.textoSuave, marginTop: '8px' }}>Valora todas las dimensiones para continuar</div>}
      </div>
    </div>
  )
}
