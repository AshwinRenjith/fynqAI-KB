import mammoth from 'mammoth';

type LlamaParseDocument = { text?: string };
type LlamaParseReaderInstance = {
	loadDataAsContent: (fileBuffer: Buffer, filename: string) => Promise<LlamaParseDocument[]>;
};
type LlamaParseReaderCtor = new (options: {
	apiKey: string;
	resultType: 'markdown';
}) => LlamaParseReaderInstance;

async function parsePdf(fileBuffer: Buffer, filename: string): Promise<string> {
	if (!process.env.LLAMA_CLOUD_API_KEY) {
		throw new Error('LLAMA_CLOUD_API_KEY is not configured');
	}

	const llamaParseModule = await import('llama-parse');
	const moduleRecord = llamaParseModule as unknown as Record<string, unknown>;
	const LlamaParseReader = (moduleRecord.default ?? llamaParseModule) as unknown as LlamaParseReaderCtor;

	const parser = new LlamaParseReader({
		apiKey: process.env.LLAMA_CLOUD_API_KEY,
		resultType: 'markdown',
	});

	const documents = await parser.loadDataAsContent(fileBuffer, filename);
	return documents.map((d) => d.text ?? '').join('\n\n').trim();
}

function htmlToMarkdown(html: string): string {
	return html
		.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
		.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
		.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
		.replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
		.replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
		.replace(/<em>(.*?)<\/em>/gi, '*$1*')
		.replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

export async function parseToMarkdown(
	fileBuffer: Buffer,
	fileType: string,
	filename: string
): Promise<string> {
	if (fileType === 'pdf') {
		return parsePdf(fileBuffer, filename);
	}

	if (fileType === 'docx') {
		const result = await mammoth.convertToHtml({ buffer: fileBuffer });
		return htmlToMarkdown(result.value);
	}

	if (fileType === 'txt' || fileType === 'md') {
		return fileBuffer.toString('utf-8');
	}

	throw new Error(`Unsupported file type: ${fileType}`);
}

