import { useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { C, TIPOS_SUCESO } from '../lib/constants.js'
import { llamarIA, promptRCA, extraerPropuestas } from '../lib/ia.js'
import { ModuloWrapper, BtnPrincipal, CargandoIA, AlertaInfo, inputStyle, labelStyle } from '../components/UI.jsx'

export default function ModuloRCA({ proceso, participacion, onFinalizar }) {
  const [fase, setFase] = useState(0)
  const [tipoSuceso, setTipoSuceso] = useState('')
  const [cuando, setCuando] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [factores, setFactores] = useState({ humanos: '', organizativos: '', tecnicos: '', entorno: '', paciente: '' })
  const [analisisIA, setAnalisisIA] = useState('')
  const [cargando, setCargando] = useState(false)

  const analizarRCA = async () => {
    setCargando(true); setFase(2)
    try {
      const texto = await llamarIA(promptRCA({ unidad: participacion.unidad || proceso.unidad, categoria: participacion.categoria, tipoSuceso, descripcion, cuando, factores }))
      setAnalisisIA(texto)
      const props = extraerPropuestas(texto)
      await supabase.from('aportaciones_rca').insert({ participacion_id: participacion.id, proceso_id: proceso.id, tipo_suceso: tipoSuceso, fecha_suceso: cuando, descripcion, factor_humano: factores.humanos, factor_organizativo: factores.organizativos, factor_tecnico: factores.tecnicos, factor_entorno: factores.entorno, factor_paciente: factores.paciente, analisis_ia: texto, completed_at: new Date().toISOString() })
      if (props.length > 0) await supabase.from('propuestas').insert(props.map(p => ({ proceso_id: proceso.id, texto: p, origen: 'ia' })))
    } catch (e) { setAnalisisIA('Error al conectar con la IA.') }
    setCargando(false)
  }

  const FACTORES = [
    { key: 'humanos',       label: 'Factores humanos',                placeholder: 'Comunicación, formación, fatiga, distracciones...' },
    { key: 'organizativos', label: 'Factores organizativos',          placeholder: 'Protocolos, dotación, carga de trabajo, cultura...' },
    { key: 'tecnicos',      label: 'Factores técnicos / equipamiento', placeholder: 'Fallos de equipos, sistemas informáticos...' },
    { key: 'entorno',       label: 'Factores de entorno',             placeholder: 'Ruido, iluminación, espacio, interrupciones...' },
    { key: 'paciente',      label: 'Factores del paciente',           placeholder: 'Complejidad clínica, comorbilidades...' },
  ]

  if (fase === 0) return (
    <ModuloWrapper titulo="Sucesos Centinela" subtitulo="Fase 1 · Descripción" color={C.rojo} onVolver={onFinalizar} progreso={25}>
      <AlertaInfo titulo={`Proceso ${proceso.codigo}`} texto={proceso.titulo} color={C.rojo} />
      <AlertaInfo titulo="⚠ Confidencialidad" texto="No incluyas datos identificativos de pacientes ni de profesionales." color={C.naranja} />
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Tipo de suceso centinela *</label>
        <select value={tipoSuceso} onChange={e => setTipoSuceso(e.target.value)} style={inputStyle(tipoSuceso)}>
          <option value="">Selecciona el tipo...</option>
          {TIPOS_SUCESO.map((t, i) => <option key={i} value={t}>{t}</option>)}
        </select>
      </div>
      <div style={{ marginBottom: '14px' }}>
        <label style={labelStyle}>Fecha del suceso *</label>
        <input type="date" value={cuando} onChange={e => setCuando(e.target.value)} style={inputStyle(cuando)} />
      </div>
      <div style={{ marginBottom: '20px' }}>
        <label style={labelStyle}>Descripción * <span style={{ color: '#aaa', fontWeight: 400, textTransform: 'none' }}>(sin datos identificativos)</span></label>
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
          placeholder="Qué ocurrió, cómo se detectó y cuál fue el desenlace inmediato..." rows={5}
          style={{ ...inputStyle(descripcion), resize: 'vertical', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }} />
      </div>
      <BtnPrincipal onClick={() => tipoSuceso && cuando && descripcion.trim() && setFase(1)} activo={!!(tipoSuceso && cuando && descripcion.trim())} label="Continuar → Factores contribuyentes" color={C.rojo} />
    </ModuloWrapper>
  )

  if (fase === 1) return (
    <ModuloWrapper titulo="Sucesos Centinela" subtitulo="Fase 2 · Factores contribuyentes" color={C.rojo} onVolver={() => setFase(0)} progreso={55}>
      <div style={{ fontSize: '13px', color: C.textoSuave, marginBottom: '16px' }}>Enfoque sistémico y no culpabilizador. Completa los que apliquen.</div>
      {FACTORES.map(f => (
        <div key={f.key} style={{ marginBottom: '14px' }}>
          <label style={{ ...labelStyle, color: C.rojo }}>{f.label}</label>
          <textarea value={factores[f.key]} onChange={e => setFactores(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder} rows={2}
            style={{ ...inputStyle(factores[f.key]), resize: 'vertical', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }} />
        </div>
      ))}
      <BtnPrincipal onClick={analizarRCA} label="🤖 Análisis causa raíz con IA →" color={C.rojo} />
    </ModuloWrapper>
  )

  if (fase === 2) return (
    <ModuloWrapper titulo="Sucesos Centinela" subtitulo="Análisis Causa Raíz" color={C.rojo} onVolver={() => !cargando && setFase(1)} progreso={80}>
      {cargando ? <CargandoIA color={C.rojo} mensaje="Aplicando modelo sistémico de seguridad del paciente..." /> : (
        <div>
          <div style={{ background: `${C.rojo}06`, border: `1px solid ${C.rojo}20`, borderRadius: '16px', padding: '20px', marginBottom: '20px' }}>
            <div style={{ fontSize: '12px', fontWeight: '700', color: C.rojo, marginBottom: '12px' }}>🤖 ANÁLISIS CAUSA RAÍZ · {tipoSuceso.toUpperCase()}</div>
            <div style={{ fontSize: '13px', color: C.texto, lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{analisisIA}</div>
          </div>
          <BtnPrincipal onClick={() => setFase(3)} label="Finalizar →" color={C.rojo} />
        </div>
      )}
    </ModuloWrapper>
  )

  return (
    <ModuloWrapper titulo="Sucesos Centinela" subtitulo="Análisis completado" color={C.rojo} onVolver={onFinalizar} progreso={100}>
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '56px', marginBottom: '16px' }}>✅</div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '20px', color: C.rojo, marginBottom: '8px' }}>RCA registrado</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, lineHeight: '1.6', marginBottom: '24px' }}>
          El análisis del suceso <strong>{proceso.codigo}</strong> ha sido enviado al coordinador de calidad.
        </div>
        <BtnPrincipal onClick={onFinalizar} label="← Volver al inicio" color={C.azul} />
      </div>
    </ModuloWrapper>
  )
}
