import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { C } from '../lib/constants.js'
import { llamarIA, promptAMFEFusion } from '../lib/ia.js'
import { BtnPrincipal, CargandoIA, AlertaInfo, inputStyle } from '../components/UI.jsx'

export default function FusionAMFE({ proceso, aportaciones, onFinalizar }) {
  const [fase, setFase] = useState(0) // 0=inicio, 1=analizando, 2=revision, 3=guardando, 4=completado
  const [grupos, setGrupos] = useState([])
  const [independientes, setIndependientes] = useState([])
  const [decisiones, setDecisiones] = useState({}) // grupoIdx -> { accion: 'fusionar'|'separar', texto, efecto, causa }
  const [error, setError] = useState('')

  const aportacionesMap = Object.fromEntries(aportaciones.map(a => [a.id, a]))

  const analizarConIA = async () => {
    setFase(1)
    setError('')
    try {
      const texto = await llamarIA(promptAMFEFusion({ proceso, aportaciones }), 2000)
      // Limpiar respuesta y parsear JSON
      const limpio = texto.replace(/```json|```/g, '').trim()
      const resultado = JSON.parse(limpio)

      // Inicializar decisiones con la propuesta de la IA
      const decisionesIniciales = {}
      resultado.grupos.forEach((g, i) => {
        decisionesIniciales[i] = {
          accion: 'fusionar',
          texto: g.modo_fusionado,
          efecto: g.efecto || '',
          causa: g.causa || '',
          razon: g.razon || '',
          ids: g.ids,
        }
      })

      setGrupos(resultado.grupos || [])
      setIndependientes(resultado.independientes || [])
      setDecisiones(decisionesIniciales)
      setFase(2)
    } catch (e) {
      setError('Error al analizar con IA: ' + e.message)
      setFase(0)
    }
  }

  const guardarDecisiones = async () => {
    setFase(3)
    try {
      // 1. Guardar grupos que el coordinador decidió fusionar
      for (const [idx, dec] of Object.entries(decisiones)) {
        if (dec.accion !== 'fusionar') continue
        const ids = dec.ids
        const aports = ids.map(id => aportacionesMap[id]).filter(Boolean)
        if (aports.length === 0) continue

        const nprMedio = aports.reduce((s, a) => s + (a.npr || 0), 0) / aports.length
        const sMedio = aports.reduce((s, a) => s + (a.severidad || 0), 0) / aports.length
        const oMedio = aports.reduce((s, a) => s + (a.ocurrencia || 0), 0) / aports.length
        const dMedio = aports.reduce((s, a) => s + (a.detectabilidad || 0), 0) / aports.length

        const { data: fusion, error: errF } = await supabase
          .from('fusiones_amfe')
          .insert({
            proceso_id: proceso.id,
            modo_fusionado: dec.texto,
            efecto: dec.efecto,
            causa: dec.causa,
            ids_originales: ids,
            npr_medio: Math.round(nprMedio * 100) / 100,
            severidad_media: Math.round(sMedio * 100) / 100,
            ocurrencia_media: Math.round(oMedio * 100) / 100,
            detectabilidad_media: Math.round(dMedio * 100) / 100,
            n_profesionales: aports.length,
          })
          .select()
          .single()

        if (errF) { setError('Error guardando fusión: ' + errF.message); setFase(2); return }

        // Marcar aportaciones originales como fusionadas
        await supabase.from('aportaciones_amfe').update({ fusion_id: fusion.id }).in('id', ids)
      }

      // 2. Los independientes que el coordinador mantuvo separados: crear fusión individual
      const todosIdsEnGrupos = Object.values(decisiones)
        .filter(d => d.accion === 'fusionar')
        .flatMap(d => d.ids)

      // Aportaciones no fusionadas (independientes o grupos rechazados)
      const noFusionados = aportaciones.filter(a =>
        !todosIdsEnGrupos.includes(a.id)
      )

      for (const a of noFusionados) {
        const { data: fusion } = await supabase
          .from('fusiones_amfe')
          .insert({
            proceso_id: proceso.id,
            modo_fusionado: a.modo_fallo,
            efecto: a.efecto,
            causa: a.causa,
            ids_originales: [a.id],
            npr_medio: a.npr,
            severidad_media: a.severidad,
            ocurrencia_media: a.ocurrencia,
            detectabilidad_media: a.detectabilidad,
            n_profesionales: 1,
          })
          .select()
          .single()
        if (fusion) {
          await supabase.from('aportaciones_amfe').update({ fusion_id: fusion.id }).eq('id', a.id)
        }
      }

      setFase(4)
    } catch (e) {
      setError('Error inesperado: ' + e.message)
      setFase(2)
    }
  }

  const updateDecision = (idx, campo, valor) => {
    setDecisiones(prev => ({
      ...prev,
      [idx]: { ...prev[idx], [campo]: valor }
    }))
  }

  // FASE 0: Inicio
  if (fase === 0) return (
    <div style={{ padding: '20px' }}>
      <div style={{ background: C.blanco, borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: C.morado, marginBottom: '8px' }}>
          🤖 Análisis de duplicados con IA
        </div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '12px' }}>
          La IA analizará los <strong>{aportaciones.length} modos de fallo</strong> registrados por los participantes e identificará cuáles son esencialmente el mismo fallo expresado con palabras diferentes.
        </div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6' }}>
          Después podrás revisar cada grupo propuesto y decidir si fusionarlos o mantenerlos separados. El NPR final se calculará como la media de los modos fusionados.
        </div>
      </div>
      {error && <AlertaInfo titulo="⚠ Error" texto={error} color={C.rojo} />}
      <BtnPrincipal onClick={analizarConIA} label="🤖 Analizar duplicados con IA" color={C.morado} />
      <BtnPrincipal onClick={onFinalizar} label="← Cancelar" color="#999" style={{ marginTop: '8px' }} />
    </div>
  )

  // FASE 1: Analizando
  if (fase === 1) return (
    <div style={{ padding: '20px' }}>
      <CargandoIA color={C.morado} mensaje="Analizando modos de fallo similares..." />
    </div>
  )

  // FASE 2: Revisión de grupos
  if (fase === 2) return (
    <div style={{ padding: '0 0 40px' }}>
      <div style={{ background: `linear-gradient(135deg,${C.morado},${C.moradoClaro})`, padding: '16px 20px 20px', borderRadius: '0 0 20px 20px', marginBottom: '16px' }}>
        <button onClick={onFinalizar} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '10px' }}>← Cancelar</button>
        <div style={{ fontSize: '18px', fontWeight: '700', color: C.blanco, fontFamily: "'DM Serif Display',serif" }}>Revisión de grupos</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '4px' }}>
          {grupos.length} grupo(s) propuesto(s) · {independientes.length} modo(s) independiente(s)
        </div>
      </div>

      <div style={{ padding: '0 16px' }}>
        <AlertaInfo
          titulo="Cómo funciona"
          texto="Para cada grupo decide si fusionar (se calculará la media del NPR) o mantener separados. Puedes editar el texto del modo fusionado antes de confirmar."
          color={C.morado}
        />

        {grupos.length === 0 && (
          <AlertaInfo titulo="Sin duplicados detectados" texto="La IA no ha encontrado modos de fallo suficientemente similares para fusionar. Todos se mantendrán como modos independientes." color={C.verde} />
        )}

        {grupos.map((g, idx) => {
          const dec = decisiones[idx] || {}
          const aports = (g.ids || []).map(id => aportacionesMap[id]).filter(Boolean)
          const nprMedio = aports.length > 0
            ? Math.round(aports.reduce((s, a) => s + (a.npr || 0), 0) / aports.length)
            : 0

          return (
            <div key={idx} style={{
              background: C.blanco, borderRadius: '16px', padding: '16px',
              marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              borderTop: `4px solid ${dec.accion === 'fusionar' ? C.morado : '#ccc'}`,
            }}>
              {/* Cabecera del grupo */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.morado }}>
                  GRUPO {idx + 1} · {aports.length} modo(s) similares
                </div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: nprMedio >= 100 ? C.rojo : C.morado }}>
                  NPR medio: {nprMedio}
                </div>
              </div>

              {/* Modos originales */}
              <div style={{ background: C.gris, borderRadius: '10px', padding: '10px', marginBottom: '12px' }}>
                <div style={{ fontSize: '11px', fontWeight: '700', color: C.textoSuave, marginBottom: '8px', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                  Modos originales de los participantes
                </div>
                {aports.map((a, i) => (
                  <div key={i} style={{ fontSize: '12px', color: C.texto, padding: '6px 0', borderBottom: i < aports.length - 1 ? `1px solid ${C.grisMedio}` : 'none' }}>
                    <span style={{ color: C.morado, fontWeight: '700' }}>·</span> {a.modo_fallo}
                    <span style={{ color: C.textoSuave, marginLeft: '8px' }}>NPR {a.npr} (S:{a.severidad}·O:{a.ocurrencia}·D:{a.detectabilidad})</span>
                  </div>
                ))}
              </div>

              {/* Razón de la IA */}
              {g.razon && (
                <div style={{ fontSize: '11px', color: C.textoSuave, background: `${C.morado}08`, borderRadius: '8px', padding: '8px', marginBottom: '12px', fontStyle: 'italic' }}>
                  💡 IA: {g.razon}
                </div>
              )}

              {/* Decisión del coordinador */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  onClick={() => updateDecision(idx, 'accion', 'fusionar')}
                  style={{
                    flex: 1, padding: '10px', border: `2px solid ${dec.accion === 'fusionar' ? C.morado : '#e0e0e0'}`,
                    borderRadius: '10px', background: dec.accion === 'fusionar' ? `${C.morado}15` : C.blanco,
                    color: dec.accion === 'fusionar' ? C.morado : C.textoSuave,
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  }}>
                  ✅ Fusionar
                </button>
                <button
                  onClick={() => updateDecision(idx, 'accion', 'separar')}
                  style={{
                    flex: 1, padding: '10px', border: `2px solid ${dec.accion === 'separar' ? C.rojo : '#e0e0e0'}`,
                    borderRadius: '10px', background: dec.accion === 'separar' ? `${C.rojo}15` : C.blanco,
                    color: dec.accion === 'separar' ? C.rojo : C.textoSuave,
                    fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif",
                  }}>
                  ❌ Mantener separados
                </button>
              </div>

              {/* Edición del modo fusionado */}
              {dec.accion === 'fusionar' && (
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: C.morado, letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Modo fusionado (editable)
                  </div>
                  <input
                    value={dec.texto}
                    onChange={e => updateDecision(idx, 'texto', e.target.value)}
                    placeholder="Texto del modo de fallo consolidado..."
                    style={{ ...inputStyle(dec.texto), marginBottom: '8px' }}
                  />
                  <input
                    value={dec.efecto}
                    onChange={e => updateDecision(idx, 'efecto', e.target.value)}
                    placeholder="Efecto consolidado..."
                    style={{ ...inputStyle(dec.efecto), marginBottom: '8px' }}
                  />
                  <input
                    value={dec.causa}
                    onChange={e => updateDecision(idx, 'causa', e.target.value)}
                    placeholder="Causa raíz común..."
                    style={inputStyle(dec.causa)}
                  />
                </div>
              )}
            </div>
          )
        })}

        {/* Independientes */}
        {independientes.length > 0 && (
          <div style={{ background: C.blanco, borderRadius: '14px', padding: '14px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderTop: `4px solid ${C.verde}` }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: C.verde, marginBottom: '10px' }}>
              ✓ Modos únicos — se mantienen sin cambios ({independientes.length})
            </div>
            {independientes.map(id => {
              const a = aportacionesMap[id]
              if (!a) return null
              return (
                <div key={id} style={{ fontSize: '12px', color: C.texto, padding: '6px 0', borderBottom: `1px solid ${C.grisMedio}` }}>
                  <span style={{ color: C.verde, fontWeight: '700' }}>·</span> {a.modo_fallo}
                  <span style={{ color: C.textoSuave, marginLeft: '8px' }}>NPR {a.npr}</span>
                </div>
              )
            })}
          </div>
        )}

        {error && <AlertaInfo titulo="⚠ Error" texto={error} color={C.rojo} />}

        <BtnPrincipal
          onClick={guardarDecisiones}
          label="Confirmar decisiones y guardar ranking →"
          color={C.morado}
        />
      </div>
    </div>
  )

  // FASE 3: Guardando
  if (fase === 3) return (
    <div style={{ padding: '20px' }}>
      <CargandoIA color={C.morado} mensaje="Guardando decisiones de fusión..." />
    </div>
  )

  // FASE 4: Completado
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '52px', marginBottom: '16px' }}>✅</div>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.morado, marginBottom: '8px' }}>
        Fusión completada
      </div>
      <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '24px' }}>
        El ranking NPR ahora muestra los modos de fallo consolidados con sus puntuaciones medias.
      </div>
      <BtnPrincipal onClick={onFinalizar} label="← Ver ranking NPR" color={C.morado} />
    </div>
  )
}
