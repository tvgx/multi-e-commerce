import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/** Figma/blueprint naming → canonical registry id (mirrors the extractor's map). */
const ALIASES: Record<string, string> = {
  navbar: 'Header',
  nav: 'Header',
  banner: 'Hero',
  herobanner: 'Hero',
  footerbar: 'Footer',
};

export interface ComponentRegistryInfo {
  query: string;
  exists: boolean;
  /** Canonical registry id after case/alias resolution (null if unknown). */
  componentId: string | null;
  /** "section" | "block" | "page" | "other", inferred from the source path. */
  category: string | null;
  hasSchema: boolean;
  /** Top-level prop names parsed from the component's Zod schema, if found. */
  propFields: string[];
  note?: string;
}

/**
 * Cross-references a component name against the real `@ecommerce/ui-registry`.
 *
 * The registry's component map imports React/Next/CSS and cannot run in a Node
 * process, so (like the extractor's ComponentMapperService) we read
 * `registry.ts` and the referenced schema source files statically and parse
 * them, rather than importing. This lets the chatbot answer "how does component
 * X render / what props does it take" from ground truth instead of guessing.
 */
@Injectable()
export class ComponentRegistryReader implements OnModuleInit {
  private readonly logger = new Logger(ComponentRegistryReader.name);
  private registryDir: string | null = null;
  private registrySource = '';
  private validIds = new Set<string>();
  private schemaIds = new Set<string>();
  private lowerToCanonical = new Map<string, string>();
  /** componentId/schema-var → import source path (relative to registry dir). */
  private importSources = new Map<string, string>();

  onModuleInit(): void {
    const file = this.resolveRegistryFile();
    if (!file) {
      this.logger.warn(
        'Could not locate @ecommerce/ui-registry registry.ts; component lookups disabled.',
      );
      return;
    }
    this.registryDir = path.dirname(file);
    this.registrySource = fs.readFileSync(file, 'utf8');

    this.validIds = this.parseObjectKeys('registry');
    this.schemaIds = this.parseObjectKeys('schemaRegistry');
    for (const id of this.validIds) {
      this.lowerToCanonical.set(id.toLowerCase(), id);
    }
    this.parseImports();

    this.logger.log(
      `Component registry reader: ${this.validIds.size} components, ` +
        `${this.schemaIds.size} with schemas.`,
    );
  }

  getInfo(name: string): ComponentRegistryInfo {
    const componentId = this.resolve(name);
    if (!componentId) {
      return {
        query: name,
        exists: false,
        componentId: null,
        category: null,
        hasSchema: false,
        propFields: [],
        note: `"${name}" is not a registered UI component. Valid ids include: ${[
          ...this.validIds,
        ]
          .slice(0, 20)
          .join(', ')}...`,
      };
    }
    const source = this.findSchemaSource(componentId);
    return {
      query: name,
      exists: true,
      componentId,
      category: source ? categoryFromPath(source.relPath) : null,
      hasSchema: this.schemaIds.has(componentId),
      propFields: source ? source.fields : [],
      note: source
        ? undefined
        : 'Component exists in the registry but no Zod prop schema was found to introspect.',
    };
  }

  listComponentIds(): string[] {
    return [...this.validIds].sort();
  }

  private resolve(name: string): string | null {
    if (this.validIds.has(name)) return name;
    const lower = name.toLowerCase();
    return this.lowerToCanonical.get(lower) ?? ALIASES[lower] ?? null;
  }

  /** Find the schema source file for a component and parse its prop names. */
  private findSchemaSource(
    componentId: string,
  ): { relPath: string; fields: string[] } | null {
    if (!this.registryDir) return null;
    // The component and its `<name>Schema` are imported from the same module.
    const rel =
      this.importSources.get(componentId) ??
      this.importSources.get(`${lowerFirst(componentId)}Schema`);
    if (!rel) return null;

    const abs = this.resolveImport(rel);
    if (!abs) return { relPath: rel, fields: [] };
    try {
      const src = fs.readFileSync(abs, 'utf8');
      return { relPath: rel, fields: parseZodObjectKeys(src, componentId) };
    } catch {
      return { relPath: rel, fields: [] };
    }
  }

  private parseObjectKeys(varName: string): Set<string> {
    const ids = new Set<string>();
    const block = this.registrySource.match(
      new RegExp(`export const ${varName}[^=]*=\\s*{([\\s\\S]*?)};`),
    );
    if (!block) return ids;
    const keyRe = /^\s*([A-Za-z_$][\w$]*)\s*[:,]/gm;
    let m: RegExpExecArray | null;
    while ((m = keyRe.exec(block[1])) !== null) ids.add(m[1]);
    return ids;
  }

  /** Map every imported identifier to the module path it came from. */
  private parseImports(): void {
    const importRe = /import\s*{([^}]+)}\s*from\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = importRe.exec(this.registrySource)) !== null) {
      const names = m[1].split(',').map((s) => s.trim().split(/\s+as\s+/)[0]);
      for (const n of names) {
        if (n) this.importSources.set(n, m[2]);
      }
    }
  }

  private resolveImport(rel: string): string | null {
    if (!this.registryDir) return null;
    const base = path.resolve(this.registryDir, rel);
    for (const candidate of [
      base,
      `${base}.ts`,
      `${base}.tsx`,
      path.join(base, 'index.ts'),
      path.join(base, 'index.tsx'),
    ]) {
      if (fs.existsSync(candidate) && fs.statSync(candidate).isFile())
        return candidate;
    }
    return null;
  }

  private resolveRegistryFile(): string | null {
    try {
      return require.resolve('@ecommerce/ui-registry');
    } catch {
      let dir = __dirname;
      for (let i = 0; i < 8; i++) {
        const candidate = path.join(dir, 'packages/ui-registry/src/registry.ts');
        if (fs.existsSync(candidate)) return candidate;
        dir = path.dirname(dir);
      }
      return null;
    }
  }
}

function lowerFirst(s: string): string {
  return s.charAt(0).toLowerCase() + s.slice(1);
}

function categoryFromPath(rel: string): string {
  if (/\/blocks\//.test(rel)) return 'block';
  if (/\/pages\//.test(rel)) return 'page';
  if (/\/sections\//.test(rel)) return 'section';
  if (/\/cart\//.test(rel)) return 'cart';
  return 'other';
}

/**
 * Best-effort extraction of the top-level field names from a component's Zod
 * schema. Finds the first `z.object({ ... })` and pulls its first-level keys.
 */
function parseZodObjectKeys(src: string, componentId: string): string[] {
  // Prefer the schema declared near the component name, else the first object.
  const start = src.search(/z\s*\.\s*object\s*\(\s*{/);
  if (start === -1) return [];
  const braceStart = src.indexOf('{', start);
  let depth = 0;
  let end = braceStart;
  for (let i = braceStart; i < src.length; i++) {
    if (src[i] === '{') depth++;
    else if (src[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  const body = src.slice(braceStart + 1, end);
  const fields = new Set<string>();
  // Only first-level keys: track nesting so we skip keys inside nested objects.
  let nest = 0;
  for (const line of body.split('\n')) {
    const trimmed = line.trim();
    if (nest === 0) {
      const m = trimmed.match(/^([A-Za-z_$][\w$]*)\s*:/);
      if (m) fields.add(m[1]);
    }
    nest += (line.match(/{/g)?.length ?? 0) - (line.match(/}/g)?.length ?? 0);
    if (nest < 0) nest = 0;
  }
  void componentId;
  return [...fields];
}
