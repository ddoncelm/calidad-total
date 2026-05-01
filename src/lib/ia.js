const ANTHROPIC_KEY = import.meta.env.VITE_ANTHROPIC_KEY

export async function llamarIA(prompt, maxTokens = 1500) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
  })
  const data = await response.json()
  if (!response.ok) throw new Error(data.error?.message || 'Error API Anthropic')
  return data.content?.[0]?.text || ''
}

// ── LEAN ───────────────────────────────────────────────────────
export function promptLean({ unidad, categoria, proceso, desperdicios, detalles }) {
  const sel = desperdicios.map(d => `- ${d.label}: ${detalles[d.id] || '(sin detalle)'}`)
  return `Eres experto en Lean hospitalario del SAS/SSPA.
UNIDAD: ${unidad} | CATEGORÍA: ${categoria}
PROCESO: ${proceso || 'Flujo general'}
DESPERDICIOS: ${sel.join('\n')}
Propón exactamente 5 acciones de mejora numeradas del 1 al 5, indicando herramienta Lean e impacto (Alto/Medio/Bajo). Sé específico para el entorno hospitalario público español.`
}

// ── RCA ────────────────────────────────────────────────────────
export function promptRCA({ unidad, categoria, tipoSuceso, descripcion, cuando, factores }) {
  return `Eres experto en seguridad del paciente y RCA del SAS/SSPA. Modelo queso suizo de Reason y CISP-OMS.
UNIDAD: ${unidad} | CATEGORÍA: ${categoria}
SUCESO: ${tipoSuceso} | FECHA: ${cuando}
DESCRIPCIÓN: ${descripcion}
FACTORES — Humanos: ${factores.humanos || 'NE'} | Organizativos: ${factores.organizativos || 'NE'} | Técnicos: ${factores.tecnicos || 'NE'} | Entorno: ${factores.entorno || 'NE'} | Paciente: ${factores.paciente || 'NE'}
Propón exactamente 5 acciones correctoras numeradas del 1 al 5 con responsable genérico y plazo. Enfoque sistémico, no culpabilizador.`
}

// ── AMFE: sugerir pasos del proceso ───────────────────────────
export function promptAMFEPasos({ tipoProceso, descripcion, unidad }) {
  return `Eres experto en AMFE (Análisis Modal de Fallos y Efectos) sanitario del SAS/SSPA.
El coordinador quiere analizar el proceso: "${tipoProceso}" en la unidad "${unidad}".
Descripción adicional: ${descripcion || 'No especificada'}

Descompón este proceso en entre 6 y 12 pasos secuenciales claros y bien delimitados, adaptados al entorno hospitalario público español.
Formato: una línea por paso, comenzando con número y punto.
Solo los pasos, sin explicaciones adicionales. Pasos concisos (máximo 15 palabras cada uno).`
}

// ── AMFE: sugerir modos de fallo por paso ─────────────────────
export function promptAMFEModosFallo({ paso, tipoProceso, unidad }) {
  return `Eres experto en AMFE sanitario del SAS/SSPA con amplio conocimiento en seguridad del paciente.
Proceso: "${tipoProceso}" en "${unidad}"
Paso a analizar: "${paso}"

Identifica los 3 modos de fallo potenciales más relevantes y documentados para este paso concreto.
Para cada modo de fallo indica: modo de fallo, efecto probable y causa raíz más frecuente.
Formato JSON estricto, sin texto adicional:
[
  {"modo": "...", "efecto": "...", "causa": "..."},
  {"modo": "...", "efecto": "...", "causa": "..."},
  {"modo": "...", "efecto": "...", "causa": "..."}
]`
}

// ── AMFE: síntesis de modos de fallo aportados ────────────────
export function promptAMFESintesis({ paso, modosRaw, tipoProceso }) {
  const lista = modosRaw.map((m, i) => `${i + 1}. Modo: ${m.modo} | Efecto: ${m.efecto} | Causa: ${m.causa}`).join('\n')
  return `Eres experto en AMFE sanitario.
Proceso: "${tipoProceso}" | Paso: "${paso}"
Modos de fallo aportados por los participantes:
${lista}

Consolida y agrupa los similares. Devuelve entre 2 y 5 modos de fallo únicos y representativos.
Formato JSON estricto, sin texto adicional:
[
  {"modo": "...", "efecto": "...", "causa": "..."},
  ...
]`
}

// ── AMFE: informe final ────────────────────────────────────────
export function promptAMFEInforme({ proceso, pasos, rankingAMFE, acciones }) {
  const criticos = rankingAMFE.filter(r => r.npr_medio >= 100 || r.severidad_media >= 8)
  const top = rankingAMFE.slice(0, 6).map(r =>
    `- ${r.modo_fallo} (NPR=${r.npr_medio?.toFixed(0)}, S=${r.severidad_media?.toFixed(1)}, O=${r.ocurrencia_media?.toFixed(1)}, D=${r.detectabilidad_media?.toFixed(1)})`
  ).join('\n')
  const accionesTexto = acciones.map(a => `- ${a.descripcion} | ${a.responsable || 'Sin asignar'} | ${a.plazo || 'Sin plazo'} | ${a.estado}`).join('\n')

  return `Eres experto en AMFE sanitario del SAS/SSPA. Redacta un informe ejecutivo profesional.

PROCESO ANALIZADO: ${proceso.titulo} (${proceso.codigo})
UNIDAD: ${proceso.unidad}
TIPO: ${proceso.descripcion || proceso.titulo}
PASOS ANALIZADOS: ${pasos.length}
MODOS DE FALLO EVALUADOS: ${rankingAMFE.length}
FALLOS CRÍTICOS (NPR≥100 o S≥8): ${criticos.length}

FALLOS CON MAYOR NPR:
${top || 'Sin datos de votación aún'}

ACCIONES DE MEJORA DEFINIDAS:
${accionesTexto || 'Pendiente de definir'}

Redacta el informe con estas secciones:
1. RESUMEN EJECUTIVO (hallazgos más relevantes del análisis)
2. PROCESO Y ALCANCE DEL ANÁLISIS (descripción del proceso y participación)
3. PRINCIPALES RIESGOS IDENTIFICADOS (análisis de los fallos críticos)
4. ANÁLISIS DE NPR Y PRIORIZACIÓN (interpretación de las puntuaciones)
5. PLAN DE ACCIÓN Y BARRERAS PROPUESTAS
6. CONCLUSIONES Y RECOMENDACIONES

Lenguaje profesional, riguroso y accesible para el entorno sanitario público español.`
}

// ── SÍNTESIS LEAN/RCA ──────────────────────────────────────────
export function promptSintesis({ tipo, proceso, propuestasRaw }) {
  const lista = propuestasRaw.map((p, i) => `${i + 1}. ${p}`).join('\n')
  return `Eres experto en calidad hospitalaria ${tipo === 'lean' ? 'Lean' : 'RCA'} del SAS/SSPA.
Propuestas de mejora de múltiples profesionales de "${proceso.unidad}" para "${proceso.titulo}":
${lista}
Agrupa similares, elimina duplicados, genera entre 5 y 10 propuestas consolidadas.
Formato: una por línea comenzando con número y punto. Solo las propuestas.`
}

// ── INFORME LEAN/RCA ───────────────────────────────────────────
export function promptInforme({ proceso, aportaciones, propuestas, ranking, acciones }) {
  const tipo = proceso.tipo === 'lean' ? 'Plan de Mejora Continua (Lean)' : 'Análisis de Suceso Centinela (RCA)'
  const top = ranking.slice(0, 5).map((r, i) => `${i + 1}. ${r.texto} (${(r.puntuacion_final * 100 / 3).toFixed(0)}/100)`).join('\n')
  const acc = acciones.map(a => `- ${a.descripcion} | ${a.responsable || 'Sin asignar'} | ${a.estado}`).join('\n')
  return `Eres experto en calidad hospitalaria del SAS/SSPA. Redacta informe ejecutivo profesional.
TIPO: ${tipo} | CÓDIGO: ${proceso.codigo} | UNIDAD: ${proceso.unidad}
PARTICIPANTES: ${aportaciones.length} | PROPUESTAS VOTADAS: ${ranking.length}
TOP PROPUESTAS: ${top || 'Sin votos aún'}
ACCIONES: ${acc || 'Sin definir'}
Secciones: 1.Resumen ejecutivo 2.Contexto y participación 3.Hallazgos principales 4.Propuestas priorizadas 5.Plan de acción 6.Conclusiones.
Lenguaje profesional para entorno sanitario público español.`
}

export function extraerPropuestas(textoIA) {
  return textoIA.split('\n')
    .map(l => { const m = l.match(/^(\d+)\.\s+(.+)/); return m ? m[2].trim() : null })
    .filter(p => p && p.length > 10)
}

export function extraerPasos(textoIA) {
  return textoIA.split('\n')
    .map(l => { const m = l.match(/^(\d+)\.\s+(.+)/); return m ? m[2].trim() : null })
    .filter(p => p && p.length > 3)
}

// ── AMFE: analizar duplicados y proponer grupos de fusión ──────
export function promptAMFEFusion({ proceso, aportaciones }) {
  const lista = aportaciones.map((a, i) =>
    `ID:${a.id} | Paso:"${a.paso_descripcion}" | Modo:"${a.modo_fallo}" | Efecto:"${a.efecto || ''}" | Causa:"${a.causa || ''}" | S:${a.severidad} O:${a.ocurrencia} D:${a.detectabilidad} NPR:${a.npr}`
  ).join('\n')

  return `Eres experto en AMFE sanitario. Analiza los siguientes modos de fallo identificados por diferentes profesionales en el proceso "${proceso.titulo}" (${proceso.unidad}).

MODOS DE FALLO REGISTRADOS:
${lista}

Tu tarea:
1. Identifica grupos de modos de fallo que sean esencialmente el mismo fallo expresado con palabras diferentes
2. Para cada grupo propón un texto consolidado claro y preciso
3. Los modos que sean claramente distintos NO los agrupes — deben quedar como modos independientes

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:
{
  "grupos": [
    {
      "modo_fusionado": "Texto consolidado del modo de fallo",
      "efecto": "Efecto consolidado",
      "causa": "Causa raíz común",
      "ids": ["uuid1", "uuid2"],
      "razon": "Breve explicación de por qué se fusionan"
    }
  ],
  "independientes": ["uuid3", "uuid4"]
}

Los "independientes" son los IDs de modos que no deben fusionarse con ningún otro.`
}

// ── AMFE: generar plan de acción basado en ranking priorizado ──
export function promptPlanAccionAMFE({ proceso, modos }) {
  const criticos = modos.filter(m => m.npr_medio >= 100 || m.severidad_media >= 8)
  const moderados = modos.filter(m => m.npr_medio >= 50 && m.npr_medio < 100 && m.severidad_media < 8)
  const leves = modos.filter(m => m.npr_medio < 50 && m.severidad_media < 8)

  const formatModo = (m) =>
    `- "${m.modo_fusionado || m.modo_fallo}" | NPR:${Number(m.npr_medio).toFixed(0)} | S:${Number(m.severidad_media).toFixed(1)} O:${Number(m.ocurrencia_media).toFixed(1)} D:${Number(m.detectabilidad_media).toFixed(1)} | Efecto: ${m.efecto || 'No especificado'} | Causa: ${m.causa || 'No especificada'}`

  return `Eres experto en seguridad del paciente y gestión de riesgos sanitarios del SAS/SSPA.

Has analizado el proceso "${proceso.titulo}" en la unidad "${proceso.unidad}" mediante AMFE.

MODOS DE FALLO CRÍTICOS (NPR≥100 o Severidad≥8) — requieren acción urgente:
${criticos.length > 0 ? criticos.map(formatModo).join('\n') : 'Ninguno'}

MODOS DE FALLO MODERADOS (NPR 50-99):
${moderados.length > 0 ? moderados.map(formatModo).join('\n') : 'Ninguno'}

MODOS DE FALLO LEVES (NPR<50):
${leves.length > 0 ? leves.map(formatModo).join('\n') : 'Ninguno'}

Genera un plan de acción siguiendo estas reglas estrictas:
- Para cada modo CRÍTICO: propón exactamente 2 acciones correctoras
- Para cada modo MODERADO: propón exactamente 1 acción correctora
- Para los modos LEVES: solo menciónalos en observaciones, sin acciones específicas
- Cada acción debe tener: descripción concreta, responsable por cargo genérico (no nombre), plazo orientativo en meses e indicador de seguimiento medible
- Las acciones deben ser específicas, realizables en el entorno del SAS y basadas en la causa raíz identificada

Responde ÚNICAMENTE con un JSON válido con esta estructura exacta, sin texto adicional:
{
  "acciones": [
    {
      "descripcion": "Descripción concreta de la acción",
      "responsable": "Cargo genérico responsable",
      "plazo_meses": 3,
      "indicador": "Cómo medir que se ha cumplido",
      "modo_origen": "Modo de fallo al que responde",
      "prioridad": "alta|media|baja"
    }
  ],
  "observaciones": "Texto sobre los modos leves y recomendaciones generales"
}`
}

// ── AMFE: resumen narrativo para informe completo ──────────────
export function promptResumenInformeAMFE({ proceso, pasos, modos, acciones, categorias, coordinadores }) {
  const criticos = modos.filter(m => m.npr_medio >= 100 || m.severidad_media >= 8)
  const topModos = modos.slice(0, 5).map(m =>
    `- ${m.modo_fusionado || m.modo_fallo} (NPR: ${Number(m.npr_medio).toFixed(0)}, S:${Number(m.severidad_media).toFixed(1)} O:${Number(m.ocurrencia_media).toFixed(1)} D:${Number(m.detectabilidad_media).toFixed(1)})`
  ).join('\n')
  const accionesTexto = acciones.slice(0, 8).map(a =>
    `- ${a.descripcion} | Responsable: ${a.responsable || 'Por definir'} | Plazo: ${a.plazo || 'Por definir'}`
  ).join('\n')

  return `Eres experto en seguridad del paciente y AMFE sanitario del SAS/SSPA. Redacta el resumen ejecutivo de un informe AMFE profesional.

DATOS DEL PROCESO:
Título: ${proceso.titulo}
Unidad: ${proceso.unidad}
Pasos analizados: ${pasos.length}
Total modos de fallo evaluados: ${modos.length}
Modos críticos (NPR≥100 o S≥8): ${criticos.length}
Categorías profesionales participantes: ${categorias.join(', ')}
Coordinadores de calidad: ${coordinadores || 'No especificado'}

MODOS DE FALLO MÁS RELEVANTES:
${topModos || 'Sin datos'}

ACCIONES DE MEJORA PLANTEADAS:
${accionesTexto || 'Pendiente de definir'}

Redacta el informe con estas secciones en texto narrativo profesional:
1. RESUMEN EJECUTIVO (3-4 frases con los hallazgos más importantes)
2. DESCRIPCIÓN DEL PROCESO ANALIZADO (contexto y alcance)
3. METODOLOGÍA UTILIZADA (descripción breve del AMFE y escalas S/O/D)
4. PRINCIPALES RIESGOS IDENTIFICADOS (análisis de los modos de fallo críticos)
5. PLAN DE ACCIÓN (descripción de las acciones propuestas y su impacto esperado)
6. CONCLUSIONES Y RECOMENDACIONES

Usa lenguaje profesional, riguroso y adaptado al entorno sanitario público español. Máximo 600 palabras.`
}
