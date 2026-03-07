import { Mistral } from '@mistralai/mistralai';

const mistral = new Mistral({ apiKey: process.env.MISTRAL_API_KEY! });

export async function embedChunks(texts: string[]): Promise<number[][]> {
	const BATCH_SIZE = 20;
	const allEmbeddings: number[][] = [];

	for (let i = 0; i < texts.length; i += BATCH_SIZE) {
		const batch = texts.slice(i, i + BATCH_SIZE);
		const response = await mistral.embeddings.create({
			model: 'mistral-embed',
			inputs: batch,
		});

		const vectors = response.data
			.map((item) => item.embedding)
			.filter((embedding): embedding is number[] => Array.isArray(embedding));

		allEmbeddings.push(...vectors);
	}

	return allEmbeddings;
}

export async function embedQuery(query: string): Promise<number[]> {
	const response = await mistral.embeddings.create({
		model: 'mistral-embed',
		inputs: [query],
	});

	const first = response.data[0]?.embedding;
	if (!Array.isArray(first)) {
		throw new Error('Embedding API returned an invalid response');
	}

	return first;
}

