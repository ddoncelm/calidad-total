export const C = {
  verde:      '#2d7a3a',
  verdeClaro: '#4a9e58',
  teal:       '#1a7a6e',
  tealClaro:  '#2fa899',
  azul:       '#1a5276',
  azulClaro:  '#2e86c1',
  morado:     '#6c3483',
  moradoClaro:'#9b59b6',
  gris:       '#f4f6f4',
  grisMedio:  '#dde8dd',
  texto:      '#1a2e1a',
  textoSuave: '#5a7a5a',
  blanco:     '#ffffff',
  rojo:       '#c0392b',
  rojoClaro:  '#e74c3c',
  naranja:    '#e67e22',
}

export const CATEGORIAS = [
  '── Facultativos ──',
  'Médico/a especialista',
  'Médico/a de familia',
  'Residente MIR',
  '── Enfermería ──',
  'Enfermero/a',
  'Matrona',
  'Enfermero/a residente EIR',
  '── Técnicos y Auxiliares ──',
  'Técnico/a en Cuidados de Enfermería (TCAE)',
  'Técnico/a Especialista (TSID, laboratorio...)',
  'Celador/a',
  '── Gestión y Administración ──',
  'Administrativo/a',
  'Trabajador/a Social',
  'Gestor/a de casos',
  '── Dirección y Calidad ──',
  'Dirección médica / enfermería',
  'Técnico/a de calidad',
  'Técnico/a de prevención de riesgos',
]

export const isHeader = (cat) => cat.startsWith('──')

export const DESPERDICIOS = [
  { id: 'sobreproduccion',    label: 'Sobreproducción',          emoji: '📋', desc: 'Pruebas, informes o trámites innecesarios o duplicados' },
  { id: 'esperas',            label: 'Esperas',                   emoji: '⏳', desc: 'Tiempos muertos del paciente o del profesional' },
  { id: 'transporte',         label: 'Transporte innecesario',    emoji: '🚶', desc: 'Traslados evitables de pacientes, muestras o documentos' },
  { id: 'sobreprocesamiento', label: 'Sobreprocesamiento',        emoji: '📁', desc: 'Burocracia redundante, registros duplicados' },
  { id: 'inventario',         label: 'Inventario excesivo',       emoji: '📦', desc: 'Stock de material sin rotación o caducado' },
  { id: 'movimientos',        label: 'Movimientos innecesarios',  emoji: '🔄', desc: 'Desplazamientos evitables del personal' },
  { id: 'defectos',           label: 'Defectos / Errores',        emoji: '⚠️', desc: 'Errores clínicos o administrativos que requieren corrección' },
  { id: 'talento',            label: 'Talento desaprovechado',    emoji: '💡', desc: 'Sugerencias ignoradas, personal no implicado en la mejora' },
]

export const TIPOS_SUCESO = [
  'Caída de paciente',
  'Error de medicación',
  'Úlcera por presión (grado III-IV)',
  'Cirugía en lugar equivocado',
  'Reacción transfusional grave',
  'Infección nosocomial grave',
  'Suicidio en centro sanitario',
  'Retención de cuerpo extraño quirúrgico',
  'Error diagnóstico con daño grave',
  'Otro suceso centinela',
]

export const DIMENSIONES_VOTO = [
  {
    bloque: 'impacto', label: 'Impacto', emoji: '🎯', color: C.verde,
    items: [
      { key: 'impacto_seguridad',     label: 'Seguridad del paciente',    desc: '¿Reduce eventos adversos?' },
      { key: 'impacto_resultados',    label: 'Resultados clínicos',       desc: '¿Mejora los resultados asistenciales?' },
      { key: 'impacto_satisfaccion',  label: 'Satisfacción del paciente', desc: '¿Mejora la experiencia del paciente?' },
    ],
  },
  {
    bloque: 'alcance', label: 'Alcance', emoji: '👥', color: C.azul,
    items: [
      { key: 'alcance_pacientes',     label: 'Pacientes afectados',      desc: '¿A cuántos pacientes beneficia?' },
      { key: 'alcance_profesionales', label: 'Profesionales / Unidades', desc: '¿A cuántos profesionales afecta?' },
    ],
  },
  {
    bloque: 'coste', label: 'Coste', emoji: '💰', color: C.naranja,
    items: [
      { key: 'coste_economico', label: 'Coste económico directo', desc: '3=bajo coste, 1=alto coste' },
      { key: 'coste_rrhh',      label: 'Recursos humanos',        desc: '3=poco RRHH necesario, 1=mucho' },
      { key: 'coste_tiempo',    label: 'Tiempo de implantación',  desc: '3=implantación rápida, 1=lenta' },
    ],
  },
  {
    bloque: 'viabilidad', label: 'Viabilidad', emoji: '⚙️', color: C.teal,
    items: [
      { key: 'viabilidad_impl',      label: 'Facilidad de implementación', desc: '¿Es técnicamente sencilla?' },
      { key: 'viabilidad_cambio',    label: 'Resistencia al cambio',       desc: '3=poca resistencia esperada' },
      { key: 'viabilidad_formacion', label: 'Necesidad de formación',      desc: '3=poca formación necesaria' },
    ],
  },
  {
    bloque: 'rapidez', label: 'Rapidez de impacto', emoji: '⏱️', color: C.verdeClaro,
    items: [
      { key: 'rapidez_impacto', label: '¿Quick win o proyecto largo?', desc: '3=impacto inmediato, 1=largo plazo' },
    ],
  },
  {
    bloque: 'riesgo', label: 'Riesgo', emoji: '⚠️', color: C.rojo,
    items: [
      { key: 'riesgo_no_actuar',   label: 'Riesgo de no actuar',       desc: '3=muy arriesgado no actuar' },
      { key: 'riesgo_implementar', label: 'Riesgo de implementar mal', desc: '3=bajo riesgo si falla la impl.' },
    ],
  },
]

// ── AMFE: descriptores clínicos anclados S/O/D ─────────────────
export const AMFE_SEVERIDAD = [
  { valor: 1,  label: 'Sin efecto',          desc: 'Ningún impacto perceptible en el paciente o proceso' },
  { valor: 2,  label: 'Muy leve',            desc: 'Molestia mínima, sin necesidad de intervención' },
  { valor: 3,  label: 'Leve',                desc: 'Leve malestar, intervención menor requerida' },
  { valor: 4,  label: 'Moderado bajo',       desc: 'Intervención adicional, sin daño permanente' },
  { valor: 5,  label: 'Moderado',            desc: 'Requiere intervención clínica, estancia prolongada leve' },
  { valor: 6,  label: 'Moderado alto',       desc: 'Daño temporal significativo, hospitalización prolongada' },
  { valor: 7,  label: 'Grave',               desc: 'Daño grave temporal, posibles secuelas menores' },
  { valor: 8,  label: 'Muy grave',           desc: 'Daño grave con secuelas permanentes ⚠️ ALERTA' },
  { valor: 9,  label: 'Crítico',             desc: 'Daño irreversible grave, riesgo vital' },
  { valor: 10, label: 'Catastrófico',        desc: 'Muerte del paciente o daño catastrófico irreversible' },
]

export const AMFE_OCURRENCIA = [
  { valor: 1,  label: 'Casi imposible',      desc: 'Sin precedentes conocidos en el servicio' },
  { valor: 2,  label: 'Muy raro',            desc: 'Un caso en varios años en el servicio' },
  { valor: 3,  label: 'Raro',                desc: 'Algún caso aislado al año' },
  { valor: 4,  label: 'Poco frecuente',      desc: 'Ocurre algunas veces al año' },
  { valor: 5,  label: 'Ocasional',           desc: 'Ocurre una vez al mes aproximadamente' },
  { valor: 6,  label: 'Moderado',            desc: 'Varias veces al mes' },
  { valor: 7,  label: 'Frecuente',           desc: 'Ocurre todas las semanas' },
  { valor: 8,  label: 'Muy frecuente',       desc: 'Varias veces por semana' },
  { valor: 9,  label: 'Habitual',            desc: 'Ocurre casi a diario' },
  { valor: 10, label: 'Inevitable',          desc: 'Ocurre de forma sistemática, a diario o en cada caso' },
]

export const AMFE_DETECTABILIDAD = [
  { valor: 1,  label: 'Detección segura',    desc: 'Controles automáticos siempre eficaces, imposible que pase' },
  { valor: 2,  label: 'Casi segura',         desc: 'Muy alta probabilidad de detección antes del daño' },
  { valor: 3,  label: 'Alta',                desc: 'Controles fiables, raramente se escapa' },
  { valor: 4,  label: 'Moderada-alta',       desc: 'Alta probabilidad de detección con los controles actuales' },
  { valor: 5,  label: 'Moderada',            desc: 'Detección posible pero no garantizada' },
  { valor: 6,  label: 'Baja-moderada',       desc: 'Los controles actuales pueden no detectarlo' },
  { valor: 7,  label: 'Baja',                desc: 'Difícil detectar, depende de factores humanos' },
  { valor: 8,  label: 'Muy baja',            desc: 'Poco probable detectarlo antes de que cause daño' },
  { valor: 9,  label: 'Casi indetectable',   desc: 'Prácticamente indetectable con los medios actuales' },
  { valor: 10, label: 'Indetectable',        desc: 'Imposible detectar antes de que cause daño al paciente' },
]

export const AMFE_TIPOS_PROCESO = [
  '── Procesos Clínicos ──',
  'Administración de medicación',
  'Cirugía / procedimiento quirúrgico',
  'Prueba diagnóstica (imagen, laboratorio)',
  'Transfusión sanguínea',
  'Sedación / anestesia',
  'Identificación del paciente',
  'Prevención de caídas',
  'Prevención de infecciones / higiene de manos',
  'Alta hospitalaria / continuidad asistencial',
  'Urgencias / triaje',
  '── Procesos Organizativos ──',
  'Gestión de camas / flujo de pacientes',
  'Comunicación entre turnos / traspaso de guardia',
  'Gestión de resultados críticos de laboratorio',
  'Programación quirúrgica',
  'Gestión de listas de espera',
  '── Procesos Administrativos ──',
  'Citación y gestión de agendas',
  'Gestión de historia clínica',
  'Codificación diagnóstica',
  'Facturación y gestión económica',
  'Otro proceso (especificar en descripción)',
]

export const PASSWORD_COORDINADOR = 'molinero26'
