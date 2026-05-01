import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { C } from '../lib/constants.js'
import { Isologo, BtnPrincipal, EstadoBadge, AlertaInfo } from '../components/UI.jsx'
import ModuloLean from './ModuloLean.jsx'
import ModuloRCA from './ModuloRCA.jsx'
import ModuloAMFE from './ModuloAMFE.jsx'
import ModuloVotacion from './ModuloVotacion.jsx'

export default function PaginaParticipante({ sesion, onLogout }) {
  const [proceso, setProceso] = useState(null)
  const [participacion, setParticipacion] = useState(null)
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modulo, setModulo] = useState(null)
  const [accionesPlан, setAccionesPlан] = useState([])
  const [comentarios, setComentarios] = useState({})
  const [propias, setPropias] = useState([{ descripcion: '', responsable: '' }, { descripcion: '', responsable: '' }])
  const [enviandoComentarios, setEnviandoComentarios] = useState(false)
  const [comentariosEnviados, setComentariosEnviados] = useState(false)
  const [yaAporto, setYaAporto] = useState(false)
  const [yaVoto, setYaVoto] = useState(false)

  useEffect(() => { inicializar() }, [])

  const inicializar = async () => {
    setCargando(true); setError('')
    const { data: proc } = await supabase.from('procesos').select('*').eq('codigo', sesion.codigo).eq('archivado', false).single()
    if (!proc) { setError(`No se encontró ningún proceso activo con el código "${sesion.codigo}". Verifica con tu coordinador.`); setCargando(false); return }

    // Validar PIN si hay lista blanca
    const { data: pinesPermitidos } = await supabase.from('pines_permitidos').select('*').eq('proceso_id', proc.id)
    if (pinesPermitidos && pinesPermitidos.length > 0) {
      const encontrado = pinesPermitidos.find(p => p.pin === sesion.pin)
      if (!encontrado) { setError(`El PIN ${sesion.pin} no tiene acceso a este proceso. Contacta con el coordinador.`); setCargando(false); return }
      if (encontrado.categoria) sesion.categoria = encontrado.categoria
    }

    setProceso(proc)
    const { data: partExistente } = await supabase.from('participaciones').select('*').eq('proceso_id', proc.id).eq('pin', sesion.pin).single()
    let part = partExistente
    if (!part) {
      const { data: nuevaPart } = await supabase.from('participaciones').insert({ proceso_id: proc.id, pin: sesion.pin, categoria: sesion.categoria }).select().single()
      part = nuevaPart
    }
    setParticipacion(part)

    const tablaAport = proc.tipo === 'lean' ? 'aportaciones_lean' : proc.tipo === 'rca' ? 'aportaciones_rca' : 'aportaciones_amfe'
    const { data: aport } = await supabase.from(tablaAport).select('id').eq('participacion_id', part.id).limit(1)
    setYaAporto(!!(aport && aport.length > 0))

    const { data: voto } = await supabase.from('votos').select('id').eq('participacion_id', part.id).eq('proceso_id', proc.id).limit(1)
    setYaVoto(!!(voto && voto.length > 0))
    // Cargar acciones si está en plan_accion o seguimiento
    if (['plan_accion', 'seguimiento', 'cerrado'].includes(proc.estado)) {
      const { data: acts } = await supabase
        .from('acciones')
        .select('*')
        .eq('proceso_id', proc.id)
        .order('created_at')
      setAccionesPlан(acts || [])
      // Verificar si ya envió comentarios
      if (part) {
        const { data: props } = await supabase
          .from('propuestas_accion_participantes')
          .select('id')
          .eq('participacion_id', part.id)
          .eq('proceso_id', proc.id)
          .limit(1)
        setComentariosEnviados(!!(props && props.length > 0))
      }
    }
    setCargando(false)
  }

  const enviarComentariosYPropuestas = async () => {
    if (!participacion?.id || !proceso?.id) return
    setEnviandoComentarios(true)
    try {
      // Guardar comentarios en cada acción
      for (const [accionId, texto] of Object.entries(comentarios)) {
        if (texto.trim()) {
          const { data: accion } = await supabase.from('acciones').select('comentarios_participantes').eq('id', accionId).single()
          const previo = accion?.comentarios_participantes || ''
          const nuevo = previo ? `${previo}
[${participacion.categoria}]: ${texto}` : `[${participacion.categoria}]: ${texto}`
          await supabase.from('acciones').update({ comentarios_participantes: nuevo }).eq('id', accionId)
        }
      }
      // Guardar propuestas propias
      for (const p of propias) {
        if (p.descripcion.trim()) {
          await supabase.from('propuestas_accion_participantes').insert({
            proceso_id: proceso.id,
            participacion_id: participacion.id,
            descripcion: p.descripcion.trim(),
            responsable: p.responsable.trim() || null,
          })
        }
      }
      setComentariosEnviados(true)
    } catch (e) { console.error(e) }
    setEnviandoComentarios(false)
  }

  const colorTipo = proceso?.tipo === 'lean' ? C.verde : proceso?.tipo === 'rca' ? C.rojo : C.morado
  const labelTipo = proceso?.tipo === 'lean' ? 'Mejora Continua' : proceso?.tipo === 'rca' ? 'Suceso Centinela' : 'Análisis AMFE'

  if (modulo === 'lean') return <ModuloLean proceso={proceso} participacion={participacion} onFinalizar={() => { setModulo(null); inicializar() }} />
  if (modulo === 'rca') return <ModuloRCA proceso={proceso} participacion={participacion} onFinalizar={() => { setModulo(null); inicializar() }} />
  if (modulo === 'amfe') return <ModuloAMFE proceso={proceso} participacion={participacion} onFinalizar={() => { setModulo(null); inicializar() }} />
  if (modulo === 'votacion') return <ModuloVotacion proceso={proceso} participacion={participacion} onFinalizar={() => { setModulo(null); inicializar() }} />

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.gris} 0%,#e8f5e8 60%,${C.grisMedio} 100%)` }}>
      <div style={{ background: `linear-gradient(135deg,${C.teal},${C.azul})`, padding: '20px 20px 28px', borderRadius: '0 0 28px 28px', boxShadow: `0 4px 20px ${C.teal}44` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '22px', color: C.blanco }}>Calidad<span style={{ opacity: 0.7 }}>Total</span></div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', letterSpacing: '1px' }}>PARTICIPANTE · PIN {sesion.pin}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Isologo size={36} />
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Salir</button>
          </div>
        </div>
        <div style={{ marginTop: '16px', background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px 14px' }}>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>Tu categoría profesional</div>
          <div style={{ fontSize: '14px', fontWeight: '700', color: C.blanco, marginTop: '2px' }}>{sesion.categoria}</div>
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        {cargando && <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>Cargando proceso...</div>}

        {!cargando && error && (
          <div style={{ background: `${C.rojo}12`, border: `1px solid ${C.rojo}30`, borderRadius: '16px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>❌</div>
            <div style={{ fontSize: '14px', color: C.rojo, lineHeight: '1.6', marginBottom: '20px' }}>{error}</div>
            <BtnPrincipal onClick={onLogout} label="← Volver al inicio" color={C.azul} />
          </div>
        )}

        {!cargando && proceso && participacion && (
          <>
            <div style={{ background: C.blanco, borderRadius: '18px', padding: '18px', marginBottom: '20px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderTop: `4px solid ${colorTipo}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: '700', color: colorTipo, letterSpacing: '0.5px' }}>{proceso.codigo} · {labelTipo}</div>
                  <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '16px', color: C.texto, marginTop: '2px' }}>{proceso.titulo}</div>
                  <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '4px' }}>📍 {proceso.unidad}</div>
                </div>
                <EstadoBadge estado={proceso.estado} />
              </div>
              {proceso.descripcion && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '10px', lineHeight: '1.5', paddingTop: '10px', borderTop: `1px solid ${C.grisMedio}` }}>{proceso.descripcion}</div>}
            </div>

            {proceso.estado === 'aportaciones' && (
              yaAporto
                ? <AlertaInfo titulo="✅ Aportación registrada" texto="Ya has completado tu aportación. Cuando el coordinador abra la siguiente fase te lo indicaremos aquí." color={colorTipo} />
                : <>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, marginBottom: '12px' }}>Tu aportación está pendiente</div>
                    <BtnPrincipal onClick={() => setModulo(proceso.tipo)}
                      label={proceso.tipo === 'lean' ? '📊 Completar análisis Lean' : proceso.tipo === 'rca' ? '🔴 Completar análisis RCA' : '🔬 Completar análisis AMFE'}
                      color={colorTipo} />
                  </>
            )}

            {proceso.estado === 'puntuacion' && proceso.tipo === 'amfe' && (
              yaAporto
                ? <AlertaInfo titulo="✅ Puntuación completada" texto="Ya has completado tu análisis AMFE. El coordinador procesará los resultados." color={C.morado} />
                : <>
                    <AlertaInfo titulo="🔬 Fase de puntuación AMFE" texto="El coordinador ha habilitado la fase de puntuación S/O/D. Completa tu análisis." color={C.morado} />
                    <BtnPrincipal onClick={() => setModulo('amfe')} label="🔬 Completar puntuación AMFE" color={C.morado} />
                  </>
            )}

            {proceso.estado === 'votacion' && (
              yaVoto
                ? <AlertaInfo titulo="✅ Votación completada" texto="Ya has valorado todas las propuestas. El coordinador verá el ranking en tiempo real." color={C.teal} />
                : <>
                    <AlertaInfo titulo="🗳️ Fase de votación abierta" texto="Valora las propuestas de mejora con la matriz de 6 dimensiones." color={C.teal} />
                    <BtnPrincipal onClick={() => setModulo('votacion')} label="🗳️ Ir a votar propuestas" color={C.teal} />
                  </>
            )}

            {proceso.estado === 'plan_accion' && (
              comentariosEnviados ? (
                <AlertaInfo titulo="✅ Comentarios y propuestas enviados" texto="El coordinador revisará tus aportaciones al plan de acción. Gracias por tu participación." color={C.verde} />
              ) : (
                <div>
                  {accionesPlан.length > 0 && (
                    <>
                      <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, marginBottom: '12px' }}>
                        📋 Plan de acción propuesto — revisa y comenta
                      </div>
                      {accionesPlан.map((a, i) => (
                        <div key={i} style={{ background: C.blanco, borderRadius: '14px', padding: '14px', marginBottom: '10px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `3px solid ${colorTipo}` }}>
                          <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto, marginBottom: '6px' }}>{a.descripcion}</div>
                          {a.responsable && <div style={{ fontSize: '12px', color: C.textoSuave }}>👤 {a.responsable}</div>}
                          {a.plazo && <div style={{ fontSize: '12px', color: C.textoSuave }}>📅 {new Date(a.plazo).toLocaleDateString('es-ES')}</div>}
                          {a.indicador && <div style={{ fontSize: '12px', color: C.textoSuave }}>📊 {a.indicador}</div>}
                          <div style={{ marginTop: '10px' }}>
                            <div style={{ fontSize: '11px', fontWeight: '700', color: C.textoSuave, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '5px' }}>Tu comentario (opcional)</div>
                            <textarea
                              value={comentarios[a.id] || ''}
                              onChange={e => setComentarios(prev => ({ ...prev, [a.id]: e.target.value }))}
                              placeholder="¿Tienes algún comentario sobre esta acción?"
                              rows={2}
                              style={{ width: '100%', padding: '10px', border: `1px solid ${C.grisMedio}`, borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", resize: 'vertical', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                        </div>
                      ))}
                      <div style={{ marginTop: '16px', marginBottom: '8px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: C.texto, marginBottom: '4px' }}>¿Quieres proponer alguna acción adicional?</div>
                        <div style={{ fontSize: '12px', color: C.textoSuave, marginBottom: '12px' }}>Máximo 2 propuestas. El coordinador decidirá si incorporarlas.</div>
                        {propias.map((p, i) => (
                          <div key={i} style={{ background: C.blanco, borderRadius: '12px', padding: '12px', marginBottom: '10px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', border: `1px solid ${C.grisMedio}` }}>
                            <div style={{ fontSize: '12px', fontWeight: '700', color: C.textoSuave, marginBottom: '6px' }}>Propuesta {i + 1} (opcional)</div>
                            <input value={p.descripcion} onChange={e => setPropias(prev => prev.map((x, j) => j === i ? { ...x, descripcion: e.target.value } : x))}
                              placeholder="Descripción de la acción propuesta..." style={{ width: '100%', padding: '10px', border: `1px solid ${C.grisMedio}`, borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", marginBottom: '6px', boxSizing: 'border-box', outline: 'none' }} />
                            <input value={p.responsable} onChange={e => setPropias(prev => prev.map((x, j) => j === i ? { ...x, responsable: e.target.value } : x))}
                              placeholder="Responsable sugerido (opcional)..." style={{ width: '100%', padding: '10px', border: `1px solid ${C.grisMedio}`, borderRadius: '8px', fontSize: '13px', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box', outline: 'none' }} />
                          </div>
                        ))}
                      </div>
                      <BtnPrincipal onClick={enviarComentariosYPropuestas} label={enviandoComentarios ? 'Enviando...' : 'Enviar comentarios y propuestas'} activo={!enviandoComentarios} color={colorTipo} />
                    </>
                  )}
                  {accionesPlан.length === 0 && (
                    <AlertaInfo titulo="📋 Plan de acción en elaboración" texto="El coordinador está elaborando el plan de acción. Cuando esté disponible podrás revisarlo y añadir comentarios." color={C.azul} />
                  )}
                </div>
              )
            )}
            {proceso.estado === 'seguimiento' && (
              <div>
                <AlertaInfo titulo="📊 Fase de seguimiento activa" texto="El plan de acción está en marcha." color={C.verdeClaro} />
                {accionesPlан.length > 0 && accionesPlан.map((a, i) => (
                  <div key={i} style={{ background: C.blanco, borderRadius: '12px', padding: '12px', marginBottom: '8px', boxShadow: '0 2px 6px rgba(0,0,0,0.04)', borderLeft: `3px solid ${{ pendiente: C.naranja, en_curso: C.azul, completada: C.verde }[a.estado] || C.naranja}` }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto }}>{a.descripcion}</div>
                    {a.responsable && <div style={{ fontSize: '12px', color: C.textoSuave }}>👤 {a.responsable}</div>}
                    <div style={{ marginTop: '6px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '700', background: `${{ pendiente: C.naranja, en_curso: C.azul, completada: C.verde }[a.estado] || C.naranja}18`, color: { pendiente: C.naranja, en_curso: C.azul, completada: C.verde }[a.estado] || C.naranja }}>{a.estado?.replace('_', ' ')}</span></div>
                  </div>
                ))}
              </div>
            )}
            {proceso.estado === 'cerrado' && <AlertaInfo titulo="✅ Proceso finalizado" texto="Gracias por tu participación en la mejora de tu unidad." color="#999" />}
          </>
        )}
      </div>
    </div>
  )
}
