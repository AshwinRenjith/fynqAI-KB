#!/usr/bin/env node
/**
 * Diagnose why hybridSearch returns 0 chunks.
 * Checks: documents exist & ready, chunks exist, embeddings present, workspace match.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(import.meta.dirname, '../.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function main() {
  // 1. All workspaces
  const { data: workspaces } = await supabase.from('workspaces').select('id, name, slug');
  console.log('\n=== WORKSPACES ===');
  console.table(workspaces);

  // 2. All documents
  const { data: docs } = await supabase
    .from('documents')
    .select('id, workspace_id, name, status, chunk_count, is_deprecated')
    .order('created_at', { ascending: false });
  console.log('\n=== DOCUMENTS ===');
  console.table(docs);

  if (!docs || docs.length === 0) {
    console.error('\n❌ No documents found in any workspace. Nothing to search.');
    return;
  }

  // 3. Chunks overview
  const { data: chunkStats } = await supabase
    .from('chunks')
    .select('id, document_id, workspace_id, chunk_index, token_count');
  console.log(`\n=== CHUNKS: ${chunkStats?.length ?? 0} total ===`);
  if (chunkStats && chunkStats.length > 0) {
    console.table(chunkStats.slice(0, 20));
  }

  // 4. Check embeddings presence
  const { data: embeddingCheck } = await supabase
    .from('chunks')
    .select('id, document_id')
    .not('embedding', 'is', null)
    .limit(5);
  console.log(`\n=== CHUNKS WITH EMBEDDINGS: ${embeddingCheck?.length ?? 0} (showing up to 5) ===`);
  console.table(embeddingCheck);

  const { data: noEmbedding } = await supabase
    .from('chunks')
    .select('id, document_id')
    .is('embedding', null);
  console.log(`=== CHUNKS WITHOUT EMBEDDINGS: ${noEmbedding?.length ?? 0} ===`);
  if (noEmbedding && noEmbedding.length > 0) {
    console.table(noEmbedding.slice(0, 10));
  }

  // 5. Test RPC match_chunks (with a dummy zero vector to see if function works at all)
  if (embeddingCheck && embeddingCheck.length > 0) {
    const wsId = chunkStats?.[0]?.workspace_id;
    // Create a 1024-dim zero vector (just to test the RPC call)
    const zeroVec = new Array(1024).fill(0);
    const { data: rpcResult, error: rpcErr } = await supabase.rpc('match_chunks', {
      query_embedding: JSON.stringify(zeroVec),
      workspace_filter: wsId,
      match_count: 5,
    });
    console.log('\n=== RPC match_chunks (zero vector test) ===');
    if (rpcErr) {
      console.error('RPC ERROR:', rpcErr.message, rpcErr.details, rpcErr.hint);
    } else {
      console.log(`Returned ${rpcResult?.length ?? 0} rows`);
      console.table(rpcResult?.map(r => ({ id: r.id, similarity: r.similarity, document_name: r.document_name })));
    }
  }

  // 6. Keyword search test
  const wsId = docs[0]?.workspace_id;
  const { data: kwResults, error: kwErr } = await supabase
    .from('chunks')
    .select('id, text, document_id, section_header, documents!inner(name, workspace_id)')
    .eq('documents.workspace_id', wsId)
    .textSearch('text_search', 'backend api', { type: 'websearch' })
    .limit(5);
  console.log('\n=== KEYWORD SEARCH: "backend api" ===');
  if (kwErr) {
    console.error('KEYWORD ERROR:', kwErr.message, kwErr.details);
  } else {
    console.log(`Returned ${kwResults?.length ?? 0} rows`);
    if (kwResults && kwResults.length > 0) {
      kwResults.forEach((r, i) => {
        console.log(`  [${i}] chunk=${r.id}, doc=${r.document_id}, text=${r.text?.slice(0, 100)}...`);
      });
    }
  }

  // 7. Check workspace_members to verify which workspace the user sees
  const { data: members } = await supabase.from('workspace_members').select('user_id, workspace_id, role');
  console.log('\n=== WORKSPACE MEMBERS ===');
  console.table(members);

  // 8. Check if documents are deprecated
  const deprecatedDocs = docs?.filter(d => d.is_deprecated);
  if (deprecatedDocs && deprecatedDocs.length > 0) {
    console.log('\n⚠️  DEPRECATED DOCUMENTS:');
    console.table(deprecatedDocs);
  }
}

main().catch(console.error);
