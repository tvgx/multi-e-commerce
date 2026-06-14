import { Injectable, Logger } from '@nestjs/common';

export interface MasterTemplateSummary {
  industry: string;
  templateType: string;
  globalComponents: { id: string; componentId: string }[];
  pages: { pageType?: string; slug?: string; sections: string[] }[];
  /** The full blueprint, for deep comparison against a tenant's layout. */
  raw: unknown;
}

/**
 * Loads the industry blueprints from `@ecommerce/master-templates` so the
 * chatbot can compare a "standard" template against a tenant's actual layout.
 * The package is plain data (no React), so it is safe to `require` directly.
 */
@Injectable()
export class MasterTemplateReader {
  private readonly logger = new Logger(MasterTemplateReader.name);

  /** Industry keyword → exported template name. */
  private static readonly INDUSTRY_MAP: Record<string, string> = {
    standard: 'StandardTemplate',
    general: 'StandardTemplate',
    retail: 'StandardTemplate',
    ecommerce: 'StandardTemplate',
    visual: 'VisualTemplate',
    fashion: 'VisualTemplate',
    beauty: 'VisualTemplate',
    lifestyle: 'VisualTemplate',
    technical: 'TechnicalTemplate',
    tech: 'TechnicalTemplate',
    electronics: 'TechnicalTemplate',
    hardware: 'TechnicalTemplate',
    service: 'ServiceTemplate',
    services: 'ServiceTemplate',
    saas: 'ServiceTemplate',
    agency: 'ServiceTemplate',
  };

  private templates: Record<string, unknown> | null = null;

  getAvailableIndustries(): string[] {
    return Object.keys(MasterTemplateReader.INDUSTRY_MAP);
  }

  get(industry: string): MasterTemplateSummary | null {
    const key = industry.trim().toLowerCase();
    const exportName =
      MasterTemplateReader.INDUSTRY_MAP[key] ??
      // also accept the exact export name or templateType
      Object.values(MasterTemplateReader.INDUSTRY_MAP).find(
        (n) => n.toLowerCase() === `${key}template`,
      );
    if (!exportName) return null;

    const all = this.load();
    const blueprint = all?.[exportName];
    if (!blueprint) return null;

    return this.summarize(industry, blueprint);
  }

  private load(): Record<string, unknown> | null {
    if (this.templates) return this.templates;
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      this.templates = require('@ecommerce/master-templates') as Record<
        string,
        unknown
      >;
    } catch (err) {
      this.logger.warn(
        `Could not load @ecommerce/master-templates (build it first): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      this.templates = null;
    }
    return this.templates;
  }

  private summarize(industry: string, blueprint: unknown): MasterTemplateSummary {
    const bp = (blueprint ?? {}) as Record<string, unknown>;
    const globals = Array.isArray(bp.globalComponents)
      ? (bp.globalComponents as Record<string, unknown>[]).map((g) => ({
          id: String(g.id ?? ''),
          componentId: String(g.componentId ?? ''),
        }))
      : [];
    const pages = Array.isArray(bp.pages)
      ? (bp.pages as Record<string, unknown>[]).map((p) => ({
          pageType: p.pageType ? String(p.pageType) : undefined,
          slug: p.slug ? String(p.slug) : undefined,
          sections: Array.isArray(p.components)
            ? (p.components as Record<string, unknown>[]).map((c) =>
                String(c.componentId ?? c.id ?? ''),
              )
            : [],
        }))
      : [];
    return {
      industry,
      templateType: String(bp.templateType ?? 'unknown'),
      globalComponents: globals,
      pages,
      raw: blueprint,
    };
  }
}
