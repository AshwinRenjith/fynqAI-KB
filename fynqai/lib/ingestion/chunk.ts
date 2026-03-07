export interface ChunkData {
	text: string;
	section_header: string | null;
	chunk_index: number;
	token_count: number;
}

const MIN_TOKENS = 150;
const MAX_TOKENS = 800;

function estimateTokens(text: string): number {
	return Math.ceil(text.length / 4);
}

type DraftChunk = Omit<ChunkData, 'chunk_index'>;

function splitLargeSection(section: string, sectionHeader: string | null): DraftChunk[] {
	const paragraphs = section.split(/\n\n+/);
	const chunks: DraftChunk[] = [];
	let current = '';

	for (const para of paragraphs) {
		const candidate = current ? `${current}\n\n${para}` : para;
		if (estimateTokens(candidate) > MAX_TOKENS && current) {
			chunks.push({
				text: current.trim(),
				section_header: sectionHeader,
				token_count: estimateTokens(current),
			});
			current = para;
		} else {
			current = candidate;
		}
	}

	if (current.trim()) {
		chunks.push({
			text: current.trim(),
			section_header: sectionHeader,
			token_count: estimateTokens(current),
		});
	}

	return chunks;
}

export function chunkMarkdown(markdown: string): ChunkData[] {
	const sections = markdown
		.split(/(?=^#{1,3} )/m)
		.map((s) => s.trim())
		.filter((s) => s.length > 0);

	const rawChunks: DraftChunk[] = [];

	for (const section of sections) {
		const headerMatch = section.match(/^(#{1,3}\s+.+)$/m);
		const sectionHeader = headerMatch?.[1]?.trim() ?? null;
		const tokens = estimateTokens(section);

		if (tokens < MIN_TOKENS && rawChunks.length > 0) {
			const prev = rawChunks[rawChunks.length - 1];
			prev.text = `${prev.text}\n\n${section}`;
			prev.token_count = estimateTokens(prev.text);
			continue;
		}

		if (tokens > MAX_TOKENS) {
			rawChunks.push(...splitLargeSection(section, sectionHeader));
			continue;
		}

		rawChunks.push({
			text: section,
			section_header: sectionHeader,
			token_count: tokens,
		});
	}

	return rawChunks.map((chunk, index) => ({
		...chunk,
		chunk_index: index,
	}));
}

