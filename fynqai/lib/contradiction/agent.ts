// lib/contradiction/agent.ts
/**
 * Phase 6 — Contradiction Agent
 * Main scanner that detects contradictions between entities across documents.
 * Called at the end of the ingestion pipeline after entity extraction.
 */

import { createAdminClient } from '@/lib/supabase/server';
import { valuesConflict, scopesOverlap, getUnitFamily } from './normalize';
import { scoreContradiction, determineSeverity } from './score';
import { createContradictionNotification } from './notify';
import type { Entity } from '@/types/app.types';

const MIN_ENTITY_CONFIDENCE = 0.65;
const MIN_SUBJECT_SIMILARITY_STRICT = 0.55;
const MIN_SUBJECT_SIMILARITY_NUMERIC = 0.45;
const MIN_CONTRADICTION_CONFIDENCE = 0.62;
const SUBJECT_STOPWORDS = new Set([
	'the',
	'a',
	'an',
	'and',
	'or',
	'for',
	'of',
	'in',
	'on',
	'to',
	'with',
	'from',
	'by',
	'policy',
	'rule',
	'standard',
	'definition',
	'guideline',
	'framework',
	'stack',
	'tech',
	'technology',
	'purpose',
	'version',
	'latest',
]);

/* ------------------------------------------------------------------ */
/*  Internal types                                                     */
/* ------------------------------------------------------------------ */

interface ChunkRow {
	id: string;
	entities: Entity[];
	document_id: string;
}

interface CandidateRow {
	id: string;
	entities: Entity[];
	document_id: string;
	documents: {
		id: string;
		created_at: string;
		workspace_id: string;
	};
}

/* ------------------------------------------------------------------ */
/*  Contradiction type resolver                                        */
/* ------------------------------------------------------------------ */

function resolveContradictionType(
	entityType: Entity['type']
): 'quantitative' | 'temporal' | 'policy' | 'definitional' | 'scope_drift' {
	switch (entityType) {
		case 'QUANTITY':
		case 'PRICE':
			return 'quantitative';
		case 'DATE':
			return 'temporal';
		case 'POLICY_RULE':
			return 'policy';
		case 'DEFINITION':
			return 'definitional';
		default:
			return 'scope_drift';
	}
}

function subjectTokens(subject: string): string[] {
	return subject
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.split(/\s+/)
		.filter((token) => token.length >= 3 && !SUBJECT_STOPWORDS.has(token));
}

function canonicalSubject(subject: string): string {
	const tokens = subjectTokens(subject);
	if (tokens.length === 0) {
		return subject.toLowerCase().replace(/\s+/g, ' ').trim();
	}

	return Array.from(new Set(tokens)).sort().join(' ');
}

function subjectSimilarity(subjectA: string, subjectB: string): number {
	const a = new Set(subjectTokens(subjectA));
	const b = new Set(subjectTokens(subjectB));

	if (a.size === 0 || b.size === 0) return 0;

	const intersection = [...a].filter((token) => b.has(token)).length;
	const union = new Set([...a, ...b]).size;
	return union > 0 ? intersection / union : 0;
}

function isNumericLikeType(type: Entity['type']): boolean {
	return type === 'QUANTITY' || type === 'PRICE' || type === 'DATE';
}

function dedupeEntitiesForScan(entities: Entity[]): Entity[] {
	const deduped = new Map<string, Entity>();

	for (const entity of entities) {
		const key = `${entity.type}|${canonicalSubject(entity.subject)}`;
		const prev = deduped.get(key);
		if (!prev || entity.confidence > prev.confidence) {
			deduped.set(key, entity);
		}
	}

	return Array.from(deduped.values());
}

/* ------------------------------------------------------------------ */
/*  Public API                                                         */
/* ------------------------------------------------------------------ */

/**
 * Scans a newly-uploaded document's chunks for contradictions
 * against every other chunk in the same workspace.
 *
 * Flow:
 *   1. Fetch the new chunks that actually have entities.
 *   2. For each entity (confidence >= 0.65), pull candidate chunks
 *      from *other* documents in the workspace.
 *   3. Keep only high-precision candidate matches by type + subject similarity.
 *   4. Score each valid conflict and keep only the best match per entity/candidate chunk.
 *   5. Insert contradictions with confidence >= 0.62.
 *   6. Notify workspace admins for critical contradictions (>= 0.70).
 */
export async function runContradictionScan(
	documentId: string,
	workspaceId: string,
	chunkIds: string[]
): Promise<void> {
	const supabase = createAdminClient();

	console.log('[Contradiction Agent] Starting scan for document', documentId, 'with', chunkIds.length, 'chunks');

	// ── 1. Fetch new chunks that have non-empty entities ────────────
	const { data: newChunks, error: chunkErr } = await supabase
		.from('chunks')
		.select('id, entities, document_id')
		.in('id', chunkIds);

	if (chunkErr) {
		console.error('[Contradiction Agent] Failed to fetch new chunks:', chunkErr);
		return;
	}

	// Keep only chunks that have at least one entity
	const chunksWithEntities = (newChunks ?? []).filter(
		(c) =>
			Array.isArray(c.entities) &&
			(c.entities as unknown as Entity[]).length > 0
	) as unknown as ChunkRow[];

	if (chunksWithEntities.length === 0) return;

	// ── 2. Fetch the new document's created_at for temporal scoring ─
	const { data: newDoc } = await supabase
		.from('documents')
		.select('created_at')
		.eq('id', documentId)
		.single();

	if (!newDoc) return;

	// ── 3. Fetch candidate chunks from recent OTHER documents ───────
	// We pick recent documents first, then fetch their chunks, so the
	// immediately previous upload is not dropped by an arbitrary chunk limit.
	const { data: recentDocs, error: docsErr } = await supabase
		.from('documents')
		.select('id')
		.eq('workspace_id', workspaceId)
		.neq('id', documentId)
		.order('created_at', { ascending: false })
		.limit(75);

	if (docsErr) {
		console.error('[Contradiction Agent] Failed to fetch candidate documents:', docsErr);
		return;
	}

	const candidateDocIds = (recentDocs ?? []).map((doc) => doc.id);
	if (candidateDocIds.length === 0) return;

	const { data: allCandidates, error: candErr } = await supabase
		.from('chunks')
		.select(
			`id, entities, document_id,
			 documents!inner(id, created_at, workspace_id)`
		)
		.in('document_id', candidateDocIds)
		.limit(1200);

	if (candErr) {
		console.error('[Contradiction Agent] Failed to fetch candidates:', candErr);
		return;
	}

	// Keep only candidates that actually have entities
	const candidates = ((allCandidates ?? []) as unknown as CandidateRow[]).filter(
		(c) => Array.isArray(c.entities) && c.entities.length > 0
	);

	if (candidates.length === 0) return;

	// ── 4. Compare every new entity against every candidate entity ──
	for (const newChunk of chunksWithEntities) {
		const highConfEntities = dedupeEntitiesForScan(
			newChunk.entities.filter((e) => e.confidence >= MIN_ENTITY_CONFIDENCE)
		);
		if (highConfEntities.length === 0) continue;

		for (const entity of highConfEntities) {
			// Determine unit family for QUANTITY/PRICE entities
			const normVal = entity.normalized_value as Record<string, unknown> | undefined;
			const entityUnitFamily =
				normVal?.unit ? getUnitFamily(normVal.unit as string) : null;

			for (const candidate of candidates) {
				const candidateEntities = dedupeEntitiesForScan(
					candidate.entities.filter((ce) => ce.type === entity.type && ce.confidence >= MIN_ENTITY_CONFIDENCE)
				);

				let bestMatch: { entity: Entity; confidence: number; canonical: string } | null = null;

				for (const matchEntity of candidateEntities) {
					let similarity = subjectSimilarity(entity.subject, matchEntity.subject);

					if (isNumericLikeType(entity.type) && entityUnitFamily) {
						const ceNorm = matchEntity.normalized_value as Record<string, unknown> | undefined;
						const ceFamily = ceNorm?.unit ? getUnitFamily(ceNorm.unit as string) : null;
						if (ceFamily === entityUnitFamily) {
							similarity = Math.max(similarity, MIN_SUBJECT_SIMILARITY_NUMERIC);
						}
					}

					const minSimilarity = isNumericLikeType(entity.type)
						? MIN_SUBJECT_SIMILARITY_NUMERIC
						: MIN_SUBJECT_SIMILARITY_STRICT;

					if (similarity < minSimilarity) continue;

					const overlap = scopesOverlap(entity.scope, matchEntity.scope);
					if (!overlap) continue;

					const differs = valuesConflict(
						entity as unknown as Record<string, unknown>,
						matchEntity as unknown as Record<string, unknown>
					);
					if (!differs) continue;

					const confidence = scoreContradiction({
						entityA: entity,
						entityB: matchEntity,
						docACreatedAt: newDoc.created_at ?? new Date().toISOString(),
						docBCreatedAt: candidate.documents.created_at ?? new Date().toISOString(),
						scopeOverlap: overlap,
						valuesDiffer: differs,
					});

					if (confidence < MIN_CONTRADICTION_CONFIDENCE) continue;

					if (!bestMatch || confidence > bestMatch.confidence) {
						bestMatch = {
							entity: matchEntity,
							confidence,
							canonical: canonicalSubject(entity.subject),
						};
					}
				}

				if (!bestMatch) continue;

				const contradictionType = resolveContradictionType(entity.type);
				const severity = determineSeverity(bestMatch.confidence);

				const { data: row, error: insertErr } = await supabase
					.from('contradictions')
					.insert({
						workspace_id: workspaceId,
						chunk_a_id: newChunk.id,
						chunk_b_id: candidate.id,
						document_a_id: documentId,
						document_b_id: candidate.document_id,
						entity_subject: bestMatch.canonical || entity.subject,
						value_a: entity.value,
						value_b: bestMatch.entity.value,
						contradiction_type: contradictionType,
						confidence: bestMatch.confidence,
						severity,
						status: 'open',
						auto_resolved: false,
					})
					.select('id')
					.single();

				if (insertErr) {
					if (insertErr.code !== '23505') {
						console.error('[Contradiction Agent] Insert failed:', insertErr);
					}
					continue;
				}

				if (row?.id && severity === 'critical') {
					try {
						await createContradictionNotification(row.id, workspaceId);
					} catch (notifyErr) {
						console.error('[Contradiction Agent] Notification failed:', notifyErr);
					}
				}
			}
		}
	}
}


