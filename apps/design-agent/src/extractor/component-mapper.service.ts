import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ShopPageLayout, UIComponentRef } from '@ecommerce/schema';

/**
 * Known Figma/blueprint → registry component-id aliases. Extend as real Figma
 * naming conventions surface during review. Keys are lower-cased.
 */
const ALIASES: Record<string, string> = {
  navbar: 'Header', // master-templates blueprints use "navbar"
  nav: 'Header',
  banner: 'Hero',
  herobanner: 'Hero',
  footerbar: 'Footer',
};

/**
 * Validates extracted `componentId`s against the real UI registry and the
 * master-template blueprints. The registry's component map (registry.ts) pulls
 * in React/Next/CSS, which cannot be imported into a Node process — so we read
 * the registry source file and parse the object keys statically instead of
 * importing it. This mirrors api-core, which keeps its own allowlist rather
 * than depending on @ecommerce/ui-registry server-side.
 */
@Injectable()
export class ComponentMapperService implements OnModuleInit {
  private readonly logger = new Logger(ComponentMapperService.name);
  private validIds = new Set<string>();
  private lowerToCanonical = new Map<string, string>();

  onModuleInit(): void {
    const fromRegistry = this.loadRegistryComponentIds();
    const fromTemplates = this.loadMasterTemplateComponentIds();

    this.validIds = new Set(fromRegistry);
    for (const id of this.validIds) {
      this.lowerToCanonical.set(id.toLowerCase(), id);
    }

    this.logger.log(
      `Loaded ${this.validIds.size} registry component ids; ` +
        `${fromTemplates.size} ids referenced by master templates.`,
    );

    // Surface blueprint ids that aren't in the registry — useful review signal.
    for (const id of fromTemplates) {
      if (!this.validIds.has(id) && !ALIASES[id.toLowerCase()]) {
        this.logger.warn(
          `master-templates references "${id}" which is not in the UI registry.`,
        );
      }
    }
  }

  getValidComponentIds(): string[] {
    return [...this.validIds].sort();
  }

  /**
   * Walk a page's component tree and reconcile every `componentId` against the
   * registry. Exact matches pass through; case-only or alias matches are
   * remapped (with an info log); unknowns are kept as-is with a warning for
   * manual review.
   */
  mapPage(page: ShopPageLayout): ShopPageLayout {
    const mapComponent = (c: UIComponentRef): UIComponentRef => {
      const resolved = this.resolveId(c.componentId);
      const blocks = c.blocks?.map(mapComponent);
      return blocks ? { ...c, componentId: resolved, blocks } : { ...c, componentId: resolved };
    };

    return { ...page, components: page.components.map(mapComponent) };
  }

  private resolveId(componentId: string): string {
    if (this.validIds.has(componentId)) return componentId;

    const lower = componentId.toLowerCase();

    const caseMatch = this.lowerToCanonical.get(lower);
    if (caseMatch) {
      this.logger.log(`Remapped "${componentId}" -> "${caseMatch}" (case).`);
      return caseMatch;
    }

    const alias = ALIASES[lower];
    if (alias) {
      this.logger.log(`Remapped "${componentId}" -> "${alias}" (alias).`);
      return alias;
    }

    this.logger.warn(
      `Unknown componentId "${componentId}" — not in registry. Review manually.`,
    );
    return componentId;
  }

  /** Read registry.ts and parse keys from `registry` and `schemaRegistry`. */
  private loadRegistryComponentIds(): Set<string> {
    const ids = new Set<string>();
    const file = this.resolveRegistryFile();
    if (!file) {
      this.logger.warn(
        'Could not locate @ecommerce/ui-registry registry.ts; component validation disabled.',
      );
      return ids;
    }

    const src = fs.readFileSync(file, 'utf8');
    for (const name of ['registry', 'schemaRegistry']) {
      const block = src.match(
        new RegExp(`export const ${name}[^=]*=\\s*{([\\s\\S]*?)};`),
      );
      if (!block) continue;
      const keyRe = /^\s*([A-Za-z_$][\w$]*)\s*[:,]/gm;
      let m: RegExpExecArray | null;
      while ((m = keyRe.exec(block[1])) !== null) {
        ids.add(m[1]);
      }
    }
    return ids;
  }

  private resolveRegistryFile(): string | null {
    // Primary: resolve the package main (src/registry.ts) without executing it.
    try {
      return require.resolve('@ecommerce/ui-registry');
    } catch {
      // Fallback: walk up looking for the monorepo path.
      let dir = __dirname;
      for (let i = 0; i < 8; i++) {
        const candidate = path.join(
          dir,
          'packages/ui-registry/src/registry.ts',
        );
        if (fs.existsSync(candidate)) return candidate;
        dir = path.dirname(dir);
      }
      return null;
    }
  }

  /** Best-effort: collect every `componentId` referenced by master templates. */
  private loadMasterTemplateComponentIds(): Set<string> {
    const ids = new Set<string>();
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const templates = require('@ecommerce/master-templates');
      for (const value of Object.values(templates)) {
        collectComponentIds(value, ids);
      }
    } catch (err) {
      this.logger.warn(
        `Could not load @ecommerce/master-templates (build it for cross-check): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
    return ids;
  }
}

/** Recursively collect string values of any `componentId` key in a blueprint. */
function collectComponentIds(node: unknown, acc: Set<string>): void {
  if (Array.isArray(node)) {
    for (const item of node) collectComponentIds(item, acc);
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    if (typeof obj.componentId === 'string') acc.add(obj.componentId);
    for (const value of Object.values(obj)) collectComponentIds(value, acc);
  }
}
