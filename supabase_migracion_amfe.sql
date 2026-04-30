-- ================================================================
-- CALIDAD TOTAL · Migración v3 — Módulo AMFE
-- Ejecutar DESPUÉS del script principal calidad_total_supabase.sql
-- y DESPUÉS de supabase_migracion_v2.sql
-- ================================================================

-- 1. PASOS DEL PROCESO AMFE (definidos por el coordinador)
CREATE TABLE IF NOT EXISTS pasos_amfe (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proceso_id   UUID NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
  orden        SMALLINT NOT NULL,
  descripcion  TEXT NOT NULL,
  generado_ia  BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (proceso_id, orden)
);
CREATE INDEX IF NOT EXISTS idx_pasos_amfe_proceso ON pasos_amfe(proceso_id);
ALTER TABLE pasos_amfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso_publico" ON pasos_amfe FOR ALL USING (true) WITH CHECK (true);

-- 2. APORTACIONES AMFE (una fila por modo de fallo por participante)
CREATE TABLE IF NOT EXISTS aportaciones_amfe (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participacion_id  UUID NOT NULL REFERENCES participaciones(id) ON DELETE CASCADE,
  proceso_id        UUID NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
  paso_id           UUID NOT NULL REFERENCES pasos_amfe(id) ON DELETE CASCADE,
  modo_fallo        TEXT NOT NULL,
  efecto            TEXT,
  causa             TEXT,
  severidad         SMALLINT NOT NULL CHECK (severidad BETWEEN 1 AND 10),
  ocurrencia        SMALLINT NOT NULL CHECK (ocurrencia BETWEEN 1 AND 10),
  detectabilidad    SMALLINT NOT NULL CHECK (detectabilidad BETWEEN 1 AND 10),
  npr               SMALLINT GENERATED ALWAYS AS (severidad * ocurrencia * detectabilidad) STORED,
  consolidado_en    UUID,   -- referencia al modo consolidado (tras síntesis coordinador)
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_aport_amfe_proceso ON aportaciones_amfe(proceso_id);
CREATE INDEX IF NOT EXISTS idx_aport_amfe_paso    ON aportaciones_amfe(paso_id);
ALTER TABLE aportaciones_amfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso_publico" ON aportaciones_amfe FOR ALL USING (true) WITH CHECK (true);

-- 3. MODOS DE FALLO CONSOLIDADOS (tras síntesis IA del coordinador)
CREATE TABLE IF NOT EXISTS modos_fallo_amfe (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  proceso_id    UUID NOT NULL REFERENCES procesos(id) ON DELETE CASCADE,
  paso_id       UUID NOT NULL REFERENCES pasos_amfe(id) ON DELETE CASCADE,
  modo_fallo    TEXT NOT NULL,
  efecto        TEXT,
  causa         TEXT,
  n_aportaciones INTEGER DEFAULT 1,
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_modos_amfe_proceso ON modos_fallo_amfe(proceso_id);
ALTER TABLE modos_fallo_amfe ENABLE ROW LEVEL SECURITY;
CREATE POLICY "acceso_publico" ON modos_fallo_amfe FOR ALL USING (true) WITH CHECK (true);

-- 4. VISTA: RANKING AMFE POR NPR MEDIO
CREATE OR REPLACE VIEW ranking_amfe AS
SELECT
  a.proceso_id,
  a.paso_id,
  p.descripcion          AS paso_descripcion,
  p.orden                AS paso_orden,
  a.modo_fallo,
  a.efecto,
  a.causa,
  COUNT(a.id)            AS n_aportaciones,
  ROUND(AVG(a.severidad)::NUMERIC,     2) AS severidad_media,
  ROUND(AVG(a.ocurrencia)::NUMERIC,    2) AS ocurrencia_media,
  ROUND(AVG(a.detectabilidad)::NUMERIC,2) AS detectabilidad_media,
  ROUND(AVG(a.npr)::NUMERIC,           1) AS npr_medio,
  MAX(a.severidad)       AS severidad_max,
  -- Dispersión (desviación estándar del NPR)
  ROUND(STDDEV(a.npr)::NUMERIC, 1)        AS npr_desviacion,
  -- Alerta crítica
  CASE WHEN MAX(a.severidad) >= 8 OR AVG(a.npr) >= 100 THEN TRUE ELSE FALSE END AS critico
FROM aportaciones_amfe a
JOIN pasos_amfe p ON p.id = a.paso_id
GROUP BY a.proceso_id, a.paso_id, p.descripcion, p.orden, a.modo_fallo, a.efecto, a.causa
ORDER BY npr_medio DESC;

-- 5. Añadir tipo 'amfe' al CHECK de procesos
-- Nota: en PostgreSQL no se puede modificar CHECK directamente.
-- Ejecutar esto para reemplazarlo:
ALTER TABLE procesos DROP CONSTRAINT IF EXISTS procesos_tipo_check;
ALTER TABLE procesos ADD CONSTRAINT procesos_tipo_check
  CHECK (tipo IN ('lean', 'rca', 'amfe'));

-- 6. Estado 'puntuacion' en procesos (para AMFE)
ALTER TABLE procesos DROP CONSTRAINT IF EXISTS procesos_estado_check;
ALTER TABLE procesos ADD CONSTRAINT procesos_estado_check
  CHECK (estado IN (
    'aportaciones',
    'puntuacion',
    'votacion',
    'plan_accion',
    'seguimiento',
    'cerrado'
  ));

-- ================================================================
-- Verificación final
-- ================================================================
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;
-- Deberías ver ahora también: aportaciones_amfe, modos_fallo_amfe, pasos_amfe
-- Y la vista: ranking_amfe
