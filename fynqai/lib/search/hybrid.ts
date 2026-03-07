import { embedQuery } from '@/lib/ai/embed';
import { createAdminClient } from '@/lib/supabase/server';

export interface SearchResult {
	id: string;
	text: string;
	document_id: string;
	section_header: string | null;
	entities: unknown[];
	document_name: string;
	combined_score: number;
}

interface RpcChunkMatch {
	id: string;
	text: string;
	document_id: string;
	section_header: string | null;
	entities: unknown[] | null;
	document_name: string | null;
	similarity: number;
}

interface KeywordRow {
	id: string;
	text: string;
	document_id: string;
	section_header: string | null;
	entities: unknown[] | null;
	documents: { name: string } | { name: string }[] | null;
}

interface DeprecationRow {
	id: string;
	chunk_a_id: string;
	chunk_b_id: string;
	authoritative_chunk_id: string | null;
}

interface DocumentDeprecationRow {
	id: string;
}

function getDocumentNameFromJoin(joinValue: KeywordRow['documents']): string {
	if (!joinValue) return '';
	if (Array.isArray(joinValue)) return joinValue[0]?.name ?? '';
	return joinValue.name;
}

async function getDeprecatedChunkIds(
	supabase: ReturnType<typeof createAdminClient>,
	candidateChunkIds: string[]
): Promise<Set<string>> {
	const deprecated = new Set<string>();
	if (candidateChunkIds.length === 0) return deprecated;

	const [{ data: byChunkA }, { data: byChunkB }] = await Promise.all([
		supabase
			.from('contradictions')
			.select('id, chunk_a_id, chunk_b_id, authoritative_chunk_id')
			.eq('status', 'resolved')
			.not('authoritative_chunk_id', 'is', null)
			.in('chunk_a_id', candidateChunkIds),
		supabase
			.from('contradictions')
			.select('id, chunk_a_id, chunk_b_id, authoritative_chunk_id')
			.eq('status', 'resolved')
			.not('authoritative_chunk_id', 'is', null)
			.in('chunk_b_id', candidateChunkIds),
	]);

	const merged = new Map<string, DeprecationRow>();
	for (const row of [...(byChunkA ?? []), ...(byChunkB ?? [])] as DeprecationRow[]) {
		merged.set(row.id, row);
	}

	for (const row of merged.values()) {
		if (!row.authoritative_chunk_id) continue;

		if (row.authoritative_chunk_id === row.chunk_a_id) {
			deprecated.add(row.chunk_b_id);
			continue;
		}

		if (row.authoritative_chunk_id === row.chunk_b_id) {
			deprecated.add(row.chunk_a_id);
		}
	}

	return deprecated;
}

async function getDeprecatedDocumentIds(
	supabase: ReturnType<typeof createAdminClient>,
	candidateDocumentIds: string[]
): Promise<Set<string>> {
	const deprecated = new Set<string>();
	if (candidateDocumentIds.length === 0) return deprecated;

	const { data } = await supabase
		.from('documents')
		.select('id')
		.eq('is_deprecated', true)
		.in('id', candidateDocumentIds);

	for (const row of (data ?? []) as DocumentDeprecationRow[]) {
		deprecated.add(row.id);
	}

	return deprecated;
}

export async function hybridSearch(
	query: string,
	workspaceId: string,
	topK: number = 10
): Promise<SearchResult[]> {
	const supabase = createAdminClient();
	const queryEmbedding = await embedQuery(query);

	const { data: vectorResults, error: vectorError } = await supabase.rpc('match_chunks', {
		query_embedding: JSON.stringify(queryEmbedding),
		workspace_filter: workspaceId,
		match_count: 30,
	});

	if (vectorError) {
		console.error('[hybridSearch] Vector search failed:', vectorError.message, vectorError.details);
	}

	const { data: keywordResults, error: keywordError } = await supabase
		.from('chunks')
		.select('id, text, document_id, section_header, entities, documents!inner(name, workspace_id)')
		.eq('documents.workspace_id', workspaceId)
		.textSearch('text_search', query, { type: 'websearch' })
		.limit(20);

	if (keywordError) {
		console.error('[hybridSearch] Keyword search failed:', keywordError.message, keywordError.details);
	}

	const scoreMap = new Map<string, SearchResult>();

	(vectorResults as RpcChunkMatch[] | null | undefined)?.forEach((item, rank) => {
		const rrf = 1 / (60 + rank);
		scoreMap.set(item.id, {
			id: item.id,
			text: item.text,
			document_id: item.document_id,
			section_header: item.section_header,
			entities: item.entities ?? [],
			document_name: item.document_name ?? '',
			combined_score: rrf * 0.7,
		});
	});

	(keywordResults as KeywordRow[] | null | undefined)?.forEach((item, rank) => {
		const rrf = 1 / (60 + rank);
		const existing = scoreMap.get(item.id);

		if (existing) {
			existing.combined_score += rrf * 0.3;
			if (!existing.document_name) {
				existing.document_name = getDocumentNameFromJoin(item.documents);
			}
			return;
		}

		scoreMap.set(item.id, {
			id: item.id,
			text: item.text,
			document_id: item.document_id,
			section_header: item.section_header,
			entities: item.entities ?? [],
			document_name: getDocumentNameFromJoin(item.documents),
			combined_score: rrf * 0.3,
		});
	});

	const ranked = Array.from(scoreMap.values())
		.sort((a, b) => b.combined_score - a.combined_score)
		.slice(0, topK);

	const deprecatedChunkIds = await getDeprecatedChunkIds(
		supabase,
		ranked.map((chunk) => chunk.id)
	);
	const deprecatedDocumentIds = await getDeprecatedDocumentIds(
		supabase,
		ranked.map((chunk) => chunk.document_id)
	);

	return ranked.filter(
		(chunk) => !deprecatedChunkIds.has(chunk.id) && !deprecatedDocumentIds.has(chunk.document_id)
	);
}
