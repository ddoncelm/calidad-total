import { C } from '../lib/constants.js'
import { LOGO_B64 } from '../lib/logo.js'

// ── ISOLOGO DONCELPROJECT (base64 embebido) ────────────────────
export function Isologo({ size = 40 }) {
  return (
    <a href="mailto:doncel.project@gmail.com"
      style={{ textDecoration: 'none', display: 'inline-flex', flexShrink: 0 }}>
      <img src={LOGO_B64} alt="DoncelProject" width={size} height={size}
        style={{ objectFit: 'contain', borderRadius: '6px' }} />
    </a>
  )
}

export function FooterDP() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      background: '#fff', padding: '12px 18px', borderRadius: '14px',
      boxShadow: '0 2px 16px rgba(33,150,243,0.10)', border: '1px solid #e8f0fe',
    }}>
      <Isologo size={42} />
      <div>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a1a2e', fontFamily: "'DM Sans',sans-serif" }}>
          doncel<span style={{ color: '#2196F3' }}>project</span>
        </div>
        <a href="mailto:doncel.project@gmail.com"
          style={{ fontSize: '10px', color: '#00B8D4', letterSpacing: '0.4px', fontFamily: "'DM Sans',sans-serif", textDecoration: 'none' }}>
          DONCEL.PROJECT@GMAIL.COM
        </a>
      </div>
    </div>
  )
}

// ── BOTÓN PRINCIPAL ────────────────────────────────────────────
export function BtnPrincipal({ onClick, activo = true, label, color = C.verde, style = {} }) {
  return (
    <button onClick={() => activo && onClick()} style={{
      width: '100%', padding: '15px',
      background: activo ? `linear-gradient(135deg,${color},${color}cc)` : '#ddd',
      color: activo ? C.blanco : '#aaa', border: 'none', borderRadius: '12px',
      fontSize: '15px', fontWeight: '700', fontFamily: "'DM Sans',sans-serif",
      cursor: activo ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
      boxShadow: activo ? `0 4px 16px ${color}44` : 'none', marginTop: '8px', ...style,
    }}>{label}</button>
  )
}

// ── MODAL CONFIRMACIÓN ─────────────────────────────────────────
export function ModalConfirm({ visible, titulo, mensaje, onConfirmar, onCancelar, colorBtn = C.rojo, labelBtn = 'Confirmar' }) {
  if (!visible) return null
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ background: C.blanco, borderRadius: '20px', padding: '28px 24px', width: '100%', maxWidth: '340px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        <div style={{ fontSize: '32px', textAlign: 'center', marginBottom: '12px' }}>⚠️</div>
        <div style={{ fontSize: '17px', fontWeight: '700', color: C.texto, textAlign: 'center', marginBottom: '8px' }}>{titulo}</div>
        <div style={{ fontSize: '13px', color: C.textoSuave, textAlign: 'center', lineHeight: '1.5', marginBottom: '24px' }}>{mensaje}</div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={onCancelar} style={{ flex: 1, padding: '12px', border: `2px solid ${C.grisMedio}`, borderRadius: '10px', background: C.blanco, color: C.textoSuave, fontSize: '14px', fontWeight: '600', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>Cancelar</button>
          <button onClick={onConfirmar} style={{ flex: 1, padding: '12px', border: 'none', borderRadius: '10px', background: colorBtn, color: C.blanco, fontSize: '14px', fontWeight: '700', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif" }}>{labelBtn}</button>
        </div>
      </div>
    </div>
  )
}

export function ModuloWrapper({ titulo, subtitulo, color, onVolver, progreso, children }) {
  return (
    <div style={{ minHeight: '100vh', background: `linear-gradient(160deg,${C.gris} 0%,#e8f5e8 60%,${C.grisMedio} 100%)` }}>
      <div style={{ background: `linear-gradient(135deg,${color},${color}cc)`, padding: '16px 20px 24px', borderRadius: '0 0 24px 24px', boxShadow: `0 4px 16px ${color}44` }}>
        <button onClick={onVolver} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: C.blanco, borderRadius: '10px', padding: '6px 14px', fontSize: '13px', cursor: 'pointer', marginBottom: '12px', fontFamily: "'DM Sans',sans-serif" }}>← Volver</button>
        <div style={{ fontSize: '19px', fontWeight: '700', color: C.blanco, fontFamily: "'DM Serif Display',serif" }}>{titulo}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.8)', marginTop: '2px' }}>{subtitulo}</div>
        <div style={{ marginTop: '14px', height: '4px', background: 'rgba(255,255,255,0.3)', borderRadius: '4px', overflow: 'hidden' }}>
          <div style={{ height: '100%', background: C.blanco, borderRadius: '4px', width: `${progreso}%`, transition: 'width 0.5s ease' }} />
        </div>
        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.7)', marginTop: '4px', textAlign: 'right' }}>{progreso}% completado</div>
      </div>
      <div style={{ padding: '20px' }}>{children}</div>
    </div>
  )
}

export function CargandoIA({ color = C.verde, mensaje = 'Analizando con IA...' }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px' }}>
      <div style={{ fontSize: '42px', marginBottom: '16px' }}>🤖</div>
      <div style={{ fontSize: '16px', fontWeight: '700', color, fontFamily: "'DM Sans',sans-serif" }}>{mensaje}</div>
      <div style={{ marginTop: '24px', height: '4px', background: C.grisMedio, borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: `linear-gradient(90deg,${color},${color}88)`, borderRadius: '4px', animation: 'loadingBar 1.5s ease-in-out infinite', width: '50%' }} />
      </div>
      <style>{`@keyframes loadingBar{0%{transform:translateX(-100%)}100%{transform:translateX(300%)}}`}</style>
    </div>
  )
}

export function AlertaInfo({ titulo, texto, color = C.azul }) {
  return (
    <div style={{ background: `${color}10`, border: `1px solid ${color}30`, borderRadius: '12px', padding: '12px 14px', marginBottom: '16px', borderLeft: `3px solid ${color}` }}>
      <div style={{ fontSize: '12px', fontWeight: '700', color, fontFamily: "'DM Sans',sans-serif" }}>{titulo}</div>
      <div style={{ fontSize: '12px', color: C.textoSuave, marginTop: '4px', lineHeight: '1.5', fontFamily: "'DM Sans',sans-serif" }}>{texto}</div>
    </div>
  )
}

export function EstadoBadge({ estado }) {
  const cfg = {
    aportaciones: { label: 'Recogiendo aportaciones', color: C.azul },
    puntuacion:   { label: 'Fase de puntuación',       color: C.morado },
    votacion:     { label: 'Fase de votación',          color: C.naranja },
    plan_accion:  { label: 'Plan de acción',            color: C.teal },
    seguimiento:  { label: 'Seguimiento',               color: C.verdeClaro },
    cerrado:      { label: 'Cerrado',                   color: '#999' },
    archivado:    { label: 'Archivado',                 color: '#bbb' },
  }
  const c = cfg[estado] || cfg.aportaciones
  return (
    <span style={{ background: `${c.color}18`, color: c.color, fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '20px', fontFamily: "'DM Sans',sans-serif", whiteSpace: 'nowrap' }}>
      {c.label}
    </span>
  )
}

export const inputStyle = (hasValue) => ({
  width: '100%', padding: '13px 16px',
  border: `2px solid ${hasValue ? C.verde : '#e0e0e0'}`,
  borderRadius: '10px', fontSize: '14px',
  fontFamily: "'DM Sans',sans-serif", outline: 'none',
  boxSizing: 'border-box', background: '#fafffe', color: C.texto, transition: 'border-color 0.2s',
})

export const labelStyle = {
  fontSize: '11px', fontWeight: '700', color: '#666',
  letterSpacing: '0.5px', textTransform: 'uppercase',
  display: 'block', marginBottom: '6px', fontFamily: "'DM Sans',sans-serif",
}
