-- Migration: 020_icd10_codes.sql
-- Description: Base de datos CIE-10 completa con búsqueda semántica para historias clínicas inteligentes
-- TASK: TASK-BE-041
-- Epic: EPIC-004 (Historias Clínicas Inteligentes)

-- Habilitar extensión para búsqueda de similitud (trigram)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Tabla principal de códigos CIE-10
CREATE TABLE IF NOT EXISTS icd10_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Código CIE-10 (ej: "I10", "E11.9")
  code text NOT NULL UNIQUE,

  -- Descripción completa (ej: "Hipertensión esencial (primaria)")
  description text NOT NULL,

  -- Categoría/Capítulo (ej: "I00-I99 Enfermedades del sistema circulatorio")
  category text NOT NULL,
  chapter_code text, -- "I00-I99"
  chapter_name text, -- "Enfermedades del sistema circulatorio"

  -- Jerarquía (algunos códigos son subcategorías de otros)
  parent_code text REFERENCES icd10_codes(code) ON DELETE SET NULL,

  -- Sinónimos y términos de búsqueda (array de strings)
  search_terms text[] DEFAULT '{}',

  -- Metadata
  is_billable boolean DEFAULT true, -- Si es válido para facturación
  includes_note text, -- Notas de inclusión
  excludes_note text, -- Notas de exclusión

  -- Frecuencia de uso (para ordenar resultados populares primero)
  usage_count integer DEFAULT 0,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para búsqueda rápida

-- Índice para búsqueda por código exacto
CREATE INDEX IF NOT EXISTS idx_icd10_code ON icd10_codes(code);

-- Índice GIN con trigram para búsqueda difusa de descripción
CREATE INDEX IF NOT EXISTS idx_icd10_description_trgm ON icd10_codes USING gin(description gin_trgm_ops);

-- Índice GIN para búsqueda en array de sinónimos
CREATE INDEX IF NOT EXISTS idx_icd10_search_terms ON icd10_codes USING gin(search_terms);

-- Índice para filtrado por categoría
CREATE INDEX IF NOT EXISTS idx_icd10_category ON icd10_codes(category);

-- Índice para filtrado por capítulo
CREATE INDEX IF NOT EXISTS idx_icd10_chapter_code ON icd10_codes(chapter_code);

-- Índice para ordenar por frecuencia de uso
CREATE INDEX IF NOT EXISTS idx_icd10_usage_count ON icd10_codes(usage_count DESC);

-- Columna para búsqueda full-text en español
ALTER TABLE icd10_codes ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Índice GIN para búsqueda full-text
CREATE INDEX IF NOT EXISTS idx_icd10_search_vector ON icd10_codes USING gin(search_vector);

-- Trigger para actualizar search_vector automáticamente
CREATE OR REPLACE FUNCTION icd10_search_vector_update() RETURNS trigger AS $$
BEGIN
  -- Peso A: código (más importante)
  -- Peso B: descripción (importante)
  -- Peso C: sinónimos (menos importante)
  NEW.search_vector :=
    setweight(to_tsvector('spanish', COALESCE(NEW.code, '')), 'A') ||
    setweight(to_tsvector('spanish', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('spanish', COALESCE(array_to_string(NEW.search_terms, ' '), '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trgm_icd10_search_vector ON icd10_codes;
CREATE TRIGGER trgm_icd10_search_vector
BEFORE INSERT OR UPDATE ON icd10_codes
FOR EACH ROW
EXECUTE FUNCTION icd10_search_vector_update();

-- RLS Policies: lectura pública para usuarios autenticados, escritura solo para superadmins

ALTER TABLE icd10_codes ENABLE ROW LEVEL SECURITY;

-- Policy: lectura para todos los usuarios autenticados
DROP POLICY IF EXISTS "ICD10 codes are readable by all authenticated users" ON icd10_codes;
CREATE POLICY "ICD10 codes are readable by all authenticated users"
ON icd10_codes FOR SELECT
TO authenticated
USING (true);

-- Policy: escritura solo para service_role (scripts de seed)
-- No crear policy restrictiva para INSERT/UPDATE/DELETE ya que usaremos service_role_key para seeds

-- Función para incrementar el contador de uso (llamar desde API cuando se selecciona un código)
CREATE OR REPLACE FUNCTION increment_icd10_usage(code_param text)
RETURNS void AS $$
BEGIN
  UPDATE icd10_codes
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE code = code_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comentarios en tabla para documentación
COMMENT ON TABLE icd10_codes IS 'Códigos CIE-10 (Clasificación Internacional de Enfermedades, 10ª revisión) en español para historias clínicas inteligentes';
COMMENT ON COLUMN icd10_codes.code IS 'Código CIE-10 único (ej: I10, E11.9)';
COMMENT ON COLUMN icd10_codes.description IS 'Descripción completa del diagnóstico en español';
COMMENT ON COLUMN icd10_codes.category IS 'Categoría dentro del capítulo CIE-10';
COMMENT ON COLUMN icd10_codes.chapter_code IS 'Código del capítulo CIE-10 (ej: I00-I99)';
COMMENT ON COLUMN icd10_codes.chapter_name IS 'Nombre del capítulo CIE-10';
COMMENT ON COLUMN icd10_codes.parent_code IS 'Código padre para jerarquía (códigos generales vs específicos)';
COMMENT ON COLUMN icd10_codes.search_terms IS 'Array de sinónimos y términos alternativos para búsqueda';
COMMENT ON COLUMN icd10_codes.is_billable IS 'Si es válido para facturación a aseguradoras';
COMMENT ON COLUMN icd10_codes.usage_count IS 'Contador de uso para ordenar resultados por popularidad';
COMMENT ON COLUMN icd10_codes.search_vector IS 'Vector de búsqueda full-text (generado automáticamente)';
