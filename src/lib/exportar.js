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
