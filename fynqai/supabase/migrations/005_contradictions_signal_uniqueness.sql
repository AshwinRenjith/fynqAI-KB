-- Phase 6.1 - contradiction persistence hardening
-- Goal:
-- 1) allow multiple distinct contradictions between the same chunk pair
-- 2) still prevent exact duplicate contradiction rows

ALTER TABLE contradictions
DROP CONSTRAINT IF EXISTS contradictions_chunk_a_id_chunk_b_id_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contradictions_unique_signal
ON contradictions (
  workspace_id,
  LEAST(chunk_a_id, chunk_b_id),
  GREATEST(chunk_a_id, chunk_b_id),
  lower(entity_subject),
  contradiction_type,
  LEAST(value_a, value_b),
  GREATEST(value_a, value_b)
);

CREATE INDEX IF NOT EXISTS idx_contradictions_status_authoritative
ON contradictions (status, authoritative_chunk_id)
WHERE authoritative_chunk_id IS NOT NULL;
