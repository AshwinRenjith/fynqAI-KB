import { embedChunks } from '@/lib/ai/embed';
import { extractEntities } from '@/lib/ai/extract';
import { runContradictionScan } from '@/lib/contradiction/agent';
import { createAdminClient } from '@/lib/supabase/server';
import type { Json } from '@/types/database.types';
import type { DocumentStatus } from '@/types/app.types';

import { chunkMarkdown } from './chunk';
import { parseToMarkdown } from './parse';

type StatusUpdater = (status: DocumentStatus, errorMessage?: string) => Promise<void>;

export async function runIngestionPipeline(
	documentId: string,
	workspaceId: string,
	fileBuffer: Buffer,
	fileType: string,
	filename: string
): Promise<void> {
	const supabase = createAdminClient();

	const updateStatus: StatusUpdater = async (status, errorMessage) => {
		await supabase
			.from('documents')
			.update({
				status,
				error_message: errorMessage ?? null,
				updated_at: new Date().toISOString(),
			})
			.eq('id', documentId);
	};

	// Retries must be idempotent: clear any previous partial chunks before re-processing.
	await supabase.from('chunks').delete().eq('document_id', documentId);

	let markdown: string;
	try {
		await updateStatus('chunking');
		markdown = await parseToMarkdown(fileBuffer, fileType, filename);
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Parsing failed';
		await updateStatus('error', `Parsing failed: ${message}`);
		return;
	}

	const mdPath = `${workspaceId}/${documentId}.md`;
	const { error: markdownUploadError } = await supabase.storage
		.from('parsed-documents')
		.upload(mdPath, markdown, {
			contentType: 'text/markdown',
			upsert: true,
		});

	if (markdownUploadError) {
		await updateStatus('error', 'Failed to save parsed markdown. Please retry.');
		return;
	}

	await supabase.from('documents').update({ markdown_storage_path: mdPath }).eq('id', documentId);

	const chunks = chunkMarkdown(markdown);
	await updateStatus('embedding');

	let embeddings: number[][];
	try {
		embeddings = await embedChunks(chunks.map((chunk) => chunk.text));
	} catch {
		await updateStatus('error', 'Embedding service unavailable. Please retry in a moment.');
		return;
	}

	const chunkRows = chunks.map((chunk, index) => ({
		document_id: documentId,
		workspace_id: workspaceId,
		text: chunk.text,
		embedding: embeddings[index] as unknown as string,
		chunk_index: chunk.chunk_index,
		section_header: chunk.section_header,
		token_count: chunk.token_count,
		entities: [],
	}));

	const { data: insertedChunks, error: chunkInsertError } = await supabase
		.from('chunks')
		.insert(chunkRows)
		.select('id');

	if (chunkInsertError || !insertedChunks) {
		await updateStatus('error', 'Failed to store document chunks. Please retry.');
		return;
	}

	await supabase.from('documents').update({ chunk_count: chunks.length }).eq('id', documentId);

	await updateStatus('extracting');

	for (let index = 0; index < insertedChunks.length; index += 1) {
		try {
			const entities = await extractEntities(chunks[index].text);
			console.log(`[Pipeline] Chunk ${index}: extracted ${entities.length} entities`);
			await supabase
				.from('chunks')
				.update({ entities: entities as unknown as Json })
				.eq('id', insertedChunks[index].id);
		} catch {
			// Non-fatal extraction failure on individual chunk.
		}
	}

	await updateStatus('scanning');

	try {
		await runContradictionScan(
			documentId,
			workspaceId,
			insertedChunks.map((chunk) => chunk.id)
		);
	} catch {
		// Non-fatal. Keep pipeline completion behavior.
	}

	await updateStatus('ready');
}

