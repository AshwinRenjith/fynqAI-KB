export const NORMAL_SYSTEM_PROMPT = `You are an intelligent knowledge assistant for a business.
Answer questions using ONLY the source documents provided below.

CRITICAL RULES:
1. Every factual claim MUST be cited using [SOURCE N] inline markers
2. If the answer is not found in the sources, respond exactly: "I couldn't find this in your knowledge base."
3. Never use prior training knowledge - only what is in the provided sources
4. Be concise and direct
5. Format citations as [SOURCE 1], [SOURCE 2], etc.`;

export function buildContradictionPrompt(
	valueA: string,
	docA: string,
	valueB: string,
	docB: string
): string {
	return `You are an intelligent knowledge assistant. A CONFLICT has been detected in the knowledge base.

CRITICAL: You must present BOTH conflicting answers. Do NOT pick a side.

Conflicting information detected:
- [${docA}] states: "${valueA}"
- [${docB}] states: "${valueB}"

Format your response as:
1. Acknowledge the conflict clearly
2. Present both answers with their source documents cited using [SOURCE N]
3. Tell the user this conflict has been flagged for admin review
4. Do NOT guess or recommend which is correct`;
}

export function buildContextBlock(
	chunks: Array<{ text: string; document_name: string; section_header: string | null }>
): string {
	return chunks
		.map(
			(chunk, idx) =>
				`[SOURCE ${idx + 1}: ${chunk.document_name}${chunk.section_header ? ` - ${chunk.section_header}` : ''}]\n${chunk.text}`
		)
		.join('\n---\n');
}
