import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  PageLayout,
  PageLayoutDocument,
} from '../../extractor/schemas/page-layout.schema';
import { ComponentRegistryReader } from './component-registry.reader';
import { MasterTemplateReader } from './master-template.reader';

/** Authenticated scope for a chat turn. `tenantId` is the ONLY tenant the tools
 * may ever touch — it comes from the guarded request, not the model. */
export interface ToolContext {
  tenantId: string | null;
}

interface ComponentRef {
  id?: string;
  componentId?: string;
  type?: string;
  props?: Record<string, unknown>;
  blocks?: ComponentRef[];
  order?: number;
}

/**
 * Executes the chatbot's tool calls against MongoDB / the registry / the
 * master templates. Tenant isolation is enforced HERE, not in the prompt:
 * every data query is filtered by `ctx.tenantId`, and a `tenant_id` argument
 * supplied by the model that disagrees with the session tenant is rejected.
 */
@Injectable()
export class ToolExecutorService {
  private readonly logger = new Logger(ToolExecutorService.name);

  constructor(
    @InjectModel(PageLayout.name)
    private readonly pageModel: Model<PageLayoutDocument>,
    private readonly registry: ComponentRegistryReader,
    private readonly templates: MasterTemplateReader,
  ) {}

  async execute(
    name: string,
    input: Record<string, unknown>,
    ctx: ToolContext,
  ): Promise<unknown> {
    // Reject any cross-tenant attempt before touching data.
    const requested = input.tenant_id;
    if (
      typeof requested === 'string' &&
      requested.length > 0 &&
      requested !== ctx.tenantId
    ) {
      this.logger.warn(
        `Blocked cross-tenant tool call: ${name} asked for "${requested}" ` +
          `but session tenant is "${ctx.tenantId}".`,
      );
      return {
        error: 'tenant_isolation_violation',
        message:
          `Access denied: this session is scoped to tenant "${ctx.tenantId}". ` +
          `Cannot read data for tenant "${requested}".`,
      };
    }

    switch (name) {
      case 'get_page_layout':
        return this.getPageLayout(String(input.page_path ?? ''), ctx);
      case 'get_section_components':
        return this.getSectionComponents(
          String(input.page_path ?? ''),
          String(input.section_name ?? ''),
          ctx,
        );
      case 'search_pages':
        return this.searchPages(String(input.keyword ?? ''), ctx);
      case 'get_component_registry_info':
        return this.registry.getInfo(String(input.component_name ?? ''));
      case 'get_master_template':
        return (
          this.templates.get(String(input.industry ?? '')) ?? {
            error: 'unknown_industry',
            available: this.templates.getAvailableIndustries(),
          }
        );
      default:
        return { error: 'unknown_tool', name };
    }
  }

  private async findPage(
    pagePath: string,
    ctx: ToolContext,
  ): Promise<(PageLayout & { _id: unknown }) | null> {
    const path = pagePath.replace(/^\/+/, '').trim();
    const doc = await this.pageModel
      .findOne({
        tenant_id: ctx.tenantId,
        $or: [
          { 'page.slug': path },
          { 'page.slug': pagePath },
          { 'page.pageType': path },
          { name: new RegExp(`^${escapeRegex(path)}$`, 'i') },
        ],
      })
      .lean()
      .exec();
    return doc as unknown as (PageLayout & { _id: unknown }) | null;
  }

  private async getPageLayout(
    pagePath: string,
    ctx: ToolContext,
  ): Promise<unknown> {
    const doc = await this.findPage(pagePath, ctx);
    if (!doc) {
      return {
        found: false,
        message: `No page matching "${pagePath}" for tenant "${ctx.tenantId}".`,
      };
    }
    return {
      found: true,
      tenant_id: doc.tenant_id,
      figma_node_id: doc.figma_node_id,
      name: doc.name,
      page: doc.page,
    };
  }

  private async getSectionComponents(
    pagePath: string,
    sectionName: string,
    ctx: ToolContext,
  ): Promise<unknown> {
    const doc = await this.findPage(pagePath, ctx);
    if (!doc) {
      return { found: false, message: `No page matching "${pagePath}".` };
    }
    const components = (doc.page?.components ?? []) as ComponentRef[];
    const target = components.find(
      (c) => sectionLabel(c).toLowerCase() === sectionName.toLowerCase(),
    );
    if (!target) {
      return {
        found: false,
        message: `No section "${sectionName}" on page "${pagePath}".`,
        available_sections: components.map(sectionLabel),
      };
    }
    return {
      found: true,
      section: {
        id: target.id,
        componentId: target.componentId,
        label: sectionLabel(target),
        props: target.props ?? {},
      },
      components: (target.blocks ?? []).map((b) => ({
        id: b.id,
        componentId: b.componentId,
        type: b.type,
        label: sectionLabel(b),
      })),
    };
  }

  private async searchPages(
    keyword: string,
    ctx: ToolContext,
  ): Promise<unknown> {
    const re = new RegExp(escapeRegex(keyword), 'i');
    const docs = await this.pageModel
      .find({
        tenant_id: ctx.tenantId,
        $or: [{ name: re }, { 'page.slug': re }, { 'page.pageType': re }],
      })
      .limit(20)
      .lean()
      .exec();
    return {
      count: docs.length,
      pages: docs.map((d) => {
        const page = (d.page ?? {}) as { slug?: string; pageType?: string; components?: unknown[] };
        return {
          name: d.name,
          slug: page.slug,
          pageType: page.pageType,
          figma_node_id: d.figma_node_id,
          section_count: Array.isArray(page.components)
            ? page.components.length
            : 0,
        };
      }),
    };
  }
}

/** Same labelling rule the RAG chunker uses, kept in sync for consistency. */
function sectionLabel(c: ComponentRef): string {
  const props = c.props ?? {};
  for (const key of ['title', 'heading', 'label', 'name', 'text']) {
    const v = props[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return c.componentId ?? c.id ?? 'section';
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
