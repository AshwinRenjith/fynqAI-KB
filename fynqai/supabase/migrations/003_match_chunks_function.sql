-- Phase 5 - Hybrid retrieval SQL function

CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding VECTOR(1024),
  workspace_filter UUID,
  match_count INT DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  text TEXT,
  document_id UUID,
  section_header TEXT,
  entities JSONB,
  document_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.text,
    c.document_id,
    c.section_header,
    c.entities,
    d.name AS document_name,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM chunks c
  JOIN documents d ON c.document_id = d.id
  WHERE c.workspace_id = workspace_filter
    AND d.status = 'ready'
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
