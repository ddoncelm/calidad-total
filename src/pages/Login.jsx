import { useState } from 'react'
import { C, CATEGORIAS, isHeader, PASSWORD_COORDINADOR } from '../lib/constants.js'
import { Isologo, FooterDP, BtnPrincipal, inputStyle, labelStyle } from '../components/UI.jsx'

export default function PaginaLogin({ onLogin }) {
  const [modo, setModo] = useState(null)
  const [pwd, setPwd] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [error, setError] = useState('')
  const [pin, setPin] = useState('')
  const [categoria, setCategoria] = useState('')
  const [codigo, setCodigo] = useState('')

  const entrarCoordinador = () => {
    if (pwd === PASSWORD_COORDINADOR) onLogin({ rol: 'coordinador' })
    else setError('Contraseña incorrecta')
  }

  const entrarParticipante = () => {
    if (!pin || pin.length > 4) { setError('PIN de hasta 4 dígitos'); return }
    if (!categoria || isHeader(categoria)) { setError('Selecciona tu categoría'); return }
    if (!codigo.trim()) { setError('Introduce el código del proceso'); return }
    onLogin({ rol: 'participante', pin, categoria, codigo: codigo.toUpperCase().trim() })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg,${C.gris} 0%,#e8f5e8 55%,${C.grisMedio} 100%)`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '24px', fontFamily: "'DM Sans',sans-serif",
    }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '6px', background: `linear-gradient(90deg,${C.verde},${C.teal},${C.azul})` }} />

      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '13px', color: C.textoSuave, letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '8px' }}>
          Servicio Andaluz de Salud
        </div>
        <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: '30px', color: C.verde, lineHeight: 1 }}>
          Calidad<span style={{ color: C.teal }}>Total</span>
        </div>
        <div style={{ fontSize: '11px', color: C.textoSuave, marginTop: '6px', letterSpacing: '1px' }}>
          MEJORA CONTINUA · SEGURIDAD DEL PACIENTE · AMFE
        </div>
      </div>

      <div style={{ background: C.blanco, borderRadius: '24px', padding: '32px 28px', width: '100%', maxWidth: '380px', boxShadow: '0 8px 40px rgba(45,122,58,0.12)', animation: 'fadeIn 0.4s ease' }}>
        {!modo && (
          <>
            <div style={{ fontSize: '15px', fontWeight: '600', color: C.texto, textAlign: 'center', marginBottom: '20px' }}>¿Cómo accedes?</div>
            <button onClick={() => setModo('coordinador')} style={btnModoStyle(C.verde)}>
              <span style={{ fontSize: '24px' }}>🏥</span>
              <div><div style={{ fontWeight: '700', fontSize: '15px' }}>Coordinador de Calidad</div><div style={{ fontSize: '12px', opacity: 0.8 }}>Gestión completa de procesos</div></div>
            </button>
            <button onClick={() => setModo('participante')} style={{ ...btnModoStyle(C.teal), marginTop: '12px' }}>
              <span style={{ fontSize: '24px' }}>👤</span>
              <div><div style={{ fontWeight: '700', fontSize: '15px' }}>Profesional participante</div><div style={{ fontSize: '12px', opacity: 0.8 }}>Accede con PIN y código de proceso</div></div>
            </button>
          </>
        )}

        {modo === 'coordinador' && (
          <>
            <button onClick={() => { setModo(null); setError(''); setPwd('') }} style={btnVolverStyle}>← Volver</button>
            <div style={{ fontSize: '15px', fontWeight: '700', color: C.verde, marginBottom: '20px' }}>🏥 Acceso Coordinador</div>
            <div style={{ marginBottom: '16px' }}>
              <label style={labelStyle}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input type={showPwd ? 'text' : 'password'} value={pwd}
                  onChange={e => { setPwd(e.target.value); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && entrarCoordinador()}
                  placeholder="Contraseña de coordinador"
                  style={{ ...inputStyle(pwd), paddingRight: '48px' }} />
                <button onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px' }}>
                  {showPwd ? '🙈' : '👁'}
                </button>
              </div>
            </div>
            {error && <div style={{ color: C.rojo, fontSize: '12px', marginBottom: '12px' }}>⚠ {error}</div>}
            <BtnPrincipal onClick={entrarCoordinador} label="Acceder como coordinador" activo={!!pwd} />
          </>
        )}

        {modo === 'participante' && (
          <>
            <button onClick={() => { setModo(null); setError('') }} style={btnVolverStyle}>← Volver</button>
            <div style={{ fontSize: '15px', fontWeight: '700', color: C.teal, marginBottom: '20px' }}>👤 Acceso Participante</div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Código del proceso *</label>
              <input type="text" value={codigo} onChange={e => { setCodigo(e.target.value.toUpperCase()); setError('') }}
                placeholder="Ej: LEAN-2026-001 / AMFE-2026-001" style={inputStyle(codigo)} />
            </div>
            <div style={{ marginBottom: '14px' }}>
              <label style={labelStyle}>Tu PIN (hasta 4 dígitos) *</label>
              <input type="number" value={pin}
                onChange={e => { if (e.target.value.length <= 4) { setPin(e.target.value); setError('') } }}
                placeholder="1234" style={inputStyle(pin)} />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={labelStyle}>Categoría profesional *</label>
              <select value={categoria} onChange={e => { setCategoria(e.target.value); setError('') }} style={inputStyle(categoria && !isHeader(categoria))}>
                <option value="">Selecciona tu categoría...</option>
                {CATEGORIAS.map((cat, i) => (
                  <option key={i} value={cat} disabled={isHeader(cat)}
                    style={{ color: isHeader(cat) ? '#aaa' : C.texto, fontWeight: isHeader(cat) ? '700' : '400' }}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            {error && <div style={{ color: C.rojo, fontSize: '12px', marginBottom: '12px' }}>⚠ {error}</div>}
            <BtnPrincipal onClick={entrarParticipante} label="Unirme al proceso" activo={!!(pin && categoria && !isHeader(categoria) && codigo)} color={C.teal} />
          </>
        )}
      </div>

      <div style={{ marginTop: '24px' }}><FooterDP /></div>
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}

const btnModoStyle = (color) => ({
  width: '100%', padding: '16px', background: `${color}10`,
  border: `2px solid ${color}30`, borderRadius: '14px', cursor: 'pointer',
  display: 'flex', alignItems: 'center', gap: '14px',
  color: C.texto, textAlign: 'left', fontFamily: "'DM Sans',sans-serif", transition: 'all 0.2s',
})

const btnVolverStyle = {
  background: 'none', border: 'none', color: C.textoSuave,
  cursor: 'pointer', fontSize: '13px', marginBottom: '16px',
  fontFamily: "'DM Sans',sans-serif", padding: 0,
}
