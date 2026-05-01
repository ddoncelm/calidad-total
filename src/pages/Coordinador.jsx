import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase.js'
import { C, AMFE_TIPOS_PROCESO, isHeader } from '../lib/constants.js'
import { llamarIA, promptSintesis, promptInforme, promptAMFEPasos, promptAMFESintesis, promptAMFEInforme, promptPlanAccionAMFE, promptResumenInformeAMFE, extraerPropuestas, extraerPasos } from '../lib/ia.js'
import FusionAMFE from './FusionAMFE.jsx'
import { exportarPDF, exportarRTF, exportarInformeAMFEPDF, exportarInformeAMFERTF, exportarSeguimientoPDF, exportarSeguimientoRTF } from '../lib/exportar.js'
import { Isologo, BtnPrincipal, EstadoBadge, AlertaInfo, ModalConfirm, CargandoIA, inputStyle, labelStyle } from '../components/UI.jsx'

export default function PaginaCoordinador({ onLogout }) {
  const [vista, setVista] = useState('dashboard')
  const [procesos, setProcesos] = useState([])
  const [procesoActivo, setProcesoActivo] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [mostrarArchivados, setMostrarArchivados] = useState(false)

  useEffect(() => { cargarProcesos() }, [mostrarArchivados])

  const cargarProcesos = async () => {
    setCargando(true)
    const query = supabase.from('procesos').select('*').order('created_at', { ascending: false })
    if (!mostrarArchivados) query.eq('archivado', false)
    const { data } = await query
    setProcesos(data || [])
    setCargando(false)
  }

  if (vista === 'crear') return <CrearProceso onVolver={() => { setVista('dashboard'); cargarProcesos() }} />
  if (vista === 'proceso' && procesoActivo) return <DetalleProceso proceso={procesoActivo} onVolver={() => { setVista('dashboard'); cargarProcesos() }} />

  const activos = procesos.filter(p => !p.archivado && p.estado !== 'cerrado')
  const cerrados = procesos.filter(p => !p.archivado && p.estado === 'cerrado')

  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.gris} 0%,#e8f5e8 60%,${C.grisMedio} 100%)` }}>
      <div style={{ background: `linear-gradient(135deg,${C.verde},${C.teal})`, padding: '20px 20px 28px', borderRadius: '0 0 28px 28px', boxShadow: `0 4px 20px ${C.verde}44` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '22px', color: C.blanco }}>Calidad<span style={{ opacity: 0.7 }}>Total</span></div>
            <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.75)', letterSpacing: '1px', marginTop: '2px' }}>PANEL COORDINADOR · SAS</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Isologo size={36} />
            <button onClick={onLogout} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Salir</button>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginTop: '20px' }}>
          {[
            { label: 'Activos', valor: activos.length, emoji: '🟢' },
            { label: 'Cerrados', valor: cerrados.length, emoji: '✅' },
            { label: 'AMFE', valor: procesos.filter(p => p.tipo === 'amfe' && !p.archivado).length, emoji: '🔬' },
          ].map((s, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.15)', borderRadius: '12px', padding: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '18px' }}>{s.emoji}</div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: C.blanco }}>{s.valor}</div>
              <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.75)', letterSpacing: '0.5px' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: '20px' }}>
        <BtnPrincipal onClick={() => setVista('crear')} label="+ Crear nuevo proceso" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', marginBottom: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: C.textoSuave, letterSpacing: '1px', textTransform: 'uppercase' }}>Procesos</div>
          <button onClick={() => setMostrarArchivados(!mostrarArchivados)} style={{ background: mostrarArchivados ? C.verde : 'transparent', border: `1px solid ${C.verde}`, color: mostrarArchivados ? C.blanco : C.verde, borderRadius: '20px', padding: '4px 12px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: '600' }}>
            {mostrarArchivados ? '📁 Viendo archivados' : '📁 Ver archivados'}
          </button>
        </div>
        {cargando && <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>Cargando...</div>}
        {!cargando && procesos.length === 0 && <AlertaInfo titulo="Sin procesos" texto="Crea tu primer proceso de mejora, análisis de suceso centinela o AMFE." />}
        {procesos.map(p => <TarjetaProceso key={p.id} proceso={p} onClick={() => { setProcesoActivo(p); setVista('proceso') }} onRefresh={cargarProcesos} />)}
      </div>
    </div>
  )
}

// ── TARJETA PROCESO ────────────────────────────────────────────
function TarjetaProceso({ proceso, onClick, onRefresh }) {
  const [modalBorrar, setModalBorrar] = useState(false)
  const [modalArchivar, setModalArchivar] = useState(false)
  const color = proceso.tipo === 'lean' ? C.verde : proceso.tipo === 'rca' ? C.rojo : C.morado
  const label = proceso.tipo === 'lean' ? 'Lean' : proceso.tipo === 'rca' ? 'RCA' : 'AMFE'

  return (
    <>
      <div style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)', borderLeft: `4px solid ${color}`, opacity: proceso.archivado ? 0.6 : 1 }}>
        <div onClick={onClick} style={{ cursor: 'pointer' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: '700', color, letterSpacing: '0.5px' }}>{proceso.codigo} · {label}</div>
              <div style={{ fontSize: '15px', fontWeight: '700', color: C.texto, marginTop: '2px' }}>{proceso.titulo}</div>
              <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '2px' }}>📍 {proceso.unidad}</div>
            </div>
            <EstadoBadge estado={proceso.archivado ? 'archivado' : proceso.estado} />
          </div>
          <div style={{ fontSize: '11px', color: '#aaa' }}>{new Date(proceso.created_at).toLocaleDateString('es-ES')}</div>
        </div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${C.grisMedio}` }}>
          <button onClick={() => setModalArchivar(true)} style={btnQ(C.azul)}>{proceso.archivado ? '📤 Restaurar' : '📁 Archivar'}</button>
          <button onClick={() => setModalBorrar(true)} style={btnQ(C.rojo)}>🗑 Borrar</button>
        </div>
      </div>
      <ModalConfirm visible={modalBorrar} titulo="¿Borrar proceso?" mensaje={`Se eliminará permanentemente "${proceso.titulo}" con todas sus aportaciones. Esta acción no se puede deshacer.`} labelBtn="Sí, borrar" colorBtn={C.rojo} onConfirmar={async () => { await supabase.from('procesos').delete().eq('id', proceso.id); setModalBorrar(false); onRefresh() }} onCancelar={() => setModalBorrar(false)} />
      <ModalConfirm visible={modalArchivar} titulo={proceso.archivado ? '¿Restaurar proceso?' : '¿Archivar proceso?'} mensaje={proceso.archivado ? 'Volverá a aparecer en el panel principal.' : 'Se archivará. Podrás recuperarlo desde "Ver archivados".'} labelBtn={proceso.archivado ? 'Restaurar' : 'Archivar'} colorBtn={C.azul} onConfirmar={async () => { await supabase.from('procesos').update({ archivado: !proceso.archivado }).eq('id', proceso.id); setModalArchivar(false); onRefresh() }} onCancelar={() => setModalArchivar(false)} />
    </>
  )
}
const btnQ = (color) => ({ flex: 1, padding: '7px', border: `1px solid ${color}30`, borderRadius: '8px', background: `${color}10`, color, fontSize: '11px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" })

// ── CREAR PROCESO ──────────────────────────────────────────────
function CrearProceso({ onVolver }) {
  const [tipo, setTipo] = useState('')
  const [titulo, setTitulo] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [unidad, setUnidad] = useState('')
  const [tipoProcesoAmfe, setTipoProcesoAmfe] = useState('')
  const [creando, setCreando] = useState(false)
  const [codigoGenerado, setCodigoGenerado] = useState(null)

  const crear = async () => {
    if (!tipo || !titulo || !unidad) return
    setCreando(true)
    const { data: codigo } = await supabase.rpc('generar_codigo_proceso', { tipo_proceso: tipo })
    await supabase.from('procesos').insert({ codigo, tipo, titulo, descripcion: descripcion || (tipo === 'amfe' ? tipoProcesoAmfe : null), unidad, estado: 'aportaciones' })
    setCodigoGenerado(codigo)
    setCreando(false)
  }

  if (codigoGenerado) return (
    <div style={{ minHeight: '100vh', background: C.gris, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '24px', padding: '36px 28px', maxWidth: '380px', width: '100%', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.verde, marginBottom: '8px' }}>Proceso creado</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '20px' }}>Comparte este código con los participantes:</div>
        <div style={{ background: `${C.verde}12`, border: `2px dashed ${C.verde}`, borderRadius: '16px', padding: '20px', fontFamily: 'monospace', fontSize: '26px', fontWeight: '800', color: C.verde, letterSpacing: '2px', marginBottom: '24px' }}>{codigoGenerado}</div>
        {tipo === 'amfe' && <AlertaInfo titulo="Siguiente paso" texto="Antes de invitar a los participantes, configura los pasos del proceso AMFE desde el panel del proceso." color={C.morado} />}
        <BtnPrincipal onClick={onVolver} label="← Volver al panel" />
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: C.gris }}>
      <div style={{ background: `linear-gradient(135deg,${C.verde},${C.teal})`, padding: '20px', borderRadius: '0 0 24px 24px' }}>
        <button onClick={onVolver} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '10px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>← Volver</button>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.blanco, marginTop: '12px' }}>Nuevo proceso</div>
      </div>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={labelStyle}>Tipo de proceso *</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
            {[
              { id: 'lean', label: 'Mejora Continua', emoji: '📊', color: C.verde },
              { id: 'rca',  label: 'Suceso Centinela', emoji: '🔴', color: C.rojo },
              { id: 'amfe', label: 'Análisis AMFE', emoji: '🔬', color: C.morado },
            ].map(t => (
              <button key={t.id} onClick={() => setTipo(t.id)} style={{ padding: '14px 8px', border: `2px solid ${tipo === t.id ? t.color : '#e0e0e0'}`, borderRadius: '14px', background: tipo === t.id ? `${t.color}12` : C.blanco, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s' }}>
                <div style={{ fontSize: '22px' }}>{t.emoji}</div>
                <div style={{ fontSize: '11px', fontWeight: '700', color: tipo === t.id ? t.color : C.texto, marginTop: '6px', lineHeight: '1.2' }}>{t.label}</div>
              </button>
            ))}
          </div>
        </div>

        {tipo === 'amfe' && (
          <div style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>Tipo de proceso a analizar *</div>
            <select value={tipoProcesoAmfe} onChange={e => setTipoProcesoAmfe(e.target.value)} style={inputStyle(tipoProcesoAmfe)}>
              <option value="">Selecciona el tipo de proceso...</option>
              {AMFE_TIPOS_PROCESO.map((t, i) => <option key={i} value={t} disabled={isHeader(t)} style={{ color: isHeader(t) ? '#aaa' : C.texto, fontWeight: isHeader(t) ? '700' : '400' }}>{t}</option>)}
            </select>
          </div>
        )}

        {[
          { label: 'Título del proceso *', value: titulo, set: setTitulo, ph: 'Ej: Mejora del circuito de urgencias' },
          { label: 'Unidad / Servicio *', value: unidad, set: setUnidad, ph: 'Ej: Urgencias, Radiodiagnóstico...' },
          { label: 'Descripción (opcional)', value: descripcion, set: setDescripcion, ph: 'Contexto adicional del proceso...' },
        ].map(f => (
          <div key={f.label} style={{ marginBottom: '14px' }}>
            <div style={labelStyle}>{f.label}</div>
            <input value={f.value} onChange={e => f.set(e.target.value)} placeholder={f.ph} style={inputStyle(f.value)} />
          </div>
        ))}
        <BtnPrincipal onClick={crear} label={creando ? 'Creando...' : 'Crear proceso y generar código'} activo={!!(tipo && titulo && unidad && (tipo !== 'amfe' || tipoProcesoAmfe)) && !creando} />
      </div>
    </div>
  )
}

// ── DETALLE PROCESO ────────────────────────────────────────────
function DetalleProceso({ proceso: procesoProp, onVolver }) {
  const [proceso, setProceso] = useState(procesoProp)
  const [aportaciones, setAportaciones] = useState([])
  const [propuestas, setPropuestas] = useState([])
  const [acciones, setAcciones] = useState([])
  const [ranking, setRanking] = useState([])
  const [rankingAmfe, setRankingAmfe] = useState([])
  const [fusiones, setFusiones] = useState([])
  const [vistaFusion, setVistaFusion] = useState(false)
  const [informe, setInforme] = useState(null)
  const [pasos, setPasos] = useState([])
  const [tab, setTab] = useState(proceso.tipo === 'amfe' ? 'pasos' : 'aportaciones')
  const [cargando, setCargando] = useState(true)
  const [modalEstado, setModalEstado] = useState(false)
  const [sintetizando, setSintetizando] = useState(false)
  const [generandoInforme, setGenerandoInforme] = useState(false)
  const [generandoPlan, setGenerandoPlan] = useState(false)
  const [propuestasParticipantes, setPropuestasParticipantes] = useState([])

  useEffect(() => { cargarTodo() }, [])

  const cargarTodo = async () => {
    setCargando(true)
    const tabla = proceso.tipo === 'lean' ? 'aportaciones_lean' : proceso.tipo === 'rca' ? 'aportaciones_rca' : 'aportaciones_amfe'
    const queries = [
      supabase.from(tabla).select('*, participaciones(pin,categoria,unidad)').eq('proceso_id', proceso.id),
      supabase.from('acciones').select('*').eq('proceso_id', proceso.id),
      supabase.from('informes').select('*').eq('proceso_id', proceso.id).single(),
      supabase.from('procesos').select('*').eq('id', proceso.id).single(),
    ]
    if (proceso.tipo !== 'amfe') {
      queries.push(supabase.from('propuestas').select('*').eq('proceso_id', proceso.id).order('n_coincidencias', { ascending: false }))
      queries.push(supabase.from('ranking_propuestas').select('*').eq('proceso_id', proceso.id))
    } else {
      queries.push(supabase.from('pasos_amfe').select('*').eq('proceso_id', proceso.id).order('orden'))
      queries.push(supabase.from('ranking_amfe').select('*').eq('proceso_id', proceso.id))
      queries.push(supabase.from('fusiones_amfe').select('*').eq('proceso_id', proceso.id).order('npr_medio', { ascending: false }))
    }
    const [aport, acc, inf, proc, extra1, extra2, extra3] = await Promise.all(queries)
    setAportaciones(aport.data || [])
    setAcciones(acc.data || [])
    setInforme(inf.data || null)
    if (proc.data) setProceso(proc.data)
    if (proceso.tipo !== 'amfe') { setPropuestas(extra1.data || []); setRanking(extra2.data || []) }
    else { setPasos(extra1.data || []); setRankingAmfe(extra2.data || []); setFusiones(extra3?.data || []) }

    // Cargar propuestas de participantes si es AMFE
    if (proc.data?.tipo === 'amfe') {
      const { data: propPart } = await supabase
        .from('propuestas_accion_participantes')
        .select('*, participaciones(pin, categoria)')
        .eq('proceso_id', proceso.id)
        .order('created_at')
      setPropuestasParticipantes(propPart || [])
    }
    setCargando(false)
  }

  const generarPlanAccionIA = async () => {
    setGenerandoPlan(true)
    try {
      const modos = fusiones.length > 0 ? fusiones : rankingAmfe
      if (modos.length === 0) { setGenerandoPlan(false); return }
      const prompt = promptPlanAccionAMFE({ proceso, modos })
      const texto = await llamarIA(prompt, 2000)
      const limpio = texto.replace(/```json|```/g, '').trim()
      const resultado = JSON.parse(limpio)
      if (resultado.acciones && resultado.acciones.length > 0) {
        for (const accion of resultado.acciones) {
          const plazoDate = new Date()
          plazoDate.setMonth(plazoDate.getMonth() + (accion.plazo_meses || 3))
          await supabase.from('acciones').insert({
            proceso_id: proceso.id,
            descripcion: accion.descripcion,
            responsable: accion.responsable,
            plazo: plazoDate.toISOString().split('T')[0],
            indicador: accion.indicador,
            estado: 'pendiente',
            observaciones: accion.modo_origen ? `Modo de fallo: ${accion.modo_origen}` : null,
            generada_ia: true,
          })
        }
        await cargarTodo()
      }
    } catch (e) { console.error('Error generando plan:', e) }
    setGenerandoPlan(false)
  }

  const incorporarPropuesta = async (propuesta) => {
    await supabase.from('acciones').insert({
      proceso_id: proceso.id,
      descripcion: propuesta.descripcion,
      responsable: propuesta.responsable || '',
      estado: 'pendiente',
      observaciones: `Propuesto por participante (${propuesta.participaciones?.categoria || 'PIN ' + propuesta.participaciones?.pin})`,
    })
    await supabase.from('propuestas_accion_participantes').update({ incorporada: true }).eq('id', propuesta.id)
    await cargarTodo()
  }

  const cambiarEstado = async (estado) => {
    await supabase.from('procesos').update({ estado }).eq('id', proceso.id)
    setProceso(prev => ({ ...prev, estado }))
    setModalEstado(false)
  }

  const sintetizarPropuestas = async () => {
    setSintetizando(true)
    try {
      const todas = propuestas.map(p => p.texto)
      if (todas.length === 0) { setSintetizando(false); return }
      const texto = await llamarIA(promptSintesis({ tipo: proceso.tipo, proceso, propuestasRaw: todas }))
      const sintetizadas = extraerPropuestas(texto)
      await supabase.from('propuestas').delete().eq('proceso_id', proceso.id)
      if (sintetizadas.length > 0) await supabase.from('propuestas').insert(sintetizadas.map(p => ({ proceso_id: proceso.id, texto: p, origen: 'ia', consolidada: true, n_coincidencias: Math.round(todas.length / sintetizadas.length) })))
      await supabase.from('procesos').update({ sintesis_generada: true }).eq('id', proceso.id)
      await cargarTodo()
    } catch (e) { console.error(e) }
    setSintetizando(false)
  }

  const generarInforme = async () => {
    setGenerandoInforme(true)
    try {
      const modos = fusiones.length > 0 ? fusiones : rankingAmfe
      const cats = [...new Set(aportaciones.map(a => a.participaciones?.categoria).filter(Boolean))]
      const { data: procData } = await supabase.from('procesos').select('informe_coordinadores').eq('id', proceso.id).single()
      const prompt = proceso.tipo === 'amfe'
        ? promptResumenInformeAMFE({ proceso, pasos, modos, acciones, categorias: cats, coordinadores: procData?.informe_coordinadores || '' })
        : promptInforme({ proceso, aportaciones, propuestas, ranking, acciones })
      const contenido = await llamarIA(prompt, 2000)
      const { data: inf } = await supabase.from('informes').select('id').eq('proceso_id', proceso.id).single()
      if (inf) await supabase.from('informes').update({ contenido_ia: contenido }).eq('proceso_id', proceso.id)
      else await supabase.from('informes').insert({ proceso_id: proceso.id, contenido_ia: contenido })
      setInforme({ contenido_ia: contenido })
    } catch (e) { console.error(e) }
    setGenerandoInforme(false)
  }

  const ESTADOS = proceso.tipo === 'amfe'
    ? ['aportaciones', 'puntuacion', 'plan_accion', 'seguimiento', 'cerrado']
    : ['aportaciones', 'votacion', 'plan_accion', 'seguimiento', 'cerrado']

  const colorProceso = proceso.tipo === 'lean' ? C.verde : proceso.tipo === 'rca' ? C.rojo : C.morado
  const colorSecundario = proceso.tipo === 'lean' ? C.teal : proceso.tipo === 'rca' ? C.naranja : C.moradoClaro

  const TABS_BASE = proceso.tipo === 'amfe'
    ? [
        { id: 'pasos',       label: 'Pasos',       n: pasos.length },
        { id: 'aportaciones',label: 'Aportaciones',n: aportaciones.length },
        { id: 'rankingAmfe', label: 'Ranking NPR',  n: rankingAmfe.length },
        { id: 'acciones',    label: 'Acciones',    n: acciones.length },
        { id: 'pines',       label: 'Acceso',      n: null },
        { id: 'informe',     label: 'Informe',     n: null },
      ]
    : [
        { id: 'aportaciones',label: 'Aportaciones',n: aportaciones.length },
        { id: 'propuestas',  label: 'Propuestas',  n: propuestas.length },
        { id: 'ranking',     label: 'Ranking',     n: ranking.length },
        { id: 'acciones',    label: 'Acciones',    n: acciones.length },
        { id: 'pines',       label: 'Acceso',      n: null },
        { id: 'informe',     label: 'Informe',     n: null },
      ]

  return (
    <div style={{ minHeight: '100vh', background: C.gris }}>
      <div style={{ background: `linear-gradient(135deg,${colorProceso},${colorSecundario})`, padding: '16px 20px 20px', borderRadius: '0 0 24px 24px' }}>
        <button onClick={onVolver} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '10px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginBottom: '10px' }}>← Volver</button>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', fontWeight: '700', letterSpacing: '1px' }}>{proceso.codigo}</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '18px', color: C.blanco, marginTop: '2px' }}>{proceso.titulo}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.75)', marginTop: '4px' }}>📍 {proceso.unidad}</div>
        <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <EstadoBadge estado={proceso.estado} />
          <button onClick={() => setModalEstado(true)} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', color: C.blanco, borderRadius: '8px', padding: '5px 12px', fontSize: '12px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cambiar fase ↕</button>
        </div>
      </div>

      {modalEstado && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
          <div style={{ background: C.blanco, borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '340px' }}>
            <div style={{ fontSize: '16px', fontWeight: '700', color: C.texto, marginBottom: '16px' }}>Cambiar fase del proceso</div>
            {ESTADOS.map(e => (
              <button key={e} onClick={() => cambiarEstado(e)} style={{ width: '100%', padding: '12px', border: `2px solid ${proceso.estado === e ? colorProceso : '#e0e0e0'}`, borderRadius: '10px', background: proceso.estado === e ? `${colorProceso}12` : C.blanco, color: proceso.estado === e ? colorProceso : C.texto, fontWeight: proceso.estado === e ? '700' : '400', cursor: 'pointer', marginBottom: '8px', fontFamily: "'DM Sans',sans-serif", textAlign: 'left', fontSize: '14px' }}>
                {proceso.estado === e ? '✓ ' : ''}{e.replace('_', ' ').replace(/^\w/, c => c.toUpperCase())}
              </button>
            ))}
            <button onClick={() => setModalEstado(false)} style={{ width: '100%', padding: '10px', border: `1px solid ${C.grisMedio}`, borderRadius: '10px', background: C.blanco, color: C.textoSuave, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", marginTop: '4px' }}>Cancelar</button>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', padding: '14px 14px 0', gap: '6px', overflowX: 'auto' }}>
        {TABS_BASE.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ padding: '7px 12px', borderRadius: '20px', border: 'none', background: tab === t.id ? colorProceso : C.blanco, color: tab === t.id ? C.blanco : C.textoSuave, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap', boxShadow: tab === t.id ? `0 2px 8px ${colorProceso}44` : 'none' }}>
            {t.label}{t.n != null && t.n > 0 ? ` (${t.n})` : ''}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>
        {cargando ? <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>Cargando...</div> : (
          <>
            {tab === 'pasos' && proceso.tipo === 'amfe' && <TabPasosAMFE proceso={proceso} pasos={pasos} onRefresh={cargarTodo} />}
            {tab === 'aportaciones' && <TabAportaciones aportaciones={aportaciones} tipo={proceso.tipo} />}
            {tab === 'propuestas' && <TabPropuestas propuestas={propuestas} procesoId={proceso.id} sintetizando={sintetizando} sintesisGenerada={proceso.sintesis_generada} onSintetizar={sintetizarPropuestas} onRefresh={cargarTodo} />}
            {tab === 'ranking' && <TabRanking ranking={ranking} />}
            {tab === 'rankingAmfe' && (
              vistaFusion
                ? <FusionAMFE proceso={proceso} aportaciones={aportaciones.map(a => ({...a, paso_descripcion: pasos.find(p => p.id === a.paso_id)?.descripcion || ''}))} onFinalizar={() => { setVistaFusion(false); cargarTodo() }} />
                : <TabRankingAMFE ranking={rankingAmfe} fusiones={fusiones} aportaciones={aportaciones} onFusionar={() => setVistaFusion(true)} onRefresh={cargarTodo} />
            )}
            {tab === 'acciones' && <TabAcciones acciones={acciones} procesoId={proceso.id} onRefresh={cargarTodo} esAMFE={proceso.tipo === 'amfe'} generandoPlan={generandoPlan} onGenerarPlan={generarPlanAccionIA} propuestasParticipantes={propuestasParticipantes} onIncorporar={incorporarPropuesta} />}
            {tab === 'pines' && <TabPines procesoId={proceso.id} />}
            {tab === 'informe' && <TabInforme informe={informe} proceso={proceso} ranking={proceso.tipo === 'amfe' ? rankingAmfe : ranking} fusiones={fusiones} pasos={pasos} acciones={acciones} aportaciones={aportaciones} generandoInforme={generandoInforme} onGenerar={generarInforme} esAMFE={proceso.tipo === 'amfe'} onActualizarFusiones={cargarTodo} />}
          </>
        )}
      </div>
    </div>
  )
}

// ── TAB PASOS AMFE ─────────────────────────────────────────────
function TabPasosAMFE({ proceso, pasos, onRefresh }) {
  const [generandoPasos, setGenerandoPasos] = useState(false)
  const [nuevoPaso, setNuevoPaso] = useState('')
  const [modalBorrar, setModalBorrar] = useState(null)

  const generarPasosIA = async () => {
    setGenerandoPasos(true)
    try {
      const texto = await llamarIA(promptAMFEPasos({ tipoProceso: proceso.descripcion || proceso.titulo, descripcion: '', unidad: proceso.unidad }))
      const pasosGenerados = extraerPasos(texto)
      if (pasosGenerados.length > 0) {
        await supabase.from('pasos_amfe').delete().eq('proceso_id', proceso.id)
        await supabase.from('pasos_amfe').insert(pasosGenerados.map((p, i) => ({ proceso_id: proceso.id, orden: i + 1, descripcion: p, generado_ia: true })))
        onRefresh()
      }
    } catch (e) { console.error(e) }
    setGenerandoPasos(false)
  }

  const añadirPaso = async () => {
    if (!nuevoPaso.trim()) return
    const siguiente = pasos.length > 0 ? Math.max(...pasos.map(p => p.orden)) + 1 : 1
    await supabase.from('pasos_amfe').insert({ proceso_id: proceso.id, orden: siguiente, descripcion: nuevoPaso.trim() })
    setNuevoPaso('')
    onRefresh()
  }

  const borrarPaso = async (id) => {
    await supabase.from('pasos_amfe').delete().eq('id', id)
    setModalBorrar(null)
    onRefresh()
  }

  return (
    <div>
      <AlertaInfo titulo="Configuración de pasos del proceso" texto="Define los pasos secuenciales del proceso a analizar. Los participantes identificarán modos de fallo en cada paso. Configura esto ANTES de invitar a los participantes." color={C.morado} />

      {generandoPasos
        ? <CargandoIA color={C.morado} mensaje="Generando pasos del proceso con IA..." />
        : <BtnPrincipal onClick={generarPasosIA} label="🤖 Generar pasos con IA" color={C.morado} />
      }

      {pasos.length > 0 && (
        <div style={{ marginTop: '16px', background: C.blanco, borderRadius: '16px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '12px' }}>Pasos definidos ({pasos.length})</div>
          {pasos.map((p, i) => (
            <div key={p.id} style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '10px 0', borderBottom: i < pasos.length - 1 ? `1px solid ${C.grisMedio}` : 'none' }}>
              <div style={{ width: '26px', height: '26px', borderRadius: '50%', background: `${C.morado}18`, color: C.morado, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>{p.orden}</div>
              <div style={{ flex: 1, fontSize: '13px', color: C.texto }}>{p.descripcion}</div>
              {p.generado_ia && <span style={{ fontSize: '9px', background: `${C.morado}15`, color: C.morado, padding: '2px 6px', borderRadius: '8px', fontWeight: '700' }}>IA</span>}
              <button onClick={() => setModalBorrar(p)} style={{ background: `${C.rojo}15`, border: 'none', color: C.rojo, borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '11px', fontFamily: "'DM Sans',sans-serif" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
        <input value={nuevoPaso} onChange={e => setNuevoPaso(e.target.value)} onKeyDown={e => e.key === 'Enter' && añadirPaso()} placeholder="Añadir paso manualmente..." style={{ ...inputStyle(nuevoPaso), flex: 1, marginTop: 0 }} />
        <button onClick={añadirPaso} style={{ padding: '0 16px', background: C.morado, color: C.blanco, border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontFamily: "'DM Sans',sans-serif", flexShrink: 0 }}>+</button>
      </div>

      <ModalConfirm visible={!!modalBorrar} titulo="¿Eliminar paso?" mensaje={`Se eliminará el paso "${modalBorrar?.descripcion}" y todas sus aportaciones.`} labelBtn="Eliminar" colorBtn={C.rojo} onConfirmar={() => borrarPaso(modalBorrar.id)} onCancelar={() => setModalBorrar(null)} />
    </div>
  )
}

// ── TAB RANKING AMFE ───────────────────────────────────────────
function TabRankingAMFE({ ranking, fusiones, aportaciones, onFusionar, onRefresh }) {
  const tieneFusiones = fusiones && fusiones.length > 0
  const datos = tieneFusiones ? fusiones : ranking
  const criticos = datos.filter(r => r.npr_medio >= 100 || r.severidad_media >= 8)

  if (aportaciones.length === 0) return (
    <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>
      El ranking NPR se genera cuando los participantes completan el análisis AMFE
    </div>
  )

  return (
    <div>
      {!tieneFusiones && aportaciones.length > 0 && (
        <div style={{ background: `${C.morado}10`, border: `1px solid ${C.morado}30`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '6px' }}>🤖 Análisis de duplicados disponible</div>
          <div style={{ fontSize: '12px', color: C.textoSuave, marginBottom: '10px', lineHeight: '1.5' }}>
            La IA puede identificar modos de fallo similares para que decidas cuáles fusionar antes del ranking definitivo.
          </div>
          <button onClick={onFusionar} style={{ width: '100%', padding: '12px', background: `linear-gradient(135deg,${C.morado},${C.moradoClaro})`, color: C.blanco, border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
            🤖 Analizar y fusionar duplicados
          </button>
        </div>
      )}
      {tieneFusiones && (
        <div style={{ background: `${C.verde}10`, border: `1px solid ${C.verde}30`, borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: C.verde, fontWeight: '700' }}>✅ {fusiones.length} modos consolidados tras fusión</div>
          <button onClick={onFusionar} style={{ background: `${C.morado}18`, border: 'none', color: C.morado, borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: '700' }}>Revisar</button>
        </div>
      )}
      {criticos.length > 0 && (
        <div style={{ background: `${C.rojo}12`, border: `1px solid ${C.rojo}30`, borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', borderLeft: `3px solid ${C.rojo}` }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: C.rojo }}>⚠ {criticos.length} modo(s) crítico(s) — NPR ≥ 100 o S ≥ 8</div>
        </div>
      )}
      {datos.map((r, i) => {
        const esCritico = r.npr_medio >= 100 || r.severidad_media >= 8
        return (
          <div key={i} style={{ background: C.blanco, borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${esCritico ? C.rojo : r.npr_medio >= 50 ? C.naranja : C.verde}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: C.texto }}>{r.modo_fusionado || r.modo_fallo}</div>
                {r.efecto && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '3px' }}>Efecto: {r.efecto}</div>}
                {r.causa && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '2px' }}>Causa: {r.causa}</div>}
                {esCritico && <div style={{ fontSize: '11px', color: C.rojo, fontWeight: '700', marginTop: '4px' }}>⚠ Severidad crítica ≥ 8</div>}
                <div style={{ fontSize: '11px', color: C.textoSuave, marginTop: '6px' }}>
                  {r.n_profesionales || r.n_aportaciones || 1} profesional(es)
                  {tieneFusiones && r.n_profesionales > 1 && <span style={{ color: C.morado, fontWeight: '700' }}> · Fusionado</span>}
                </div>
              </div>
              <div style={{ background: esCritico ? `${C.rojo}12` : `${C.morado}10`, borderRadius: '12px', padding: '10px 12px', textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '20px', fontWeight: '800', color: esCritico ? C.rojo : C.morado }}>{Number(r.npr_medio)?.toFixed(0)}</div>
                <div style={{ fontSize: '8px', color: C.textoSuave }}>NPR</div>
                <div style={{ fontSize: '9px', color: C.textoSuave, marginTop: '4px' }}>S{Number(r.severidad_media)?.toFixed(1)}·O{Number(r.ocurrencia_media)?.toFixed(1)}·D{Number(r.detectabilidad_media)?.toFixed(1)}</div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}


// ── TAB APORTACIONES ───────────────────────────────────────────
function TabAportaciones({ aportaciones, tipo }) {
  if (aportaciones.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>Aún no hay aportaciones</div>
  return aportaciones.slice(0, 20).map((a, i) => (
    <div key={i} style={{ background: C.blanco, borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <div><div style={{ fontSize: '12px', fontWeight: '700', color: C.verde }}>PIN: {a.participaciones?.pin}</div><div style={{ fontSize: '12px', color: C.textoSuave }}>{a.participaciones?.categoria}</div></div>
        <div style={{ fontSize: '11px', color: '#aaa' }}>{new Date(a.created_at).toLocaleDateString('es-ES')}</div>
      </div>
      {tipo === 'lean' && <>{a.proceso_analizado && <div style={{ fontSize: '13px', color: C.texto }}><strong>Proceso:</strong> {a.proceso_analizado}</div>}{a.desperdicios && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '4px' }}>{a.desperdicios.join(', ')}</div>}</>}
      {tipo === 'rca' && <>{a.tipo_suceso && <div style={{ fontSize: '13px', color: C.texto }}><strong>Suceso:</strong> {a.tipo_suceso}</div>}{a.descripcion && <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '4px' }}>{a.descripcion.substring(0, 150)}...</div>}</>}
      {tipo === 'amfe' && <><div style={{ fontSize: '13px', color: C.texto }}><strong>Modo:</strong> {a.modo_fallo}</div><div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '4px' }}>NPR: {a.npr} (S:{a.severidad}·O:{a.ocurrencia}·D:{a.detectabilidad})</div>{a.severidad >= 8 && <div style={{ fontSize: '11px', color: C.rojo, fontWeight: '700', marginTop: '2px' }}>⚠ Severidad crítica</div>}</>}
    </div>
  ))
}

// ── TAB PROPUESTAS ─────────────────────────────────────────────
function TabPropuestas({ propuestas, procesoId, sintetizando, sintesisGenerada, onSintetizar, onRefresh }) {
  const [nueva, setNueva] = useState('')
  const añadir = async () => { if (!nueva.trim()) return; await supabase.from('propuestas').insert({ proceso_id: procesoId, texto: nueva, origen: 'coordinador' }); setNueva(''); onRefresh() }
  const toggleActiva = async (p) => { await supabase.from('propuestas').update({ activa: !p.activa }).eq('id', p.id); onRefresh() }
  return (
    <div>
      {!sintesisGenerada && propuestas.length > 0 && (
        <div style={{ background: `${C.moradoClaro}10`, border: `1px solid ${C.moradoClaro}30`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '6px' }}>🤖 Síntesis IA disponible ({propuestas.length} propuestas)</div>
          <div style={{ fontSize: '12px', color: C.textoSuave, marginBottom: '12px', lineHeight: '1.5' }}>La IA agrupará y consolidará las propuestas similares antes de abrir la votación.</div>
          {sintetizando ? <CargandoIA color={C.morado} mensaje="Sintetizando propuestas..." /> : <BtnPrincipal onClick={onSintetizar} label="🤖 Sintetizar con IA" color={C.morado} />}
        </div>
      )}
      {sintesisGenerada && <AlertaInfo titulo="✅ Propuestas sintetizadas" texto="Puedes editar antes de abrir la votación." color={C.morado} />}
      <div style={{ marginBottom: '16px' }}>
        <input value={nueva} onChange={e => setNueva(e.target.value)} placeholder="Añadir propuesta del coordinador..." style={inputStyle(nueva)} />
        <BtnPrincipal onClick={añadir} label="Añadir propuesta" activo={!!nueva.trim()} style={{ marginTop: '8px' }} />
      </div>
      {propuestas.length === 0 && <div style={{ textAlign: 'center', padding: '30px', color: C.textoSuave }}>Las propuestas se generan del análisis IA de los participantes</div>}
      {propuestas.map((p, i) => (
        <div key={i} style={{ background: C.blanco, borderRadius: '12px', padding: '14px', marginBottom: '10px', opacity: p.activa ? 1 : 0.5, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `3px solid ${p.consolidada ? C.morado : p.origen === 'coordinador' ? C.azul : C.verde}` }}>
          <div style={{ fontSize: '13px', color: C.texto, lineHeight: '1.5', marginBottom: '8px' }}>{p.texto}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', color: '#aaa', textTransform: 'uppercase' }}>{p.consolidada ? 'Consolidada' : p.origen}</span>
            <button onClick={() => toggleActiva(p)} style={{ fontSize: '11px', padding: '3px 10px', borderRadius: '20px', border: 'none', background: p.activa ? `${C.rojo}18` : `${C.verde}18`, color: p.activa ? C.rojo : C.verde, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{p.activa ? 'Desactivar' : 'Activar'}</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── TAB RANKING LEAN/RCA ───────────────────────────────────────
function TabRanking({ ranking }) {
  if (ranking.length === 0) return <div style={{ textAlign: 'center', padding: '40px', color: C.textoSuave }}>El ranking se genera cuando los participantes votan</div>
  return ranking.map((r, i) => (
    <div key={i} style={{ background: C.blanco, borderRadius: '14px', padding: '16px', marginBottom: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', borderLeft: `4px solid ${i === 0 ? C.naranja : i === 1 ? '#aaa' : C.verde}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, marginRight: '12px' }}>
          <div style={{ fontSize: '10px', fontWeight: '700', color: '#aaa', marginBottom: '4px' }}>#{i + 1}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto, lineHeight: '1.4' }}>{r.texto}</div>
          <div style={{ fontSize: '11px', color: C.textoSuave, marginTop: '6px' }}>{r.total_votos} voto(s)</div>
        </div>
        <div style={{ background: `${C.verde}12`, borderRadius: '12px', padding: '10px 14px', textAlign: 'center', flexShrink: 0 }}>
          <div style={{ fontSize: '20px', fontWeight: '800', color: C.verde }}>{(r.puntuacion_final * 100 / 3).toFixed(0)}</div>
          <div style={{ fontSize: '9px', color: C.textoSuave }}>/ 100</div>
        </div>
      </div>
    </div>
  ))
}

// ── TAB ACCIONES ───────────────────────────────────────────────
function TabAcciones({ acciones, procesoId, onRefresh, esAMFE, generandoPlan, onGenerarPlan, propuestasParticipantes, onIncorporar }) {
  const [nueva, setNueva] = useState({ descripcion: '', responsable: '', plazo: '', indicador: '' })
  const [añadiendo, setAñadiendo] = useState(false)

  const crear = async () => {
    if (!nueva.descripcion) return
    await supabase.from('acciones').insert({ proceso_id: procesoId, ...nueva })
    setNueva({ descripcion: '', responsable: '', plazo: '', indicador: '' })
    setAñadiendo(false)
    onRefresh()
  }

  const cambiarEstado = async (id, estado) => {
    await supabase.from('acciones').update({ estado }).eq('id', id)
    onRefresh()
  }

  const borrarAccion = async (id) => {
    await supabase.from('acciones').delete().eq('id', id)
    onRefresh()
  }

  const ec = { pendiente: C.naranja, en_curso: C.azul, completada: C.verde, cancelada: '#999' }
  const accionesIA = acciones.filter(a => a.generada_ia)
  const accionesManuales = acciones.filter(a => !a.generada_ia)
  const propuestasPendientes = (propuestasParticipantes || []).filter(p => !p.incorporada)

  return (
    <div>
      {/* Botón generar plan con IA — solo AMFE */}
      {esAMFE && acciones.filter(a => a.generada_ia).length === 0 && (
        <div style={{ background: `${C.morado}10`, border: `1px solid ${C.morado}30`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '6px' }}>
            🤖 Generación automática del plan de acción
          </div>
          <div style={{ fontSize: '12px', color: C.textoSuave, marginBottom: '10px', lineHeight: '1.5' }}>
            La IA analizará el ranking NPR y propondrá acciones concretas para cada modo de fallo crítico y moderado, con responsable, plazo e indicador.
          </div>
          {generandoPlan
            ? <CargandoIA color={C.morado} mensaje="Generando plan de acción..." />
            : <BtnPrincipal onClick={onGenerarPlan} label="🤖 Generar plan de acción con IA" color={C.morado} />
          }
        </div>
      )}

      {esAMFE && accionesIA.length > 0 && (
        <div style={{ background: `${C.verde}10`, border: `1px solid ${C.verde}30`, borderRadius: '12px', padding: '10px 14px', marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '12px', color: C.verde, fontWeight: '700' }}>✅ {accionesIA.length} acción(es) generadas por IA</div>
          {!generandoPlan && <button onClick={onGenerarPlan} style={{ background: `${C.morado}18`, border: 'none', color: C.morado, borderRadius: '8px', padding: '5px 10px', fontSize: '11px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", fontWeight: '700' }}>Regenerar</button>}
        </div>
      )}

      {/* Propuestas de participantes pendientes */}
      {propuestasPendientes.length > 0 && (
        <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: '14px', padding: '14px', marginBottom: '16px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.teal, marginBottom: '10px' }}>
            💬 {propuestasPendientes.length} propuesta(s) de participantes pendientes de revisión
          </div>
          {propuestasPendientes.map((p, i) => (
            <div key={i} style={{ background: C.blanco, borderRadius: '10px', padding: '12px', marginBottom: '8px', border: `1px solid ${C.teal}20` }}>
              <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto, marginBottom: '4px' }}>{p.descripcion}</div>
              {p.responsable && <div style={{ fontSize: '12px', color: C.textoSuave }}>👤 {p.responsable}</div>}
              <div style={{ fontSize: '11px', color: C.textoSuave, marginTop: '4px' }}>
                Propuesto por: {p.participaciones?.categoria || 'Participante'}
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <button onClick={() => onIncorporar(p)} style={{ flex: 1, padding: '7px', border: 'none', borderRadius: '8px', background: C.verde, color: C.blanco, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  ✅ Incorporar al plan
                </button>
                <button onClick={async () => { await supabase.from('propuestas_accion_participantes').update({ incorporada: true }).eq('id', p.id); onRefresh() }} style={{ flex: 1, padding: '7px', border: `1px solid ${C.rojo}30`, borderRadius: '8px', background: `${C.rojo}10`, color: C.rojo, fontSize: '12px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  ❌ Descartar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Añadir acción manual */}
      <BtnPrincipal onClick={() => setAñadiendo(!añadiendo)} label={añadiendo ? '✕ Cancelar' : '+ Nueva acción manual'} color={añadiendo ? '#999' : C.verde} />

      {añadiendo && (
        <div style={{ background: C.blanco, borderRadius: '14px', padding: '16px', margin: '12px 0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {[
            { label: 'Descripción *', key: 'descripcion', ph: 'Qué hay que hacer...' },
            { label: 'Responsable (cargo)', key: 'responsable', ph: 'Ej: Supervisora de enfermería' },
            { label: 'Indicador', key: 'indicador', ph: 'Cómo medir que se cumple...' },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: '12px' }}>
              <div style={labelStyle}>{f.label}</div>
              <input value={nueva[f.key]} onChange={e => setNueva(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph} style={inputStyle(nueva[f.key])} />
            </div>
          ))}
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Plazo</div>
            <input type="date" value={nueva.plazo} onChange={e => setNueva(p => ({ ...p, plazo: e.target.value }))} style={inputStyle(nueva.plazo)} />
          </div>
          <BtnPrincipal onClick={crear} label="Guardar acción" activo={!!nueva.descripcion} />
        </div>
      )}

      {acciones.length === 0 && !añadiendo && !generandoPlan && (
        <div style={{ textAlign: 'center', padding: '30px', color: C.textoSuave }}>
          {esAMFE ? 'Genera el plan con IA o añade acciones manualmente' : 'Añade las acciones del plan de mejora'}
        </div>
      )}

      {/* Lista de acciones */}
      {acciones.map((a, i) => (
        <div key={i} style={{
          background: C.blanco, borderRadius: '12px', padding: '14px', marginBottom: '10px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          borderLeft: `3px solid ${a.generada_ia ? C.morado : C.verde}`,
        }}>
          {a.generada_ia && (
            <div style={{ fontSize: '10px', fontWeight: '700', color: C.morado, marginBottom: '4px', letterSpacing: '0.5px' }}>IA</div>
          )}
          <div style={{ fontSize: '13px', fontWeight: '600', color: C.texto, marginBottom: '6px', lineHeight: '1.4' }}>{a.descripcion}</div>
          {a.responsable && <div style={{ fontSize: '12px', color: C.textoSuave }}>👤 {a.responsable}</div>}
          {a.plazo && <div style={{ fontSize: '12px', color: C.textoSuave }}>📅 {new Date(a.plazo).toLocaleDateString('es-ES')}</div>}
          {a.indicador && <div style={{ fontSize: '12px', color: C.textoSuave }}>📊 {a.indicador}</div>}
          {a.observaciones && <div style={{ fontSize: '11px', color: C.textoSuave, marginTop: '4px', fontStyle: 'italic' }}>{a.observaciones}</div>}
          {a.comentarios_participantes && (
            <div style={{ background: `${C.teal}10`, borderRadius: '8px', padding: '8px', marginTop: '8px', border: `1px solid ${C.teal}20` }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: C.teal, marginBottom: '3px' }}>💬 Comentarios de profesionales</div>
              <div style={{ fontSize: '12px', color: C.texto }}>{a.comentarios_participantes}</div>
            </div>
          )}
          <div style={{ marginTop: '10px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {['pendiente', 'en_curso', 'completada'].map(e => (
              <button key={e} onClick={() => cambiarEstado(a.id, e)} style={{
                padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '11px', cursor: 'pointer',
                fontFamily: "'DM Sans',sans-serif", fontWeight: '700',
                background: a.estado === e ? ec[e] : `${ec[e]}18`,
                color: a.estado === e ? C.blanco : ec[e],
              }}>{e.replace('_', ' ')}</button>
            ))}
            <button onClick={() => borrarAccion(a.id)} style={{
              padding: '4px 10px', borderRadius: '20px', border: 'none', fontSize: '11px', cursor: 'pointer',
              fontFamily: "'DM Sans',sans-serif", fontWeight: '700',
              background: `${C.rojo}18`, color: C.rojo,
            }}>🗑</button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ── TAB PINES ──────────────────────────────────────────────────
function TabPines({ procesoId }) {
  const [pines, setPines] = useState([])
  const [nuevoPin, setNuevoPin] = useState('')
  const [nuevaCat, setNuevaCat] = useState('')
  const [cargando, setCargando] = useState(true)
  const [modalBorrar, setModalBorrar] = useState(null)

  useEffect(() => { cargar() }, [])
  const cargar = async () => { const { data } = await supabase.from('pines_permitidos').select('*').eq('proceso_id', procesoId).order('created_at'); setPines(data || []); setCargando(false) }
  const añadir = async () => { if (!nuevoPin.trim() || nuevoPin.length > 4) return; await supabase.from('pines_permitidos').upsert({ proceso_id: procesoId, pin: nuevoPin.trim(), categoria: nuevaCat || null }, { onConflict: 'proceso_id,pin' }); setNuevoPin(''); setNuevaCat(''); cargar() }
  const borrar = async (id) => { await supabase.from('pines_permitidos').delete().eq('id', id); setModalBorrar(null); cargar() }
  const importarCSV = (e) => {
    const file = e.target.files[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const lineas = ev.target.result.split('\n').filter(l => l.trim())
      const registros = lineas.map(l => { const p = l.split(',').map(x => x.trim().replace(/"/g, '')); return /^\d{1,4}$/.test(p[0]) ? { proceso_id: procesoId, pin: p[0], categoria: p[1] || null } : null }).filter(Boolean)
      if (registros.length > 0) { await supabase.from('pines_permitidos').upsert(registros, { onConflict: 'proceso_id,pin' }); cargar() }
    }
    reader.readAsText(file); e.target.value = ''
  }

  return (
    <div>
      <AlertaInfo titulo="Control de acceso por PIN" texto={pines.length === 0 ? "Sin restricciones: cualquier PIN puede acceder. Añade PINs para restringir el acceso." : `Acceso restringido a ${pines.length} PIN(s). Solo estos profesionales pueden unirse.`} color={pines.length === 0 ? C.azul : C.verde} />
      <div style={{ background: C.blanco, borderRadius: '14px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={labelStyle}>Añadir PIN manualmente</div>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
          <input value={nuevoPin} onChange={e => { if (e.target.value.length <= 4 && /^\d*$/.test(e.target.value)) setNuevoPin(e.target.value) }} placeholder="PIN" style={{ ...inputStyle(nuevoPin), flex: '0 0 100px' }} />
          <input value={nuevaCat} onChange={e => setNuevaCat(e.target.value)} placeholder="Categoría (opcional)" style={{ ...inputStyle(nuevaCat), flex: 1 }} />
        </div>
        <BtnPrincipal onClick={añadir} label="Añadir PIN" activo={nuevoPin.length > 0} />
      </div>
      <div style={{ background: `${C.teal}10`, border: `1px solid ${C.teal}30`, borderRadius: '12px', padding: '14px', marginBottom: '16px' }}>
        <div style={{ fontSize: '12px', fontWeight: '700', color: C.teal, marginBottom: '6px' }}>📂 Importar CSV</div>
        <div style={{ fontSize: '12px', color: C.textoSuave, marginBottom: '10px' }}>Formato: <code>PIN,Categoría</code> (una línea por profesional)</div>
        <label style={{ display: 'inline-block', padding: '8px 16px', background: C.teal, color: C.blanco, borderRadius: '8px', fontSize: '13px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
          Seleccionar CSV<input type="file" accept=".csv,.txt" onChange={importarCSV} style={{ display: 'none' }} />
        </label>
      </div>
      {cargando && <div style={{ textAlign: 'center', padding: '20px', color: C.textoSuave }}>Cargando...</div>}
      {!cargando && pines.length === 0 && <div style={{ textAlign: 'center', padding: '20px', color: C.textoSuave }}>Sin PINs registrados (acceso abierto)</div>}
      {pines.map((p, i) => (
        <div key={i} style={{ background: C.blanco, borderRadius: '10px', padding: '12px 14px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 6px rgba(0,0,0,0.04)' }}>
          <div><span style={{ fontFamily: 'monospace', fontWeight: '700', fontSize: '16px', color: C.verde }}>{p.pin}</span>{p.categoria && <span style={{ fontSize: '12px', color: C.textoSuave, marginLeft: '10px' }}>{p.categoria}</span>}</div>
          <button onClick={() => setModalBorrar(p)} style={{ background: `${C.rojo}15`, border: 'none', color: C.rojo, borderRadius: '8px', padding: '5px 10px', cursor: 'pointer', fontSize: '12px', fontFamily: "'DM Sans',sans-serif" }}>✕</button>
        </div>
      ))}
      <ModalConfirm visible={!!modalBorrar} titulo="¿Eliminar PIN?" mensaje={`Se eliminará el acceso del PIN ${modalBorrar?.pin}.`} labelBtn="Eliminar" colorBtn={C.rojo} onConfirmar={() => borrar(modalBorrar.id)} onCancelar={() => setModalBorrar(null)} />
    </div>
  )
}

// ── TAB INFORME ────────────────────────────────────────────────
function TabInforme({ informe, proceso, ranking, fusiones, pasos, acciones, aportaciones, generandoInforme, onGenerar, esAMFE, onActualizarFusiones }) {
  const [participantes, setParticipantes] = useState('')
  const [coordinadores, setCoordinadores] = useState('')
  const [guardandoMeta, setGuardandoMeta] = useState(false)
  const [factibilidades, setFactibilidades] = useState({})
  const [guardandoFact, setGuardandoFact] = useState(false)

  const modos = (fusiones && fusiones.length > 0) ? fusiones : ranking

  const guardarMetadatos = async () => {
    setGuardandoMeta(true)
    await supabase.from('procesos').update({
      informe_participantes: participantes,
      informe_coordinadores: coordinadores,
    }).eq('id', proceso.id)
    setGuardandoMeta(false)
  }

  const guardarFactibilidades = async () => {
    setGuardandoFact(true)
    for (const [id, texto] of Object.entries(factibilidades)) {
      await supabase.from('fusiones_amfe').update({ factibilidad: texto }).eq('id', id)
    }
    if (onActualizarFusiones) await onActualizarFusiones()
    setGuardandoFact(false)
  }

  const cats = [...new Set(aportaciones.map(a => a.participaciones?.categoria).filter(Boolean))]

  return (
    <div>
      {/* Campos de metadatos — solo para AMFE */}
      {esAMFE && (
        <div style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '12px' }}>
            📋 Datos del informe
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Coordinadores de calidad (uno por línea)</div>
            <textarea value={coordinadores} onChange={e => setCoordinadores(e.target.value)}
              placeholder="Nombre y apellidos del coordinador&#10;Nombre y apellidos de otro coordinador..."
              rows={3} style={{ ...inputStyle(coordinadores), resize: 'vertical', fontFamily: "'DM Sans',sans-serif", lineHeight: '1.5' }} />
          </div>
          <div style={{ marginBottom: '12px' }}>
            <div style={labelStyle}>Participantes (uno por línea, opcional)</div>
            <div style={{ fontSize: '11px', color: C.textoSuave, marginBottom: '6px' }}>
              Categorías detectadas: <strong>{cats.join(', ') || '—'}</strong>
            </div>
            <textarea value={participantes} onChange={e => setParticipantes(e.target.value)}
              placeholder="Nombre y categoría del participante&#10;Nombre y categoría del participante..."
              rows={4} style={{ ...inputStyle(participantes), resize: 'vertical', fontFamily: "'DM Sans',sans-serif", lineHeight: '1.5' }} />
          </div>
          <BtnPrincipal onClick={guardarMetadatos} label={guardandoMeta ? 'Guardando...' : 'Guardar datos'} activo={!guardandoMeta} color={C.teal} style={{ marginTop: 0 }} />
        </div>
      )}

      {/* Factibilidad por modo de fallo — solo AMFE */}
      {esAMFE && modos.length > 0 && (
        <div style={{ background: C.blanco, borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: C.morado, marginBottom: '12px' }}>
            ⚙️ Factibilidad / Viabilidad por modo de fallo
          </div>
          {modos.map((m, i) => (
            <div key={m.id || i} style={{ marginBottom: '10px', paddingBottom: '10px', borderBottom: i < modos.length - 1 ? `1px solid ${C.grisMedio}` : 'none' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: C.texto, marginBottom: '5px' }}>
                {i + 1}. {m.modo_fusionado || m.modo_fallo}
                <span style={{ marginLeft: '8px', fontSize: '11px', color: m.npr_medio >= 100 || m.severidad_media >= 8 ? C.rojo : C.textoSuave }}>
                  NPR {Number(m.npr_medio).toFixed(0)}
                </span>
              </div>
              <input
                value={factibilidades[m.id] !== undefined ? factibilidades[m.id] : (m.factibilidad || '')}
                onChange={e => setFactibilidades(prev => ({ ...prev, [m.id]: e.target.value }))}
                placeholder="Valoración de factibilidad y viabilidad de las acciones..."
                style={{ ...inputStyle(factibilidades[m.id] || m.factibilidad), fontSize: '12px' }}
              />
            </div>
          ))}
          <BtnPrincipal onClick={guardarFactibilidades} label={guardandoFact ? 'Guardando...' : 'Guardar factibilidades'} activo={!guardandoFact} color={C.morado} style={{ marginTop: '8px' }} />
        </div>
      )}

      {/* Resumen IA */}
      {!informe && !generandoInforme && (
        <AlertaInfo titulo="Informe no generado" texto="Rellena los datos del informe y genera el resumen ejecutivo con IA." color={C.azul} />
      )}
      {generandoInforme && <CargandoIA color={C.verde} mensaje="Generando informe ejecutivo con IA..." />}
      {informe && !generandoInforme && (
        <div style={{ background: `${C.verde}08`, border: `1px solid ${C.verde}20`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: C.verde, marginBottom: '12px' }}>
            🤖 RESUMEN EJECUTIVO · {proceso.codigo}
          </div>
          <div style={{ fontSize: '13px', color: C.texto, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{informe.contenido_ia}</div>
        </div>
      )}

      <BtnPrincipal onClick={onGenerar} label={informe ? '🔄 Regenerar resumen con IA' : '🤖 Generar resumen ejecutivo con IA'} activo={!generandoInforme} color={C.teal} />

      {/* Exportación */}
      {informe && (
        <>
          <div style={{ fontSize: '12px', fontWeight: '700', color: C.textoSuave, marginTop: '20px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {esAMFE ? 'Informe AMFE completo' : 'Informe del proceso'}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <button onClick={() => esAMFE
              ? exportarInformeAMFEPDF({ proceso, pasos: pasos || [], modos: modos || [], acciones, aportaciones, resumenIA: informe?.contenido_ia, participantes, coordinadores })
              : exportarPDF(proceso, informe?.contenido_ia, ranking, acciones, aportaciones, false)
            } style={{ padding: '14px', border: `2px solid ${C.rojo}`, borderRadius: '12px', background: `${C.rojo}10`, color: C.rojo, fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              📄 PDF {esAMFE ? '(Tabla AMFE)' : ''}
            </button>
            <button onClick={() => esAMFE
              ? exportarInformeAMFERTF({ proceso, pasos: pasos || [], modos: modos || [], acciones, aportaciones, resumenIA: informe?.contenido_ia, participantes, coordinadores })
              : exportarRTF(proceso, informe?.contenido_ia, ranking, acciones, aportaciones, false)
            } style={{ padding: '14px', border: `2px solid ${C.azul}`, borderRadius: '12px', background: `${C.azul}10`, color: C.azul, fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
              📝 RTF {esAMFE ? '(Word)' : ''}
            </button>
          </div>

          {/* Documento de seguimiento — solo si hay acciones */}
          {acciones.length > 0 && (
            <>
              <div style={{ fontSize: '12px', fontWeight: '700', color: C.textoSuave, marginTop: '16px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Documento de seguimiento de acciones
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button onClick={() => exportarSeguimientoPDF({ proceso, acciones })}
                  style={{ padding: '14px', border: `2px solid ${C.verde}`, borderRadius: '12px', background: `${C.verde}10`, color: C.verde, fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  📄 Seguimiento PDF
                </button>
                <button onClick={() => exportarSeguimientoRTF({ proceso, acciones })}
                  style={{ padding: '14px', border: `2px solid ${C.teal}`, borderRadius: '12px', background: `${C.teal}10`, color: C.teal, fontWeight: '700', fontSize: '13px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>
                  📝 Seguimiento RTF
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

