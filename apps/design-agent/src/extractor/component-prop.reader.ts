import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Reads the storefront editor's `component-schemas.ts` and extracts, per
 * componentId, the list of editable prop field ids the builder UI exposes
 * (`settings[].id`). The extractor injects this into the Claude prompt so the
 * model fills the *correct* prop keys for each section (e.g. `backgroundImageUrl`,
 * `title`, `columns`) instead of inventing names.
 *
 * Parsed statically from source (like ComponentMapperService) rather than
 * imported: it must work both under ts-node and from compiled `dist` where the
 * sibling package's `.ts` can't be `require`d. `component-schemas.ts` uses only
 * two shared spreads (`commonTextSettings`, `commonStyleSettings`), which we
 * resolve explicitly.
 */
@Injectable()
export class ComponentPropReader implements OnModuleInit {
  private readonly logger = new Logger(ComponentPropReader.name);
  private propsById = new Map<string, string[]>();

  onModuleInit(): void {
    const file = this.resolveSchemaFile();
    if (!file) {
      this.logger.warn(
        'Could not locate ui-registry component-schemas.ts; prop hints disabled.',
      );
      return;
    }
    try {
      this.parse(fs.readFileSync(file, 'utf8'));
      this.logger.log(
        `Loaded prop schemas for ${this.propsById.size} components.`,
      );
    } catch (err) {
      this.logger.warn(
        `Failed to parse component-schemas.ts: ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }

  /** Prop field ids for a component, or `[]` if unknown. */
  getProps(componentId: string): string[] {
    return this.propsById.get(componentId) ?? [];
  }

  /**
   * One compact line per component: `ComponentId: prop1, prop2, …`. Empty when
   * nothing parsed (extractor then falls back to a generic prop hint).
   */
  describeAll(componentIds?: string[]): string {
    const ids = (componentIds ?? [...this.propsById.keys()]).sort();
    const lines: string[] = [];
    for (const id of ids) {
      const props = this.propsById.get(id);
      if (props && props.length) lines.push(`${id}: ${props.join(', ')}`);
    }
    return lines.join('\n');
  }

  private parse(src: string): void {
    const commonText = this.parseInlineIds(this.sliceArray(src, 'commonTextSettings'));
    const commonStyle = this.parseInlineIds(
      this.sliceArray(src, 'commonStyleSettings'),
    );
    const spreadMap: Record<string, string[]> = {
      commonTextSettings: commonText,
      commonStyleSettings: commonStyle,
    };

    const blockRe = /export const \w+Schema\s*:\s*ComponentSchema\s*=\s*{/g;
    let m: RegExpExecArray | null;
    while ((m = blockRe.exec(src)) !== null) {
      const block = sliceBraces(src, m.index + m[0].length - 1);
      if (!block) continue;

      const idMatch = block.match(/\bid\s*:\s*['"]([^'"]+)['"]/);
      if (!idMatch) continue;
      const componentId = idMatch[1];

      const settings = this.sliceSettings(block);
      const fields = new Set<string>(this.parseInlineIds(settings));
      for (const [name, ids] of Object.entries(spreadMap)) {
        if (settings.includes(`...${name}`)) ids.forEach((f) => fields.add(f));
      }
      // The component's own `id` is the first `id:` in the block; drop it.
      fields.delete(componentId);
      this.propsById.set(componentId, [...fields]);
    }
  }

  /** Inline `id: '...'` field ids within an arbitrary source slice. */
  private parseInlineIds(slice: string): string[] {
    const ids: string[] = [];
    const re = /\bid\s*:\s*['"]([^'"]+)['"]/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(slice)) !== null) ids.push(m[1]);
    return ids;
  }

  /** Body of a `const <name>: FieldSchema[] = [ ... ];` declaration. */
  private sliceArray(src: string, name: string): string {
    // The type annotation `: FieldSchema[]` also contains brackets, so anchor on
    // the assignment `=` and take the first `[` after it (the array opener).
    const decl = new RegExp(`const ${name}\\b[^=]*=\\s*\\[`);
    const m = decl.exec(src);
    if (!m) return '';
    const open = src.indexOf('[', m.index + m[0].length - 1);
    return sliceBrackets(src, open) ?? '';
  }

  /** The `settings: [ ... ]` array body inside a schema block. */
  private sliceSettings(block: string): string {
    const start = block.search(/\bsettings\s*:\s*\[/);
    if (start === -1) return '';
    const open = block.indexOf('[', start);
    return sliceBrackets(block, open) ?? '';
  }

  private resolveSchemaFile(): string | null {
    try {
      const main = require.resolve('@ecommerce/ui-registry');
      const candidate = path.join(path.dirname(main), 'component-schemas.ts');
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      // fall through to directory walk
    }
    let dir = __dirname;
    for (let i = 0; i < 8; i++) {
      const candidate = path.join(
        dir,
        'packages/ui-registry/src/component-schemas.ts',
      );
      if (fs.existsSync(candidate)) return candidate;
      dir = path.dirname(dir);
    }
    return null;
  }
}

/** Capture a balanced `{ … }` slice starting at the index of the opening brace. */
function sliceBraces(src: string, openIdx: number): string | null {
  return sliceBalanced(src, openIdx, '{', '}');
}

/** Capture a balanced `[ … ]` slice starting at the index of the opening bracket. */
function sliceBrackets(src: string, openIdx: number): string | null {
  return sliceBalanced(src, openIdx, '[', ']');
}

function sliceBalanced(
  src: string,
  openIdx: number,
  open: string,
  close: string,
): string | null {
  if (src[openIdx] !== open) return null;
  let depth = 0;
  for (let i = openIdx; i < src.length; i++) {
    if (src[i] === open) depth++;
    else if (src[i] === close) {
      depth--;
      if (depth === 0) return src.slice(openIdx + 1, i);
    }
  }
  return null;
}
