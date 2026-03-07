import { Mistral } from '@mistralai/mistralai';

import type { SearchResult } from '@/lib/search/hybrid';
import type { Citation } from '@/types/app.types';

import { buildContextBlock, buildContradictionPrompt, NORMAL_SYSTEM_PROMPT } from './prompts';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

interface ContradictionPromptData {
	valueA: string;
	docA: string;
	valueB: string;
	docB: string;
}

export async function* streamChatAnswer(
	query: string,
	chunks: SearchResult[],
	hasContradiction: boolean,
	contradictionData?: ContradictionPromptData
): AsyncGenerator<string> {
	const contextBlock = buildContextBlock(chunks);
	const systemPrompt = hasContradiction && contradictionData
		? buildContradictionPrompt(
				contradictionData.valueA,
				contradictionData.docA,
				contradictionData.valueB,
				contradictionData.docB
			)
		: NORMAL_SYSTEM_PROMPT;

	const fullPrompt = `SOURCE DOCUMENTS:\n${contextBlock}\n\nUser question: ${query}`;

	const stream = await mistral.chat.stream({
		model: 'mistral-small-latest',
		temperature: hasContradiction ? 0 : 0.2,
		messages: [
			{ role: 'system', content: systemPrompt },
			{ role: 'user', content: fullPrompt },
		],
	});

	for await (const event of stream) {
		const deltaContent = event.data.choices?.[0]?.delta?.content;
		if (typeof deltaContent === 'string' && deltaContent.length > 0) {
			yield deltaContent;
		}
	}
}

export function parseCitations(responseText: string, chunks: SearchResult[]): Citation[] {
	const citationPattern = /\[SOURCE\s+(\d+)\]|\[(\d+)\]|\bSOURCE\s+(\d+)\b|\bREF\s+(\d+)\b/gi;
	const usedIndices = new Set<number>();

	let match: RegExpExecArray | null;
	while ((match = citationPattern.exec(responseText)) !== null) {
		const raw = match[1] ?? match[2] ?? match[3] ?? match[4];
		const idx = Number(raw) - 1;
		if (idx >= 0 && idx < chunks.length) {
			usedIndices.add(idx);
		}
	}

	return Array.from(usedIndices).map((idx) => ({
		index: idx + 1,
		chunk_id: chunks[idx].id,
		document_id: chunks[idx].document_id,
		document_name: chunks[idx].document_name,
		section_header: chunks[idx].section_header,
		excerpt: chunks[idx].text,
		storage_url: null,
	}));
}
