export function exportarPDF(proceso, contenidoIA, ranking, acciones, aportaciones, esAMFE = false) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const tipo = esAMFE
    ? 'Análisis Modal de Fallos y Efectos (AMFE)'
    : proceso.tipo === 'lean'
      ? 'Plan de Mejora Continua · Metodología Lean'
      : 'Análisis de Suceso Centinela · RCA'
  const colorPrincipal = esAMFE ? '#6c3483' : proceso.tipo === 'lean' ? '#2d7a3a' : '#c0392b'

  const topRanking = esAMFE
    ? ranking.slice(0, 8).map((r, i) => `
        <div class="propuesta-item">
          <div class="propuesta-num" style="background:${r.severidad_media >= 8 ? '#c0392b' : colorPrincipal}">${i + 1}</div>
          <div style="flex:1">
            <div style="font-weight:600">${r.modo_fallo}</div>
            <div style="font-size:9.5pt;color:#666;margin-top:3px">Paso: ${r.paso_descripcion || ''}</div>
            ${r.severidad_media >= 8 ? '<div style="color:#c0392b;font-size:9pt;font-weight:700">⚠ SEVERIDAD CRÍTICA ≥8</div>' : ''}
          </div>
          <div style="text-align:center;flex-shrink:0">
            <div class="propuesta-score" style="background:${r.npr_medio >= 100 ? '#fde8e8' : '#e8f5e8'};color:${r.npr_medio >= 100 ? '#c0392b' : colorPrincipal}">NPR ${r.npr_medio?.toFixed(0)}</div>
            <div style="font-size:8pt;color:#999;margin-top:3px">S${r.severidad_media?.toFixed(1)}·O${r.ocurrencia_media?.toFixed(1)}·D${r.detectabilidad_media?.toFixed(1)}</div>
          </div>
        </div>`).join('')
    : ranking.slice(0, 8).map((r, i) => `
        <div class="propuesta-item">
          <div class="propuesta-num">${i + 1}</div>
          <div style="flex:1">${r.texto}</div>
          <div class="propuesta-score">${(r.puntuacion_final * 100 / 3).toFixed(0)}/100</div>
        </div>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>${proceso.codigo} · Calidad Total SAS</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:11pt;color:#1a2e1a;line-height:1.6}
.cab{background:linear-gradient(135deg,${colorPrincipal},${colorPrincipal}bb);color:#fff;padding:24px 32px;margin-bottom:28px}
.cab h1{font-size:20pt;font-weight:800;letter-spacing:-0.5px}
.cab .sub{font-size:10pt;opacity:.85;margin-top:4px}
.cab .meta{margin-top:14px;display:flex;gap:20px;flex-wrap:wrap;font-size:10pt;opacity:.9}
.sec{padding:0 32px;margin-bottom:24px}
.sec h2{font-size:13pt;font-weight:700;color:${colorPrincipal};border-bottom:2px solid #dde8dd;padding-bottom:6px;margin-bottom:14px}
.ia{background:#f4f9f4;border-left:3px solid ${colorPrincipal};padding:16px;border-radius:4px;white-space:pre-wrap;font-size:10.5pt;line-height:1.7}
.propuesta-item{display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #eee;align-items:flex-start}
.propuesta-num{background:${colorPrincipal};color:#fff;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:11pt;flex-shrink:0}
.propuesta-score{background:#e8f5e8;color:${colorPrincipal};font-weight:700;padding:2px 8px;border-radius:10px;font-size:9pt;white-space:nowrap}
.accion{padding:10px;background:#f8f8f8;border-radius:6px;margin-bottom:8px}
.stats{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px}
.stat{background:#e8f5e8;border-radius:8px;padding:10px 16px;text-align:center}
.stat .n{font-size:20pt;font-weight:800;color:${colorPrincipal}}
.stat .l{font-size:9pt;color:#5a7a5a}
.footer{margin-top:32px;padding:16px 32px;border-top:2px solid #dde8dd;display:flex;justify-content:space-between;font-size:9pt;color:#999}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cab">
  <div class="sub">${tipo}</div>
  <h1>${proceso.titulo}</h1>
  <div class="meta">
    <span>📋 ${proceso.codigo}</span>
    <span>📍 ${proceso.unidad}</span>
    <span>👥 ${aportaciones.length} participante(s)</span>
    <span>📅 ${fecha}</span>
  </div>
</div>
<div class="sec">
  <div class="stats">
    <div class="stat"><div class="n">${aportaciones.length}</div><div class="l">Participantes</div></div>
    <div class="stat"><div class="n">${ranking.length}</div><div class="l">${esAMFE ? 'Modos de fallo' : 'Propuestas'}</div></div>
    <div class="stat"><div class="n">${acciones.length}</div><div class="l">Acciones</div></div>
    ${esAMFE ? `<div class="stat"><div class="n" style="color:#c0392b">${ranking.filter(r => r.npr_medio >= 100 || r.severidad_media >= 8).length}</div><div class="l">Críticos</div></div>` : ''}
  </div>
</div>
${contenidoIA ? `<div class="sec"><h2>Informe ejecutivo · Análisis IA</h2><div class="ia">${contenidoIA}</div></div>` : ''}
${ranking.length > 0 ? `<div class="sec"><h2>${esAMFE ? 'Ranking de riesgo · NPR' : 'Propuestas priorizadas'}</h2>${topRanking}</div>` : ''}
${acciones.length > 0 ? `<div class="sec"><h2>Plan de acción</h2>${acciones.map(a => `
  <div class="accion">
    <div style="font-weight:600;margin-bottom:4px">${a.descripcion}</div>
    <div style="font-size:9.5pt;color:#666">
      ${a.responsable ? `👤 ${a.responsable} &nbsp;` : ''}
      ${a.plazo ? `📅 ${new Date(a.plazo).toLocaleDateString('es-ES')} &nbsp;` : ''}
      ${a.indicador ? `📊 ${a.indicador}` : ''}
    </div>
  </div>`).join('')}</div>` : ''}
<div class="footer">
  <span>Calidad Total SAS · ${proceso.codigo} · ${fecha}</span>
  <span>doncelproject · doncel.project@gmail.com</span>
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

export function exportarRTF(proceso, contenidoIA, ranking, acciones, aportaciones, esAMFE = false) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const tipo = esAMFE
    ? 'Análisis Modal de Fallos y Efectos (AMFE)'
    : proceso.tipo === 'lean' ? 'Plan de Mejora Continua · Lean' : 'Análisis de Suceso Centinela · RCA'

  const e = (t) => {
    if (!t) return ''
    return String(t)
      .replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
      .replace(/á/g, "\\'e1").replace(/é/g, "\\'e9").replace(/í/g, "\\'ed")
      .replace(/ó/g, "\\'f3").replace(/ú/g, "\\'fa").replace(/ü/g, "\\'fc")
      .replace(/ñ/g, "\\'f1").replace(/Á/g, "\\'c1").replace(/É/g, "\\'c9")
      .replace(/Í/g, "\\'cd").replace(/Ó/g, "\\'d3").replace(/Ú/g, "\\'da")
      .replace(/Ñ/g, "\\'d1").replace(/\n/g, '\\line ')
  }

  const lines = [
    '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}',
    '{\\colortbl;\\red45\\green122\\blue58;\\red108\\green52\\blue131;\\red192\\green57\\blue43;}',
    '\\f0\\fs24',
    `{\\pard\\fs32\\b\\cf${esAMFE ? 2 : 1} ${e('Calidad Total SAS')}\\par}`,
    `{\\pard\\fs20 ${e(tipo)}\\par}`,
    '{\\pard\\par}',
    `{\\pard\\fs24\\b ${e(proceso.titulo)}\\par}`,
    `{\\pard\\fs20 ${e('Código: ' + proceso.codigo + ' · Unidad: ' + proceso.unidad)}\\par}`,
    `{\\pard\\fs20 ${e('Participantes: ' + aportaciones.length + ' · Fecha: ' + fecha)}\\par}`,
    '{\\pard\\par}',
  ]

  if (contenidoIA) {
    lines.push(`{\\pard\\fs24\\b\\cf${esAMFE ? 2 : 1} ${e('INFORME EJECUTIVO · ANÁLISIS IA')}\\par}`)
    lines.push('{\\pard\\par}')
    contenidoIA.split('\n').filter(l => l.trim()).forEach(p => {
      lines.push(`{\\pard\\fs22 ${e(p)}\\par}`)
    })
    lines.push('{\\pard\\par}')
  }

  if (ranking.length > 0) {
    lines.push(`{\\pard\\fs24\\b\\cf${esAMFE ? 2 : 1} ${e(esAMFE ? 'RANKING DE RIESGO · NPR' : 'PROPUESTAS PRIORIZADAS')}\\par}`)
    lines.push('{\\pard\\par}')
    ranking.slice(0, 8).forEach((r, i) => {
      if (esAMFE) {
        const alerta = (r.severidad_media >= 8 || r.npr_medio >= 100) ? ' [CRÍTICO]' : ''
        lines.push(`{\\pard\\fs22\\b ${e(`${i + 1}. ${r.modo_fallo}${alerta}`)}\\par}`)
        lines.push(`{\\pard\\fs20 ${e(`   NPR: ${r.npr_medio?.toFixed(0)} | S: ${r.severidad_media?.toFixed(1)} | O: ${r.ocurrencia_media?.toFixed(1)} | D: ${r.detectabilidad_media?.toFixed(1)}`)}\\par}`)
        lines.push(`{\\pard\\fs20 ${e(`   Efecto: ${r.efecto || ''} | Causa: ${r.causa || ''}`)}\\par}`)
      } else {
        lines.push(`{\\pard\\fs22 ${e(`${i + 1}. ${r.texto} [${(r.puntuacion_final * 100 / 3).toFixed(0)}/100]`)}\\par}`)
      }
    })
    lines.push('{\\pard\\par}')
  }

  if (acciones.length > 0) {
    lines.push(`{\\pard\\fs24\\b\\cf${esAMFE ? 2 : 1} ${e('PLAN DE ACCIÓN')}\\par}`)
    lines.push('{\\pard\\par}')
    acciones.forEach(a => {
      lines.push(`{\\pard\\fs22\\b ${e(a.descripcion)}\\par}`)
      const det = [a.responsable && `Resp: ${a.responsable}`, a.plazo && `Plazo: ${new Date(a.plazo).toLocaleDateString('es-ES')}`, `Estado: ${a.estado}`].filter(Boolean).join(' · ')
      lines.push(`{\\pard\\fs20 ${e(det)}\\par}`)
      lines.push('{\\pard\\par}')
    })
  }

  lines.push(`{\\pard\\fs18 ${e('Calidad Total SAS · ' + proceso.codigo + ' · ' + fecha + ' · doncelproject · doncel.project@gmail.com')}\\par}`)
  lines.push('}')

  const blob = new Blob([lines.join('\n')], { type: 'application/rtf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${proceso.codigo}_informe.rtf`
  a.click()
  URL.revokeObjectURL(url)
}

// ── INFORME AMFE COMPLETO — PDF ────────────────────────────────
export function exportarInformeAMFEPDF({ proceso, pasos, modos, acciones, aportaciones, resumenIA, participantes, coordinadores }) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const colorMorado = '#6c3483'
  const criticos = modos.filter(m => m.npr_medio >= 100 || m.severidad_media >= 8)

  // Construir filas de la tabla AMFE
  const filasTabla = modos.map((m, i) => {
    const accion = acciones.find(a => a.observaciones?.includes(m.modo_fusionado || m.modo_fallo)) || acciones[i] || {}
    const paso = pasos.find(p => p.id === m.paso_id) || {}
    return `
    <tr style="background:${i % 2 === 0 ? '#f9f4fd' : '#fff'};">
      <td>${paso.descripcion || '—'}</td>
      <td style="text-align:center;font-weight:700;">${i + 1}</td>
      <td style="font-weight:600;">${m.modo_fusionado || m.modo_fallo || '—'}</td>
      <td>${m.efecto || '—'}</td>
      <td>${m.causa || '—'}</td>
      <td style="text-align:center;">${Number(m.ocurrencia_media).toFixed(1)}</td>
      <td style="text-align:center;">${Number(m.severidad_media).toFixed(1)}</td>
      <td style="text-align:center;">${Number(m.detectabilidad_media).toFixed(1)}</td>
      <td style="text-align:center;font-weight:800;color:${m.npr_medio >= 100 || m.severidad_media >= 8 ? '#c0392b' : m.npr_medio >= 50 ? '#e67e22' : '#2d7a3a'};">${Number(m.npr_medio).toFixed(0)}</td>
      <td>${accion.descripcion || '—'}</td>
      <td>${accion.responsable || '—'}</td>
      <td>${accion.indicador || '—'}</td>
      <td>${accion.plazo ? new Date(accion.plazo).toLocaleDateString('es-ES') : '—'}</td>
      <td>${m.factibilidad || '—'}</td>
    </tr>`
  }).join('')

  // Categorías de participantes
  const cats = [...new Set(aportaciones.map(a => a.participaciones?.categoria).filter(Boolean))]

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Informe AMFE · ${proceso.codigo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9pt;color:#1a1a1a;line-height:1.4}
.cab{background:linear-gradient(135deg,${colorMorado},#9b59b6);color:#fff;padding:20px 28px;margin-bottom:20px}
.cab h1{font-size:18pt;font-weight:800}
.cab .sub{font-size:10pt;opacity:.85;margin-top:4px}
.cab .meta{margin-top:14px;display:flex;gap:20px;flex-wrap:wrap;font-size:9pt;opacity:.9}
.sec{padding:0 20px;margin-bottom:18px}
.sec h2{font-size:11pt;font-weight:700;color:${colorMorado};border-bottom:2px solid #e8d5f5;padding-bottom:5px;margin-bottom:10px}
.ia{background:#f9f4fd;border-left:3px solid ${colorMorado};padding:12px;border-radius:4px;white-space:pre-wrap;font-size:9pt;line-height:1.6}
.tabla-wrap{overflow-x:auto;padding:0 20px;margin-bottom:20px}
table{width:100%;border-collapse:collapse;font-size:8pt}
th{background:${colorMorado};color:#fff;padding:6px 4px;text-align:left;font-size:8pt;font-weight:700}
td{padding:5px 4px;border-bottom:1px solid #e0d5f0;vertical-align:top}
.critico{color:#c0392b;font-weight:700}
.stats{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.stat{background:#f9f4fd;border-radius:8px;padding:8px 14px;text-align:center;border:1px solid #e8d5f5}
.stat .n{font-size:18pt;font-weight:800;color:${colorMorado}}
.stat .l{font-size:8pt;color:#666}
.footer{margin-top:24px;padding:12px 20px;border-top:2px solid #e8d5f5;display:flex;justify-content:space-between;font-size:8pt;color:#999}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}th{-webkit-print-color-adjust:exact}}
</style></head><body>

<div class="cab">
  <div class="sub">Análisis Modal de Fallos y Efectos (AMFE)</div>
  <h1>${proceso.titulo}</h1>
  <div class="meta">
    <span>📋 ${proceso.codigo}</span>
    <span>📍 ${proceso.unidad}</span>
    <span>📅 ${fecha}</span>
    <span>👥 ${aportaciones.length} participante(s)</span>
  </div>
</div>

<div class="sec">
  <h2>Coordinadores de calidad</h2>
  <div style="font-size:9.5pt;line-height:1.8">${coordinadores ? coordinadores.split('\n').map(c => `• ${c}`).join('<br>') : '— No especificado —'}</div>
</div>

<div class="sec">
  <h2>Participantes</h2>
  <div style="margin-bottom:8px;font-size:9pt;color:#555">Categorías profesionales: <strong>${cats.join(', ') || '—'}</strong></div>
  ${participantes ? `<div style="font-size:9pt;line-height:1.8">${participantes.split('\n').filter(p=>p.trim()).map(p=>`• ${p}`).join('<br>')}</div>` : '<div style="font-size:9pt;color:#888">Nombres no especificados</div>'}
</div>

<div class="sec">
  <div class="stats">
    <div class="stat"><div class="n">${pasos.length}</div><div class="l">Pasos analizados</div></div>
    <div class="stat"><div class="n">${modos.length}</div><div class="l">Modos de fallo</div></div>
    <div class="stat"><div class="n" style="color:#c0392b">${criticos.length}</div><div class="l">Críticos (NPR≥100 o S≥8)</div></div>
    <div class="stat"><div class="n">${acciones.length}</div><div class="l">Acciones planteadas</div></div>
  </div>
</div>

${resumenIA ? `<div class="sec"><h2>Resumen ejecutivo · Análisis IA</h2><div class="ia">${resumenIA}</div></div>` : ''}

<div class="tabla-wrap">
  <h2 style="color:${colorMorado};font-size:11pt;font-weight:700;border-bottom:2px solid #e8d5f5;padding-bottom:5px;margin-bottom:10px;padding-left:0">Tabla AMFE</h2>
  <table>
    <thead>
      <tr>
        <th style="min-width:100px">Actividades</th>
        <th style="width:30px">Id</th>
        <th style="min-width:110px">Fallos</th>
        <th style="min-width:90px">Efectos</th>
        <th style="min-width:90px">Causas</th>
        <th style="width:50px">Frecuencia (O)</th>
        <th style="width:50px">Gravedad (S)</th>
        <th style="width:60px">Detectab. (D)</th>
        <th style="width:40px">NPR</th>
        <th style="min-width:100px">Acción de mejora</th>
        <th style="min-width:80px">Responsable</th>
        <th style="min-width:80px">Indicador</th>
        <th style="width:60px">Plazo</th>
        <th style="min-width:80px">Factibilidad / Viabilidad</th>
      </tr>
    </thead>
    <tbody>${filasTabla}</tbody>
  </table>
</div>

<div class="footer">
  <span>Calidad Total SAS · ${proceso.codigo} · ${fecha}</span>
  <span>doncelproject · doncel.project@gmail.com</span>
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

// ── INFORME AMFE COMPLETO — RTF ────────────────────────────────
export function exportarInformeAMFERTF({ proceso, pasos, modos, acciones, aportaciones, resumenIA, participantes, coordinadores }) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const e = (t) => {
    if (!t) return ''
    return String(t)
      .replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
      .replace(/á/g, "\\'e1").replace(/é/g, "\\'e9").replace(/í/g, "\\'ed")
      .replace(/ó/g, "\\'f3").replace(/ú/g, "\\'fa").replace(/ü/g, "\\'fc")
      .replace(/ñ/g, "\\'f1").replace(/Á/g, "\\'c1").replace(/É/g, "\\'c9")
      .replace(/Í/g, "\\'cd").replace(/Ó/g, "\\'d3").replace(/Ú/g, "\\'da")
      .replace(/Ñ/g, "\\'d1").replace(/\n/g, '\\line ')
  }
  const cats = [...new Set(aportaciones.map(a => a.participaciones?.categoria).filter(Boolean))]

  const lines = [
    '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}',
    '{\\colortbl;\\red108\\green52\\blue131;\\red192\\green57\\blue43;\\red230\\green126\\blue34;}',
    '\\f0\\fs22\\paperw11906\\paperh16838\\margl1200\\margr1200\\margt1200\\margb1200',
    `{\\pard\\fs28\\b\\cf1 ${e('Informe AMFE · ' + proceso.titulo)}\\par}`,
    `{\\pard\\fs20 ${e('Código: ' + proceso.codigo + ' · Unidad: ' + proceso.unidad + ' · Fecha: ' + fecha)}\\par}`,
    '{\\pard\\par}',
  ]

  if (coordinadores) {
    lines.push(`{\\pard\\fs22\\b\\cf1 ${e('COORDINADORES DE CALIDAD')}\\par}`)
    coordinadores.split('\n').filter(c => c.trim()).forEach(c => {
      lines.push(`{\\pard\\fs20 ${e('• ' + c)}\\par}`)
    })
    lines.push('{\\pard\\par}')
  }

  lines.push(`{\\pard\\fs22\\b\\cf1 ${e('PARTICIPANTES')}\\par}`)
  lines.push(`{\\pard\\fs20 ${e('Categorías: ' + (cats.join(', ') || '—'))}\\par}`)
  if (participantes) {
    participantes.split('\n').filter(p => p.trim()).forEach(p => {
      lines.push(`{\\pard\\fs20 ${e('• ' + p)}\\par}`)
    })
  }
  lines.push('{\\pard\\par}')

  if (resumenIA) {
    lines.push(`{\\pard\\fs22\\b\\cf1 ${e('RESUMEN EJECUTIVO')}\\par}`)
    resumenIA.split('\n').filter(l => l.trim()).forEach(l => {
      lines.push(`{\\pard\\fs20 ${e(l)}\\par}`)
    })
    lines.push('{\\pard\\par}')
  }

  lines.push(`{\\pard\\fs22\\b\\cf1 ${e('TABLA AMFE')}\\par}`)
  lines.push('{\\pard\\par}')

  modos.forEach((m, i) => {
    const accion = acciones.find(a => a.observaciones?.includes(m.modo_fusionado || m.modo_fallo)) || acciones[i] || {}
    const paso = pasos.find(p => p.id === m.paso_id) || {}
    const esCritico = m.npr_medio >= 100 || m.severidad_media >= 8
    lines.push(`{\\pard\\fs21\\b ${e(`${i + 1}. ${m.modo_fusionado || m.modo_fallo}`)}${esCritico ? ' {\\cf2 [CRÍTICO]}' : ''}\\par}`)
    lines.push(`{\\pard\\fs20 ${e(`Actividad: ${paso.descripcion || '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs20 ${e(`Efecto: ${m.efecto || '—'} | Causa: ${m.causa || '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs20 ${e(`O(Frecuencia): ${Number(m.ocurrencia_media).toFixed(1)} | S(Gravedad): ${Number(m.severidad_media).toFixed(1)} | D(Detectab.): ${Number(m.detectabilidad_media).toFixed(1)} | NPR: ${Number(m.npr_medio).toFixed(0)}`)}\\par}`)
    if (accion.descripcion) lines.push(`{\\pard\\fs20 ${e(`Acción: ${accion.descripcion} | Resp.: ${accion.responsable || '—'} | Plazo: ${accion.plazo ? new Date(accion.plazo).toLocaleDateString('es-ES') : '—'}`)}\\par}`)
    if (m.factibilidad) lines.push(`{\\pard\\fs20 ${e(`Factibilidad: ${m.factibilidad}`)}\\par}`)
    if (accion.indicador) lines.push(`{\\pard\\fs20 ${e(`Indicador: ${accion.indicador}`)}\\par}`)
    lines.push('{\\pard\\par}')
  })

  lines.push(`{\\pard\\fs18 ${e('Calidad Total SAS · ' + proceso.codigo + ' · ' + fecha + ' · doncelproject · doncel.project@gmail.com')}\\par}`)
  lines.push('}')

  const blob = new Blob([lines.join('\n')], { type: 'application/rtf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${proceso.codigo}_informe_amfe.rtf`
  a.click()
  URL.revokeObjectURL(url)
}

// ── SEGUIMIENTO DE ACCIONES — PDF ─────────────────────────────
export function exportarSeguimientoPDF({ proceso, acciones }) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const colorVerde = '#2d7a3a'
  const estadoColor = { pendiente: '#e67e22', en_curso: '#1a5276', completada: '#2d7a3a', cancelada: '#999' }
  const estadoLabel = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada', cancelada: 'Cancelada' }

  const filas = acciones.map((a, i) => `
  <tr style="background:${i % 2 === 0 ? '#f4f9f4' : '#fff'}">
    <td style="font-weight:600">${a.descripcion}</td>
    <td>${a.responsable || '—'}</td>
    <td>${a.plazo ? new Date(a.plazo).toLocaleDateString('es-ES') : '—'}</td>
    <td style="text-align:center"><span style="padding:2px 8px;border-radius:10px;font-size:8pt;font-weight:700;background:${estadoColor[a.estado] || estadoColor.pendiente}20;color:${estadoColor[a.estado] || estadoColor.pendiente}">${estadoLabel[a.estado] || 'Pendiente'}</span></td>
    <td style="text-align:center">${a.porcentaje || 0}%</td>
    <td>${a.observaciones || '—'}</td>
    <td></td>
  </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Seguimiento · ${proceso.codigo}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:9pt;color:#1a1a1a}
.cab{background:linear-gradient(135deg,${colorVerde},#1a7a6e);color:#fff;padding:20px 28px;margin-bottom:20px}
.cab h1{font-size:16pt;font-weight:800}
.cab .meta{margin-top:10px;display:flex;gap:20px;font-size:9pt;opacity:.9}
.tabla-wrap{padding:0 20px}
h2{color:${colorVerde};font-size:11pt;font-weight:700;margin-bottom:10px;border-bottom:2px solid #dde8dd;padding-bottom:5px}
table{width:100%;border-collapse:collapse;font-size:8.5pt}
th{background:${colorVerde};color:#fff;padding:7px 5px;text-align:left;font-size:8.5pt}
td{padding:6px 5px;border-bottom:1px solid #e0e8e0;vertical-align:top}
.footer{margin-top:24px;padding:12px 20px;border-top:2px solid #dde8dd;display:flex;justify-content:space-between;font-size:8pt;color:#999}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
</style></head><body>
<div class="cab">
  <div style="font-size:10pt;opacity:.85">Documento de Seguimiento de Acciones</div>
  <h1>${proceso.titulo}</h1>
  <div class="meta">
    <span>📋 ${proceso.codigo}</span>
    <span>📍 ${proceso.unidad}</span>
    <span>📅 Generado: ${fecha}</span>
    <span>📊 ${acciones.length} acción(es)</span>
  </div>
</div>
<div class="tabla-wrap">
  <h2>Plan de acción y seguimiento</h2>
  <table>
    <thead>
      <tr>
        <th style="min-width:140px">Acción</th>
        <th style="min-width:90px">Responsable</th>
        <th style="width:65px">Plazo</th>
        <th style="width:70px">Estado</th>
        <th style="width:50px">% Avance</th>
        <th style="min-width:100px">Observaciones</th>
        <th style="min-width:80px">Fecha revisión</th>
      </tr>
    </thead>
    <tbody>${filas}</tbody>
  </table>
</div>
<div class="footer">
  <span>Calidad Total SAS · ${proceso.codigo} · ${fecha}</span>
  <span>doncelproject · doncel.project@gmail.com</span>
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

// ── SEGUIMIENTO DE ACCIONES — RTF ─────────────────────────────
export function exportarSeguimientoRTF({ proceso, acciones }) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const e = (t) => {
    if (!t) return ''
    return String(t)
      .replace(/\\/g, '\\\\').replace(/\{/g, '\\{').replace(/\}/g, '\\}')
      .replace(/á/g, "\\'e1").replace(/é/g, "\\'e9").replace(/í/g, "\\'ed")
      .replace(/ó/g, "\\'f3").replace(/ú/g, "\\'fa").replace(/ü/g, "\\'fc")
      .replace(/ñ/g, "\\'f1").replace(/Á/g, "\\'c1").replace(/É/g, "\\'c9")
      .replace(/Í/g, "\\'cd").replace(/Ó/g, "\\'d3").replace(/Ú/g, "\\'da")
      .replace(/Ñ/g, "\\'d1").replace(/\n/g, '\\line ')
  }

  const lines = [
    '{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}',
    '{\\colortbl;\\red45\\green122\\blue58;\\red192\\green57\\blue43;\\red26\\green122\\blue110;}',
    '\\f0\\fs22\\paperw11906\\paperh16838\\margl1200\\margr1200\\margt1200\\margb1200',
    `{\\pard\\fs26\\b\\cf1 ${e('Seguimiento de Acciones · ' + proceso.titulo)}\\par}`,
    `{\\pard\\fs20 ${e('Código: ' + proceso.codigo + ' · Unidad: ' + proceso.unidad + ' · ' + fecha)}\\par}`,
    '{\\pard\\par}',
    `{\\pard\\fs22\\b\\cf1 ${e('PLAN DE ACCIÓN Y SEGUIMIENTO')}\\par}`,
    '{\\pard\\par}',
  ]

  acciones.forEach((a, i) => {
    const estadoLabel = { pendiente: 'Pendiente', en_curso: 'En curso', completada: 'Completada', cancelada: 'Cancelada' }
    lines.push(`{\\pard\\fs21\\b ${e(`${i + 1}. ${a.descripcion}`)}\\par}`)
    lines.push(`{\\pard\\fs20 ${e(`Responsable: ${a.responsable || '—'} | Plazo: ${a.plazo ? new Date(a.plazo).toLocaleDateString('es-ES') : '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs20 ${e(`Estado: ${estadoLabel[a.estado] || 'Pendiente'} | Avance: ${a.porcentaje || 0}%`)}\\par}`)
    if (a.indicador) lines.push(`{\\pard\\fs20 ${e(`Indicador: ${a.indicador}`)}\\par}`)
    if (a.observaciones) lines.push(`{\\pard\\fs20 ${e(`Observaciones: ${a.observaciones}`)}\\par}`)
    lines.push(`{\\pard\\fs20 ${e('Fecha revisión: _______________')}\\par}`)
    lines.push('{\\pard\\par}')
  })

  lines.push(`{\\pard\\fs18 ${e('Calidad Total SAS · ' + proceso.codigo + ' · ' + fecha + ' · doncelproject · doncel.project@gmail.com')}\\par}`)
  lines.push('}')

  const blob = new Blob([lines.join('\n')], { type: 'application/rtf' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${proceso.codigo}_seguimiento.rtf`
  a.click()
  URL.revokeObjectURL(url)
}
