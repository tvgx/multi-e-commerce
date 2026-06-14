/**
 * Cosine similarity over plain number vectors. We compute relevance in the app
 * layer because the dev/prod MongoDB is self-hosted (mongo:6, no Atlas Vector
 * Search). For the small per-tenant layout corpus this is exact and cheap; if
 * the corpus grows, swap this for Atlas Vector Search or a dedicated vector DB
 * (Qdrant/pgvector) behind the same {@link RagRetrievalService} interface.
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `Vector length mismatch: ${a.length} vs ${b.length}. ` +
        'Re-embed with a single model so all vectors share a dimension.',
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}
