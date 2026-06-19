import { EmbeddingService } from './embedding.service';
import { EmbeddingIndexRepository, StoredEmbedding } from './embedding-index.repository';
import { RagRetrievalService } from './rag-retrieval.service';

/**
 * The RAG path is a second tenant boundary alongside the tool executor. These
 * tests pin the scope that gets forwarded to the repo: a `null` tenant must NOT
 * be widened into "all tenants", or a null-tenant chat would retrieve other
 * tenants' layout sections.
 */
describe('RagRetrievalService — tenant scoping', () => {
  function makeService(candidates: StoredEmbedding[]) {
    const findForRetrieval = jest.fn().mockResolvedValue(candidates);
    const repo = { findForRetrieval } as unknown as EmbeddingIndexRepository;
    const embedder = {
      embed: jest.fn().mockResolvedValue([[1, 0, 0]]),
    } as unknown as EmbeddingService;
    const service = new RagRetrievalService(embedder, repo);
    return { service, findForRetrieval };
  }

  const chunk = (over: Partial<StoredEmbedding>): StoredEmbedding => ({
    chunk_id: 'c1',
    page_id: 'p1',
    section_id: 's1',
    tenant_id: null,
    figma_node_id: 'n1',
    page_name: 'Home',
    section_name: 'Hero',
    section_type: 'Hero',
    page_type: 'home',
    order: 0,
    content: 'hero',
    content_hash: 'h',
    embedding: [1, 0, 0],
    embedding_model: 'voyage-3',
    ...over,
  });

  it('forwards a literal null tenant as null (NOT undefined/all tenants)', async () => {
    const { service, findForRetrieval } = makeService([chunk({})]);

    await service.retrieveContext('hero', { tenant_id: null });

    expect(findForRetrieval).toHaveBeenCalledWith(null);
  });

  it('forwards an explicit tenant id unchanged', async () => {
    const { service, findForRetrieval } = makeService([chunk({ tenant_id: 'shop_1' })]);

    await service.retrieveContext('hero', { tenant_id: 'shop_1' });

    expect(findForRetrieval).toHaveBeenCalledWith('shop_1');
  });

  it('forwards undefined (admin/CLI all-tenant search) unchanged', async () => {
    const { service, findForRetrieval } = makeService([chunk({})]);

    await service.retrieveContext('hero', {});

    expect(findForRetrieval).toHaveBeenCalledWith(undefined);
  });

  it('returns the top-k ranked by cosine similarity', async () => {
    const { service } = makeService([
      chunk({ chunk_id: 'far', section_id: 'far', embedding: [0, 1, 0] }),
      chunk({ chunk_id: 'near', section_id: 'near', embedding: [1, 0, 0] }),
    ]);

    const hits = await service.retrieveContext('hero', { tenant_id: null, k: 1 });

    expect(hits).toHaveLength(1);
    expect(hits[0].chunk_id).toBe('near');
  });
});
