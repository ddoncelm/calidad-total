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

// ── INFORME AMFE COMPLETO — PDF (landscape, opción B: una fila por acción) ──
export function exportarInformeAMFEPDF({ proceso, pasos, filas, acciones, aportaciones, resumenIA, participantes, coordinadores }) {
  const fecha = new Date().toLocaleDateString('es-ES')
  const colorMorado = '#6c3483'
  const factColor = { Alta: '#2d7a3a', Media: '#e67e22', Baja: '#c0392b' }
  const cats = [...new Set(aportaciones.map(a => a.participaciones?.categoria).filter(Boolean))]
  const criticos = (filas || []).filter(f => f.modo?.npr_medio >= 100 || f.modo?.severidad_media >= 8)

  const filasHTML = (filas || []).map((f, i) => {
    const { accion, modo, paso } = f
    const esCritico = modo?.npr_medio >= 100 || modo?.severidad_media >= 8
    const fact = accion.factibilidad || '—'
    const factC = factColor[accion.factibilidad] || '#666'
    return `<tr style="background:${i % 2 === 0 ? '#f9f4fd' : '#fff'}">
      <td style="font-size:7.5pt">${paso?.descripcion || '—'}</td>
      <td style="text-align:center;font-weight:700;font-size:7.5pt">${i + 1}</td>
      <td style="font-weight:600;font-size:7.5pt;color:${esCritico ? '#c0392b' : '#1a1a1a'}">${modo?.modo_fusionado || modo?.modo_fallo || accion.descripcion}</td>
      <td style="font-size:7.5pt">${modo?.efecto || '—'}</td>
      <td style="font-size:7.5pt">${modo?.causa || '—'}</td>
      <td style="text-align:center;font-size:7.5pt">${modo?.ocurrencia_media ? Number(modo.ocurrencia_media).toFixed(1) : '—'}</td>
      <td style="text-align:center;font-size:7.5pt">${modo?.severidad_media ? Number(modo.severidad_media).toFixed(1) : '—'}</td>
      <td style="text-align:center;font-size:7.5pt">${modo?.detectabilidad_media ? Number(modo.detectabilidad_media).toFixed(1) : '—'}</td>
      <td style="text-align:center;font-weight:800;font-size:8pt;color:${esCritico ? '#c0392b' : modo?.npr_medio >= 50 ? '#e67e22' : '#2d7a3a'}">${modo?.npr_medio ? Number(modo.npr_medio).toFixed(0) : '—'}</td>
      <td style="font-size:7.5pt">${accion.descripcion || '—'}</td>
      <td style="font-size:7.5pt">${accion.responsable || '—'}</td>
      <td style="font-size:7.5pt">${accion.indicador || '—'}</td>
      <td style="font-size:7.5pt">${accion.plazo ? new Date(accion.plazo).toLocaleDateString('es-ES') : '—'}</td>
      <td style="font-size:7.5pt;font-weight:700;color:${factC}">${fact}</td>
    </tr>`
  }).join('')

  const html = `<!DOCTYPE html>
<html lang="es"><head><meta charset="UTF-8"/>
<title>Informe AMFE · ${proceso.codigo}</title>
<style>
@page { size: A4 landscape; margin: 12mm; }
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:Arial,sans-serif;font-size:8pt;color:#1a1a1a;line-height:1.3}
.cab{background:linear-gradient(135deg,${colorMorado},#9b59b6);color:#fff;padding:14px 20px;margin-bottom:14px;border-radius:4px}
.cab h1{font-size:14pt;font-weight:800}
.cab .meta{margin-top:8px;display:flex;gap:16px;flex-wrap:wrap;font-size:8pt;opacity:.9}
.sec{margin-bottom:12px}
.sec h2{font-size:9pt;font-weight:700;color:${colorMorado};border-bottom:2px solid #e8d5f5;padding-bottom:4px;margin-bottom:8px}
.ia{background:#f9f4fd;border-left:3px solid ${colorMorado};padding:10px;border-radius:4px;white-space:pre-wrap;font-size:8pt;line-height:1.5}
.stats{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.stat{background:#f9f4fd;border-radius:6px;padding:6px 12px;text-align:center;border:1px solid #e8d5f5}
.stat .n{font-size:14pt;font-weight:800;color:${colorMorado}}
.stat .l{font-size:7pt;color:#666}
table{width:100%;border-collapse:collapse;table-layout:fixed}
th{background:${colorMorado};color:#fff;padding:5px 3px;text-align:left;font-size:7.5pt;font-weight:700;word-wrap:break-word}
td{padding:4px 3px;border-bottom:1px solid #e0d5f0;vertical-align:top;word-wrap:break-word}
.footer{margin-top:12px;padding:8px 0;border-top:2px solid #e8d5f5;display:flex;justify-content:space-between;font-size:7pt;color:#999}
@media print{
  body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .cab{-webkit-print-color-adjust:exact}
  th{-webkit-print-color-adjust:exact}
}
</style></head><body>

<div class="cab">
  <div style="font-size:9pt;opacity:.85;margin-bottom:4px">Análisis Modal de Fallos y Efectos (AMFE) — Informe para Dirección / Auditoría</div>
  <h1>${proceso.titulo}</h1>
  <div class="meta">
    <span>📋 ${proceso.codigo}</span>
    <span>📍 ${proceso.unidad}</span>
    <span>📅 ${fecha}</span>
    <span>👥 ${aportaciones.length} participante(s)</span>
  </div>
</div>

<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
  <div class="sec">
    <h2>Coordinadores de calidad</h2>
    <div style="font-size:8pt;line-height:1.7">${coordinadores ? coordinadores.split('\n').filter(c=>c.trim()).map(c=>`• ${c}`).join('<br>') : '— No especificado —'}</div>
  </div>
  <div class="sec">
    <h2>Equipo participante</h2>
    <div style="font-size:8pt;margin-bottom:4px">Categorías: <strong>${cats.join(', ') || '—'}</strong></div>
    ${participantes ? `<div style="font-size:8pt;line-height:1.7">${participantes.split('\n').filter(p=>p.trim()).map(p=>`• ${p}`).join('<br>')}</div>` : '<div style="font-size:8pt;color:#888">Nombres no especificados</div>'}
  </div>
</div>

<div class="stats">
  <div class="stat"><div class="n">${pasos?.length || 0}</div><div class="l">Pasos</div></div>
  <div class="stat"><div class="n">${filas?.length || 0}</div><div class="l">Acciones</div></div>
  <div class="stat"><div class="n" style="color:#c0392b">${criticos.length}</div><div class="l">Críticos</div></div>
  <div class="stat"><div class="n" style="color:#2d7a3a">${acciones.filter(a=>a.factibilidad==='Alta').length}</div><div class="l">Alta fact.</div></div>
  <div class="stat"><div class="n" style="color:#e67e22">${acciones.filter(a=>a.factibilidad==='Media').length}</div><div class="l">Media fact.</div></div>
  <div class="stat"><div class="n" style="color:#c0392b">${acciones.filter(a=>a.factibilidad==='Baja').length}</div><div class="l">Baja fact.</div></div>
</div>

${resumenIA ? `<div class="sec"><h2>Resumen ejecutivo</h2><div class="ia">${resumenIA}</div></div>` : ''}

<div class="sec" style="margin-top:14px">
  <h2>Tabla AMFE</h2>
  <table>
    <colgroup>
      <col style="width:9%"><col style="width:3%"><col style="width:9%">
      <col style="width:7%"><col style="width:7%">
      <col style="width:4%"><col style="width:4%"><col style="width:4%"><col style="width:3.5%">
      <col style="width:11%"><col style="width:8%"><col style="width:9%">
      <col style="width:5%"><col style="width:7%">
    </colgroup>
    <thead>
      <tr>
        <th>Actividades</th><th>Id</th><th>Fallos</th>
        <th>Efectos</th><th>Causas</th>
        <th>Frecuencia (O)</th><th>Gravedad (S)</th><th>Detectab. (D)</th><th>NPR</th>
        <th>Acción de mejora</th><th>Responsable</th><th>Indicador de evaluación</th>
        <th>Plazo</th><th>Factibilidad / Viabilidad</th>
      </tr>
    </thead>
    <tbody>${filasHTML || '<tr><td colspan="14" style="text-align:center;padding:12px;color:#999">Sin acciones registradas</td></tr>'}</tbody>
  </table>
</div>

<div class="footer">
  <span>Calidad Total SAS · ${proceso.codigo} · ${fecha} · Documento confidencial — Uso interno</span>
  <span>doncelproject · doncel.project@gmail.com</span>
</div>
</body></html>`

  const w = window.open('', '_blank')
  w.document.write(html)
  w.document.close()
  w.focus()
  setTimeout(() => w.print(), 600)
}

// ── INFORME AMFE COMPLETO — RTF (opción B) ─────────────────────
export function exportarInformeAMFERTF({ proceso, pasos, filas, acciones, aportaciones, resumenIA, participantes, coordinadores }) {
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
    '{\\colortbl;\\red108\\green52\\blue131;\\red192\\green57\\blue43;\\red230\\green126\\blue34;\\red45\\green122\\blue58;}',
    '\\f0\\fs20\\paperw16838\\paperh11906\\margl800\\margr800\\margt800\\margb800\\landscape',
    `{\\pard\\fs26\\b\\cf1 ${e('Informe AMFE · ' + proceso.titulo)}\\par}`,
    `{\\pard\\fs18 ${e('Código: ' + proceso.codigo + ' · Unidad: ' + proceso.unidad + ' · Fecha: ' + fecha)}\\par}`,
    `{\\pard\\fs18 ${e('Documento para Dirección / Auditoría externa')}\\par}`,
    '{\\pard\\par}',
  ]

  if (coordinadores) {
    lines.push(`{\\pard\\fs20\\b\\cf1 ${e('COORDINADORES DE CALIDAD')}\\par}`)
    coordinadores.split('\n').filter(c => c.trim()).forEach(c => {
      lines.push(`{\\pard\\fs18 ${e('• ' + c)}\\par}`)
    })
    lines.push('{\\pard\\par}')
  }

  lines.push(`{\\pard\\fs20\\b\\cf1 ${e('EQUIPO PARTICIPANTE')}\\par}`)
  lines.push(`{\\pard\\fs18 ${e('Categorías: ' + (cats.join(', ') || '—'))}\\par}`)
  if (participantes) {
    participantes.split('\n').filter(p => p.trim()).forEach(p => {
      lines.push(`{\\pard\\fs18 ${e('• ' + p)}\\par}`)
    })
  }
  lines.push('{\\pard\\par}')

  if (resumenIA) {
    lines.push(`{\\pard\\fs20\\b\\cf1 ${e('RESUMEN EJECUTIVO')}\\par}`)
    resumenIA.split('\n').filter(l => l.trim()).forEach(l => {
      lines.push(`{\\pard\\fs18 ${e(l)}\\par}`)
    })
    lines.push('{\\pard\\par}')
  }

  lines.push(`{\\pard\\fs20\\b\\cf1 ${e('TABLA AMFE (una fila por acción)')}\\par}`)
  lines.push('{\\pard\\par}')

  ;(filas || []).forEach((f, i) => {
    const { accion, modo, paso } = f
    const esCritico = modo?.npr_medio >= 100 || modo?.severidad_media >= 8
    lines.push(`{\\pard\\fs19\\b ${e(`${i + 1}. Acción: ${accion.descripcion}`)}${esCritico ? ' {\\cf2 [CRÍTICO]}' : ''}\\par}`)
    lines.push(`{\\pard\\fs17 ${e(`Actividad/Paso: ${paso?.descripcion || '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs17 ${e(`Fallo: ${modo?.modo_fusionado || modo?.modo_fallo || '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs17 ${e(`Efecto: ${modo?.efecto || '—'} | Causa: ${modo?.causa || '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs17 ${e(`O(Frecuencia): ${modo?.ocurrencia_media ? Number(modo.ocurrencia_media).toFixed(1) : '—'} | S(Gravedad): ${modo?.severidad_media ? Number(modo.severidad_media).toFixed(1) : '—'} | D: ${modo?.detectabilidad_media ? Number(modo.detectabilidad_media).toFixed(1) : '—'} | NPR: ${modo?.npr_medio ? Number(modo.npr_medio).toFixed(0) : '—'}`)}\\par}`)
    lines.push(`{\\pard\\fs17 ${e(`Responsable: ${accion.responsable || '—'} | Plazo: ${accion.plazo ? new Date(accion.plazo).toLocaleDateString('es-ES') : '—'}`)}\\par}`)
    if (accion.indicador) lines.push(`{\\pard\\fs17 ${e(`Indicador: ${accion.indicador}`)}\\par}`)
    lines.push(`{\\pard\\fs17\\b ${e(`Factibilidad: ${accion.factibilidad || 'No valorada'}`)}\\par}`)
    lines.push('{\\pard\\par}')
  })

  lines.push(`{\\pard\\fs16 ${e('Calidad Total SAS · ' + proceso.codigo + ' · ' + fecha + ' · doncelproject · doncel.project@gmail.com')}\\par}`)
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
