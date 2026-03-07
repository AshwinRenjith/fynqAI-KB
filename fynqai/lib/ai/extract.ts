import { Mistral } from '@mistralai/mistralai';

import type { Entity } from '@/types/app.types';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export const THINKING_BUDGETS = {
	entity_extraction: 0,
	contradiction_score: 1024,
	chat_answer: 2048,
	contradiction_verify: 8192,
};

const ALLOWED_ENTITY_TYPES: Entity['type'][] = [
	'QUANTITY',
	'DATE',
	'PRICE',
	'POLICY_RULE',
	'DEFINITION',
	'PERSON',
	'PRODUCT',
];

const BASE_MIN_CONFIDENCE = 0.6;
const ADAPTIVE_MIN_CONFIDENCE = 0.4;

function messageContentToText(content: unknown): string {
	if (typeof content === 'string') return content;

	if (Array.isArray(content)) {
		return content
			.map((chunk) => {
				if (!chunk || typeof chunk !== 'object') return '';
				const maybeText = (chunk as { text?: unknown }).text;
				return typeof maybeText === 'string' ? maybeText : '';
			})
			.join('');
	}

	return '';
}

function coerceEntity(raw: unknown): Entity | null {
	if (!raw || typeof raw !== 'object') return null;

	const candidate = raw as Record<string, unknown>;
	const type = candidate.type;
	if (typeof type !== 'string' || !ALLOWED_ENTITY_TYPES.includes(type as Entity['type'])) {
		return null;
	}

	const value = typeof candidate.value === 'string' ? candidate.value : '';
	const subject = typeof candidate.subject === 'string' ? candidate.subject : '';
	const scope = typeof candidate.scope === 'string' ? candidate.scope : null;
	const confidence =
		typeof candidate.confidence === 'number' && Number.isFinite(candidate.confidence)
			? Math.min(Math.max(candidate.confidence, 0), 1)
			: 0;
	const normalizedValue =
		candidate.normalized_value && typeof candidate.normalized_value === 'object'
			? (candidate.normalized_value as Record<string, unknown>)
			: {};

	if (!value || !subject) return null;

	return {
		type: type as Entity['type'],
		value,
		normalized_value: normalizedValue,
		subject,
		scope,
		confidence,
	};
}

function normalizeSubjectText(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function filterEntitiesAdaptively(entities: Entity[]): Entity[] {
	const strict = entities.filter((entity) => entity.confidence >= BASE_MIN_CONFIDENCE);
	if (strict.length > 0) return strict;

	return entities.filter((entity) => entity.confidence >= ADAPTIVE_MIN_CONFIDENCE);
}

function extractEntitiesFromMarkdownTables(chunkText: string): Entity[] {
	const lines = chunkText.split('\n');
	let currentSection: string | null = null;
	const entities: Entity[] = [];

	for (const line of lines) {
		const heading = line.match(/^#{1,6}\s+(.+)$/);
		if (heading) {
			currentSection = heading[1].trim();
			continue;
		}

		const row = line.match(/^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*$/);
		if (!row) continue;

		const colA = row[1].trim();
		const colB = row[2].trim();
		const colC = row[3].trim();

		if (
			/^:?-+:?$/.test(colA) ||
			/^:?-+:?$/.test(colB) ||
			/^:?-+:?$/.test(colC)
		) {
			continue;
		}

		if (/technology/i.test(colA) && /version/i.test(colB) && /purpose/i.test(colC)) {
			continue;
		}

		const section = currentSection ?? 'Tech Stack';
		const subject = normalizeSubjectText(`${section} ${colC}`);
		if (!subject) continue;

		entities.push({
			type: 'PRODUCT',
			value: `${colA} (${colB})`,
			normalized_value: {
				name: colA,
				version: colB,
				purpose: colC,
			},
			subject,
			scope: section,
			confidence: 0.85,
		});
	}

	const seen = new Set<string>();
	return entities.filter((entity) => {
		const key = `${entity.type}|${entity.subject}|${entity.value}`;
		if (seen.has(key)) return false;
		seen.add(key);
		return true;
	});
}

function extractFallbackEntities(chunkText: string): Entity[] {
	return extractEntitiesFromMarkdownTables(chunkText);
}

export async function extractEntities(chunkText: string): Promise<Entity[]> {
	const systemPrompt =
		'You extract structured entities from business text. Return strict JSON only.';

	const userPrompt = `Extract all typed entities from the chunk below.

Return this exact JSON shape and no extra text:
{
	"entities": [
		{
			"type": "QUANTITY | DATE | PRICE | POLICY_RULE | DEFINITION | PERSON | PRODUCT",
			"value": "<exact value as written>",
			"normalized_value": {},
			"subject": "<what this value applies to - very specific>",
			"scope": "<limiting context if any, else null>",
			"confidence": 0.0
		}
	]
}

Normalization rules:
- QUANTITY: {"amount": number, "unit": "g|kg|t|lb|ml|l|fl_oz|mm|cm|m|km|ft|in|day|days|week|weeks|month|months|year|years|units"}
- DATE: {"iso": "YYYY-MM-DD", "relative": "original text"}
- PRICE: {"amount": number, "currency": "USD|EUR|INR"}
- POLICY_RULE: {"rule": "text of the rule"}
- DEFINITION: {"term": "word", "definition": "meaning"}
- PERSON: {"name": "full name", "role": "role if mentioned"}
- PRODUCT: {"name": "product name", "identifier": "code/SKU if present"}

Document chunk:
"""
${chunkText}
"""`;

	try {
		const result = await mistral.chat.complete({
			model: 'mistral-small-latest',
			temperature: 0,
			maxTokens: 1200,
			responseFormat: { type: 'json_object' },
			messages: [
				{ role: 'system', content: systemPrompt },
				{ role: 'user', content: userPrompt },
			],
		});

		const rawContent = result.choices?.[0]?.message?.content;
		const text = messageContentToText(rawContent);
		if (!text) return [];

		const parsed = JSON.parse(text) as { entities?: unknown[] };
		const entities = Array.isArray(parsed.entities)
			? parsed.entities.map(coerceEntity).filter((entity): entity is Entity => entity !== null)
			: [];

		const filtered = filterEntitiesAdaptively(entities);
		if (filtered.length > 0) {
			return filtered;
		}

		return extractFallbackEntities(chunkText);
	} catch (err) {
		console.error('[Entity Extraction] Failed:', err instanceof Error ? err.message : err);
		// Extraction failures should not stop ingestion.
		return extractFallbackEntities(chunkText);
	}
}

