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
    setCargando(false)
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

            {proceso.estado === 'plan_accion' && <AlertaInfo titulo="📋 Plan de acción en elaboración" texto="El coordinador está elaborando el plan de acción con las propuestas mejor valoradas." color={C.azul} />}
            {proceso.estado === 'seguimiento' && <AlertaInfo titulo="📊 Fase de seguimiento" texto="El plan de acción está en marcha. Consulta con el coordinador el estado de las acciones." color={C.verdeClaro} />}
            {proceso.estado === 'cerrado' && <AlertaInfo titulo="✅ Proceso finalizado" texto="Gracias por tu participación en la mejora de tu unidad." color="#999" />}
          </>
        )}
      </div>
    </div>
  )
}
