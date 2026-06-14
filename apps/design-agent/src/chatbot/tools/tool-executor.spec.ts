import { Model } from 'mongoose';
import { PageLayoutDocument } from '../../extractor/schemas/page-layout.schema';
import { ComponentRegistryReader } from './component-registry.reader';
import { MasterTemplateReader } from './master-template.reader';
import { ToolExecutorService } from './tool-executor.service';

describe('ToolExecutorService — tenant isolation', () => {
  // A model that fails the test if any data query is attempted.
  const guardModel = {
    findOne: () => {
      throw new Error('DB should not be queried on a blocked cross-tenant call');
    },
    find: () => {
      throw new Error('DB should not be queried on a blocked cross-tenant call');
    },
  } as unknown as Model<PageLayoutDocument>;

  const registry = {
    getInfo: (name: string) => ({ query: name, exists: true, componentId: name }),
  } as unknown as ComponentRegistryReader;
  const templates = {
    get: () => null,
    getAvailableIndustries: () => ['standard'],
  } as unknown as MasterTemplateReader;

  const executor = new ToolExecutorService(guardModel, registry, templates);

  it('blocks a tool call whose tenant_id differs from the session tenant', async () => {
    const res = (await executor.execute(
      'get_page_layout',
      { tenant_id: 'other_shop', page_path: 'home' },
      { tenantId: 'shop_1' },
    )) as { error?: string };
    expect(res.error).toBe('tenant_isolation_violation');
  });

  it('does not block when the model omits tenant_id (executor scopes it)', async () => {
    // findOne throws here only because the guard model is a stub — proves we got
    // past the isolation check and into the (stubbed) data path.
    await expect(
      executor.execute(
        'get_page_layout',
        { page_path: 'home' },
        { tenantId: 'shop_1' },
      ),
    ).rejects.toThrow('DB should not be queried');
  });

  it('allows a matching tenant_id through to the data path', async () => {
    await expect(
      executor.execute(
        'search_pages',
        { tenant_id: 'shop_1', keyword: 'home' },
        { tenantId: 'shop_1' },
      ),
    ).rejects.toThrow('DB should not be queried');
  });

  it('routes registry lookups without touching the DB', async () => {
    const res = (await executor.execute(
      'get_component_registry_info',
      { component_name: 'Hero' },
      { tenantId: 'shop_1' },
    )) as { componentId?: string };
    expect(res.componentId).toBe('Hero');
  });

  it('returns an error for an unknown tool', async () => {
    const res = (await executor.execute(
      'nope',
      {},
      { tenantId: 'shop_1' },
    )) as { error?: string };
    expect(res.error).toBe('unknown_tool');
  });
});
