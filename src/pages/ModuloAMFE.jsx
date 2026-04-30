import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { C, AMFE_SEVERIDAD, AMFE_OCURRENCIA, AMFE_DETECTABILIDAD } from '../lib/constants.js'
import { ModuloWrapper, BtnPrincipal, CargandoIA, AlertaInfo, inputStyle, labelStyle } from '../components/UI.jsx'

export default function ModuloAMFE({ proceso, participacion, onFinalizar }) {
  const [fase, setFase] = useState(0)
  const [pasos, setPasos] = useState([])
  const [indPaso, setIndPaso] = useState(0)
  const [modosFallo, setModosFallo] = useState({})
  const [puntuaciones, setPuntuaciones] = useState({})
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState('')
  const [yaAporto, setYaAporto] = useState(false)

  useEffect(() => { cargarPasos() }, [])

  const cargarPasos = async () => {
    const { data } = await supabase
      .from('pasos_amfe')
      .select('*')
      .eq('proceso_id', proceso.id)
      .order('orden')
    setPasos(data || [])

    if (data && data.length > 0 && participacion?.id) {
      const { data: aport } = await supabase
        .from('aportaciones_amfe')
        .select('id')
        .eq('participacion_id', participacion.id)
        .eq('proceso_id', proceso.id)
        .limit(1)
      setYaAporto(!!(aport && aport.length > 0))
    }
    setCargando(false)
  }

  const pasoActual = pasos[indPaso]
  const modosDelPaso = modosFallo[pasoActual?.id] || []

  const addModoFallo = (pasoId) => {
    setModosFallo(prev => ({
      ...prev,
      [pasoId]: [...(prev[pasoId] || []), { modo: '', efecto: '', causa: '' }]
    }))
  }

  const updateModo = (pasoId, idx, campo, valor) => {
    setModosFallo(prev => {
      const arr = [...(prev[pasoId] || [])]
      arr[idx] = { ...arr[idx], [campo]: valor }
      return { ...prev, [pasoId]: arr }
    })
  }

  const removeModo = (pasoId, idx) => {
    setModosFallo(prev => {
      const arr = [...(prev[pasoId] || [])]
      arr.splice(idx, 1)
      return { ...prev, [pasoId]: arr }
    })
  }

  const setPuntuacion = (pasoId, modoIdx, dim, valor) => {
    const key = `${pasoId}_${modoIdx}`
    setPuntuaciones(prev => ({ ...prev, [key]: { ...(prev[key] || {}), [dim]: valor } }))
  }

  const getPuntuacion = (pasoId, modoIdx, dim) =>
    puntuaciones[`${pasoId}_${modoIdx}`]?.[dim] || 0

  const getNPR = (pasoId, modoIdx) => {
    const p = puntuaciones[`${pasoId}_${modoIdx}`] || {}
    return (p.s || 0) * (p.o || 0) * (p.d || 0)
  }

  // BUG FIX 1: resetear índice a 0 al pasar a fase de puntuación
  const irAFase2 = () => {
    setIndPaso(0)
    setFase(2)
  }

  const guardarTodo = async () => {
    setGuardando(true)
    setErrorGuardado('')

    try {
      // BUG FIX 2: verificar que participacion.id existe
      if (!participacion?.id) {
        setErrorGuardado('Error: ID de participación no disponible. Vuelve al inicio e inténtalo de nuevo.')
        setGuardando(false)
        return
      }

      const inserts = []
      for (const paso of pasos) {
        const modos = modosFallo[paso.id] || []
        for (let idx = 0; idx < modos.length; idx++) {
          const m = modos[idx]
          if (!m.modo.trim()) continue
          const p = puntuaciones[`${paso.id}_${idx}`] || {}
          inserts.push({
            participacion_id: participacion.id,
            proceso_id: proceso.id,
            paso_id: paso.id,
            modo_fallo: m.modo.trim(),
            efecto: m.efecto?.trim() || '',
            causa: m.causa?.trim() || '',
            severidad: Number(p.s) || 1,
            ocurrencia: Number(p.o) || 1,
            detectabilidad: Number(p.d) || 1,
          })
        }
      }

      if (inserts.length === 0) {
        setErrorGuardado('No hay modos de fallo con datos completos para guardar.')
        setGuardando(false)
        return
      }

      // BUG FIX 3: insertar de uno en uno para aislar errores
      let errores = 0
      for (const registro of inserts) {
        const { error } = await supabase.from('aportaciones_amfe').insert(registro)
        if (error) {
          console.error('Error insertando registro AMFE:', error, registro)
          errores++
        }
      }

      if (errores > 0) {
        setErrorGuardado(`Se produjeron ${errores} errores al guardar. Contacta con el coordinador.`)
        setGuardando(false)
        return
      }

      setFase(3)
    } catch (e) {
      setErrorGuardado(`Error inesperado: ${e.message}`)
    }
    setGuardando(false)
  }

  if (cargando) return <CargandoIA color={C.morado} mensaje="Cargando pasos del proceso..." />

  if (pasos.length === 0) return (
    <div style={{ minHeight: '100vh', background: C.gris, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>⏳</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: C.texto, marginBottom: '8px' }}>Proceso no configurado</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '20px' }}>El coordinador aún no ha definido los pasos del proceso AMFE.</div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver" color={C.azul} />
      </div>
    </div>
  )

  if (yaAporto) return (
    <div style={{ minHeight: '100vh', background: C.gris, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '20px', padding: '32px', textAlign: 'center', maxWidth: '360px' }}>
        <div style={{ fontSize: '40px', marginBottom: '12px' }}>✅</div>
        <div style={{ fontSize: '16px', fontWeight: '700', color: C.morado, marginBottom: '8px' }}>Ya has completado tu aportación AMFE</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '20px' }}>Tu análisis ha sido registrado correctamente.</div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver al inicio" color={C.azul} />
      </div>
    </div>
  )

  // FASE 0: Introducción
  if (fase === 0) return (
    <ModuloWrapper titulo="Análisis AMFE" subtitulo="Introducción al análisis" color={C.morado} onVolver={onFinalizar} progreso={5}>
      <AlertaInfo titulo={`Proceso ${proceso.codigo}`} texto={proceso.titulo} color={C.morado} />
      <div style={{ background: C.blanco, borderRadius: '16px', padding: '20px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: C.texto, marginBottom: '12px' }}>¿Cómo funciona este análisis?</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.7' }}>
          El AMFE analiza cada paso del proceso para identificar qué podría fallar <strong>antes de que ocurra</strong>.<br/><br/>
          Para cada paso vas a:<br/>
          <strong>1.</strong> Identificar modos de fallo potenciales<br/>
          <strong>2.</strong> Describir el efecto y la causa<br/>
          <strong>3.</strong> Puntuar Severidad (S), Ocurrencia (O) y Detectabilidad (D) del 1 al 10<br/><br/>
          La app calculará el <strong>NPR = S × O × D</strong> automáticamente.
        </div>
      </div>
      <div style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '10px' }}>📋 Pasos del proceso ({pasos.length})</div>
        {pasos.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < pasos.length - 1 ? `1px solid ${C.grisMedio}` : 'none' }}>
            <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: `${C.morado}18`, color: C.morado, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{i + 1}</div>
            <div style={{ fontSize: '13px', color: C.texto }}>{p.descripcion}</div>
          </div>
        ))}
      </div>
      <BtnPrincipal onClick={() => { setIndPaso(0); setFase(1) }} label="Comenzar análisis →" color={C.morado} />
    </ModuloWrapper>
  )

  // FASE 1: Modos de fallo por paso
  if (fase === 1) return (
    <ModuloWrapper
      titulo="Análisis AMFE"
      subtitulo={`Paso ${indPaso + 1} de ${pasos.length} · Modos de fallo`}
      color={C.morado}
      onVolver={() => indPaso === 0 ? setFase(0) : setIndPaso(i => i - 1)}
      progreso={Math.round(10 + (indPaso / pasos.length) * 40)}
    >
      <div style={{ background: `${C.morado}10`, border: `1px solid ${C.morado}30`, borderRadius: '14px', padding: '14px', marginBottom: '20px' }}>
        <div style={{ fontSize: '11px', fontWeight: '700', color: C.morado, letterSpacing: '0.5px', marginBottom: '4px' }}>PASO {indPaso + 1} DE {pasos.length}</div>
        <div style={{ fontSize: '15px', fontWeight: '700', color: C.texto }}>{pasoActual?.descripcion}</div>
      </div>

      <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '14px' }}>
        ¿Qué podría fallar en este paso? Añade uno o más modos de fallo.
      </div>

      {modosDelPaso.map((m, idx) => (
        <div key={idx} style={{ background: C.blanco, borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `3px solid ${C.morado}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: C.morado }}>Modo de fallo #{idx + 1}</div>
            <button onClick={() => removeModo(pasoActual.id, idx)} style={{ background: `${C.rojo}15`, border: 'none', color: C.rojo, borderRadius: '8px', padding: '4px 10px', cursor: 'pointer', fontSize: '11px', fontFamily: "'DM Sans',sans-serif" }}>✕ Eliminar</button>
          </div>
          {[
            { campo: 'modo',   label: '¿Qué podría fallar?',   ph: 'Ej: Confusión en la identificación del paciente' },
            { campo: 'efecto', label: '¿Qué efecto tendría?',  ph: 'Ej: Administración de medicación errónea' },
            { campo: 'causa',  label: '¿Cuál sería la causa?', ph: 'Ej: Ausencia de doble verificación' },
          ].map(f => (
            <div key={f.campo} style={{ marginBottom: '10px' }}>
              <label style={{ ...labelStyle, color: C.morado }}>{f.label}</label>
              <input value={m[f.campo]} onChange={e => updateModo(pasoActual.id, idx, f.campo, e.target.value)}
                placeholder={f.ph} style={inputStyle(m[f.campo])} />
            </div>
          ))}
        </div>
      ))}

      <button onClick={() => addModoFallo(pasoActual.id)} style={{
        width: '100%', padding: '12px',
        border: `2px dashed ${C.morado}50`, borderRadius: '12px',
        background: `${C.morado}06`, color: C.morado,
        fontSize: '14px', fontWeight: '700', cursor: 'pointer',
        fontFamily: "'DM Sans',sans-serif", marginBottom: '16px',
      }}>+ Añadir modo de fallo</button>

      {modosDelPaso.length === 0 && (
        <AlertaInfo titulo="Sin modos de fallo aún" texto="Añade al menos un modo de fallo para este paso antes de continuar. Si en este paso no identificas ningún fallo puedes saltarlo pulsando el botón." color={C.morado} />
      )}

      <BtnPrincipal
        onClick={() => {
          if (modosDelPaso.length === 0 && indPaso < pasos.length - 1) {
            // permitir saltar pasos sin modos de fallo
            setIndPaso(i => i + 1)
            return
          }
          if (indPaso < pasos.length - 1) {
            setIndPaso(i => i + 1)
          } else {
            irAFase2() // BUG FIX 1: reset índice
          }
        }}
        activo={true}
        label={indPaso < pasos.length - 1
          ? `Siguiente paso → (${indPaso + 2}/${pasos.length})`
          : 'Continuar → Puntuar S/O/D'}
        color={C.morado}
      />
    </ModuloWrapper>
  )

  // FASE 2: Puntuación S/O/D
  const todosLosPasos = pasos.filter(p => (modosFallo[p.id] || []).length > 0)
  const pasoParaPuntuar = todosLosPasos[indPaso]

  if (fase === 2) {
    if (todosLosPasos.length === 0) return (
      <ModuloWrapper titulo="Análisis AMFE" subtitulo="Sin modos de fallo" color={C.morado} onVolver={() => { setIndPaso(pasos.length - 1); setFase(1) }} progreso={50}>
        <AlertaInfo titulo="No hay modos de fallo registrados" texto="Vuelve atrás y añade al menos un modo de fallo en algún paso del proceso." color={C.rojo} />
        <BtnPrincipal onClick={() => { setIndPaso(pasos.length - 1); setFase(1) }} label="← Volver a añadir modos de fallo" color={C.morado} />
      </ModuloWrapper>
    )

    return (
      <ModuloWrapper
        titulo="Análisis AMFE"
        subtitulo={`Puntuación S·O·D · Paso ${indPaso + 1}/${todosLosPasos.length}`}
        color={C.morado}
        onVolver={() => {
          if (indPaso === 0) { setIndPaso(pasos.length - 1); setFase(1) }
          else setIndPaso(i => i - 1)
        }}
        progreso={Math.round(50 + (indPaso / todosLosPasos.length) * 40)}
      >
        <div style={{ background: `${C.morado}10`, border: `1px solid ${C.morado}30`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '11px', fontWeight: '700', color: C.morado, marginBottom: '4px' }}>
            PASO {pasos.indexOf(pasoParaPuntuar) + 1}: {pasoParaPuntuar?.descripcion}
          </div>
          <div style={{ fontSize: '12px', color: C.textoSuave }}>
            {(modosFallo[pasoParaPuntuar?.id] || []).length} modo(s) de fallo a puntuar
          </div>
        </div>

        {(modosFallo[pasoParaPuntuar?.id] || []).map((m, mIdx) => {
          const npr = getNPR(pasoParaPuntuar.id, mIdx)
          const esCritico = getPuntuacion(pasoParaPuntuar.id, mIdx, 's') >= 8
          return (
            <div key={mIdx} style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `3px solid ${esCritico ? C.rojo : C.morado}` }}>
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: C.morado }}>MODO #{mIdx + 1}</div>
                <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto, marginTop: '2px' }}>{m.modo}</div>
                {m.efecto && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '2px' }}>Efecto: {m.efecto}</div>}
              </div>

              <div style={{ background: npr >= 100 ? `${C.rojo}12` : `${C.morado}08`, borderRadius: '10px', padding: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: '12px', color: C.textoSuave }}>NPR = S × O × D</div>
                <div style={{ fontSize: '22px', fontWeight: '800', color: npr >= 100 ? C.rojo : C.morado }}>
                  {npr || '—'}
                  {npr >= 100 && <span style={{ fontSize: '11px', marginLeft: '6px' }}>⚠ CRÍTICO</span>}
                </div>
              </div>

              {esCritico && <AlertaInfo titulo="⚠ Severidad crítica (S≥8)" texto="Requiere atención prioritaria independientemente del NPR final." color={C.rojo} />}

              <DimensionSelector
                label="S — Severidad"
                descripcion="¿Qué gravedad tendría el efecto si el fallo ocurre?"
                color={C.rojo}
                valor={getPuntuacion(pasoParaPuntuar.id, mIdx, 's')}
                opciones={AMFE_SEVERIDAD}
                onChange={v => setPuntuacion(pasoParaPuntuar.id, mIdx, 's', v)}
              />
              <DimensionSelector
                label="O — Ocurrencia"
                descripcion="¿Con qué frecuencia podría ocurrir este fallo?"
                color={C.naranja}
                valor={getPuntuacion(pasoParaPuntuar.id, mIdx, 'o')}
                opciones={AMFE_OCURRENCIA}
                onChange={v => setPuntuacion(pasoParaPuntuar.id, mIdx, 'o', v)}
              />
              <DimensionSelector
                label="D — Detectabilidad"
                descripcion="¿Qué tan difícil sería detectar el fallo antes de causar daño? (10=muy difícil)"
                color={C.azul}
                valor={getPuntuacion(pasoParaPuntuar.id, mIdx, 'd')}
                opciones={AMFE_DETECTABILIDAD}
                onChange={v => setPuntuacion(pasoParaPuntuar.id, mIdx, 'd', v)}
              />
            </div>
          )
        })}

        {errorGuardado && (
          <AlertaInfo titulo="⚠ Error al guardar" texto={errorGuardado} color={C.rojo} />
        )}

        <BtnPrincipal
          onClick={() => {
            const todosPuntuados = (modosFallo[pasoParaPuntuar?.id] || []).every((_, idx) => {
              const p = puntuaciones[`${pasoParaPuntuar.id}_${idx}`] || {}
              return p.s && p.o && p.d
            })
            if (!todosPuntuados) return
            if (indPaso < todosLosPasos.length - 1) setIndPaso(i => i + 1)
            else guardarTodo()
          }}
          activo={!guardando && (modosFallo[pasoParaPuntuar?.id] || []).every((_, idx) => {
            const p = puntuaciones[`${pasoParaPuntuar?.id}_${idx}`] || {}
            return p.s && p.o && p.d
          })}
          label={guardando ? 'Guardando...' : indPaso < todosLosPasos.length - 1 ? `Siguiente paso →` : '✅ Finalizar y guardar'}
          color={C.morado}
        />
        <div style={{ textAlign: 'center', fontSize: '12px', color: C.textoSuave, marginTop: '8px' }}>
          Puntúa S, O y D de cada modo de fallo para continuar
        </div>
      </ModuloWrapper>
    )
  }

  // FASE 3: Completado
  return (
    <ModuloWrapper titulo="Análisis AMFE" subtitulo="Análisis completado" color={C.morado} onVolver={onFinalizar} progreso={100}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.morado, marginBottom: '8px' }}>AMFE registrado</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '24px' }}>
          Tu análisis del proceso <strong>{proceso.codigo}</strong> ha sido guardado correctamente. El coordinador verá tus puntuaciones en el ranking NPR.
        </div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver al inicio" color={C.azul} />
      </div>
    </ModuloWrapper>
  )
}

// ── SELECTOR DE DIMENSIÓN ──────────────────────────────────────
function DimensionSelector({ label, descripcion, color, valor, opciones, onChange }) {
  const [expandido, setExpandido] = useState(false)
  const opcionActual = opciones.find(o => o.valor === valor)

  return (
    <div style={{ marginBottom: '14px' }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color, marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: C.textoSuave, marginBottom: '8px' }}>{descripcion}</div>
      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '6px' }}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(v => (
          <button key={v} onClick={() => onChange(v)} style={{
            width: '32px', height: '32px', borderRadius: '8px',
            border: `2px solid ${valor === v ? color : v >= 8 ? '#ffcccc' : '#e0e0e0'}`,
            background: valor === v ? color : C.blanco,
            color: valor === v ? C.blanco : C.textoSuave,
            fontWeight: '700', fontSize: '13px', cursor: 'pointer',
            fontFamily: "'DM Sans',sans-serif",
          }}>{v}</button>
        ))}
      </div>
      {opcionActual && (
        <div style={{ background: `${color}10`, borderRadius: '8px', padding: '8px 10px', fontSize: '11px', color, fontWeight: '600' }}>
          {opcionActual.valor}: {opcionActual.label} — {opcionActual.desc}
        </div>
      )}
      <button onClick={() => setExpandido(!expandido)} style={{ background: 'none', border: 'none', color: C.textoSuave, fontSize: '11px', cursor: 'pointer', marginTop: '4px', fontFamily: "'DM Sans',sans-serif", padding: 0 }}>
        {expandido ? '▲ Ocultar descriptores' : '▼ Ver todos los descriptores'}
      </button>
      {expandido && (
        <div style={{ marginTop: '8px', background: C.blanco, borderRadius: '10px', overflow: 'hidden', border: `1px solid ${C.grisMedio}` }}>
          {opciones.map(o => (
            <div key={o.valor} onClick={() => onChange(o.valor)} style={{
              padding: '8px 12px', cursor: 'pointer', display: 'flex', gap: '10px', alignItems: 'flex-start',
              background: valor === o.valor ? `${color}12` : 'transparent',
              borderBottom: `1px solid ${C.grisMedio}`,
            }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: valor === o.valor ? color : `${color}20`, color: valor === o.valor ? C.blanco : color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: '700', flexShrink: 0 }}>{o.valor}</div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: o.valor >= 8 ? C.rojo : C.texto }}>{o.label}{o.valor >= 8 ? ' ⚠' : ''}</div>
                <div style={{ fontSize: '10px', color: C.textoSuave }}>{o.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
