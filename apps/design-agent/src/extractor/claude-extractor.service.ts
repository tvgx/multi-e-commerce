import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';
import {
  PageTypeEnum,
  ShopPageLayout,
  ShopPageLayoutSchema,
} from '@ecommerce/schema';
import { ReducedNode } from './node-tree-reducer';

const MODEL = 'claude-sonnet-4-6';
const MAX_RETRIES = 2; // up to 2 retries after the initial attempt
const LOG_DIR = path.resolve(__dirname, '../../logs');

export interface ExtractPageOptions {
  /** Allowlist of valid registry component ids, injected into the prompt. */
  validComponentIds: string[];
  /** Optional rendered-frame image URL for visual grounding (`--with-images`). */
  imageUrl?: string | null;
}

/**
 * Sends a reduced Figma frame to Claude and asks it to produce a
 * storefront-renderable {@link ShopPageLayout}. The result is validated with
 * the Zod schema; on a parse/validation failure we retry (feeding the error
 * back) up to {@link MAX_RETRIES} times, then dump the raw response to
 * `logs/` and throw.
 *
 * We do NOT use structured outputs (`output_config.format`) here: the layout's
 * `UIComponentRef` is recursive (`blocks[]`), and constrained decoding rejects
 * recursive JSON schemas. Prompt + `schema.parse()` + retry is the supported
 * path for this shape.
 */
@Injectable()
export class ClaudeExtractorService {
  private readonly logger = new Logger(ClaudeExtractorService.name);
  private _client?: Anthropic;

  /** Lazily constructed so DI/bootstrap doesn't require ANTHROPIC_API_KEY. */
  private get client(): Anthropic {
    if (!this._client) {
      this._client = new Anthropic(); // reads ANTHROPIC_API_KEY
    }
    return this._client;
  }

  async extractPage(
    frame: ReducedNode,
    opts: ExtractPageOptions,
  ): Promise<ShopPageLayout> {
    const system = this.buildSystemPrompt(opts.validComponentIds);

    const userContent: Anthropic.ContentBlockParam[] = [];
    if (opts.imageUrl) {
      userContent.push({
        type: 'image',
        source: { type: 'url', url: opts.imageUrl },
      });
    }
    userContent.push({
      type: 'text',
      text:
        `Figma frame "${frame.name}" (id ${frame.id}). Reduced node tree:\n\n` +
        '```json\n' +
        JSON.stringify(frame, null, 2) +
        '\n```\n\nReturn ONLY the page layout JSON.',
    });

    const messages: Anthropic.MessageParam[] = [
      { role: 'user', content: userContent },
    ];

    let lastError: unknown;
    let lastRaw = '';

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const raw = await this.callModel(system, messages);
      lastRaw = raw;

      try {
        const json = JSON.parse(stripCodeFences(raw));
        return ShopPageLayoutSchema.parse(json);
      } catch (err) {
        lastError = err;
        this.logger.warn(
          `Extraction parse failed for "${frame.name}" (attempt ${attempt + 1}/${MAX_RETRIES + 1}): ${errMessage(err)}`,
        );
        // Feed the error back as a correction turn for the next attempt.
        messages.push({ role: 'assistant', content: raw });
        messages.push({
          role: 'user',
          content:
            `That response did not validate against the schema. Error:\n${errMessage(err)}\n\n` +
            'Return ONLY corrected JSON matching the required shape — no prose, no code fences.',
        });
      }
    }

    const logPath = this.dumpRaw(frame.id, lastRaw);
    throw new Error(
      `Failed to extract a valid layout for frame "${frame.name}" (${frame.id}) after ${MAX_RETRIES + 1} attempts. ` +
        `Last error: ${errMessage(lastError)}. Raw response logged to ${logPath}`,
    );
  }

  private async callModel(
    system: string,
    messages: Anthropic.MessageParam[],
  ): Promise<string> {
    // `thinking: adaptive` and `output_config.effort` are newer than the
    // installed SDK's static types but are accepted by the API at runtime (the
    // SDK serialises extra params straight into the request body). Cast through
    // `unknown` so the compiler accepts them without dropping them.
    const body = {
      model: MODEL,
      max_tokens: 16000,
      system,
      thinking: { type: 'adaptive' },
      output_config: { effort: 'high' },
      messages,
    };
    const response = await this.client.messages.create(
      body as unknown as Anthropic.MessageCreateParamsNonStreaming,
    );

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();
  }

  private buildSystemPrompt(validComponentIds: string[]): string {
    const pageTypes = PageTypeEnum.options.join(', ');
    return [
      'You convert a single Figma frame into a storefront page layout.',
      '',
      'Output a JSON object with this exact shape:',
      '{ "pageType": <one of the page types>, "slug"?: string, "components": UIComponentRef[] }',
      '',
      'A UIComponentRef is:',
      '{ "id": string (unique), "componentId": string, "type"?: "section"|"block", ' +
        '"props"?: object, "order"?: number, "blocks"?: UIComponentRef[], ' +
        '"dataSource"?: { "type"?: "collection"|"products"|"static", "id"?: string } }',
      '',
      `Valid "pageType" values: ${pageTypes}.`,
      '',
      'Each top-level component is a section; nested layers become its "blocks".',
      'The "componentId" MUST be chosen from this registry list (closest match):',
      validComponentIds.join(', '),
      '',
      'Rules:',
      '- Map each meaningful Figma layer/group to one component; ignore purely decorative wrappers.',
      '- Preserve top-to-bottom visual order via the "order" field (0-based).',
      '- If unsure which registry component fits, pick the closest and still use a valid id.',
      '- Respond with ONLY the JSON object. No prose, no markdown code fences.',
    ].join('\n');
  }

  private dumpRaw(nodeId: string, raw: string): string {
    try {
      fs.mkdirSync(LOG_DIR, { recursive: true });
      const safeId = nodeId.replace(/[^a-zA-Z0-9_-]/g, '_');
      const file = path.join(LOG_DIR, `${safeId}-${Date.now()}.json`);
      fs.writeFileSync(file, raw, 'utf8');
      return file;
    } catch (err) {
      this.logger.error(`Could not write raw log: ${errMessage(err)}`);
      return '<log write failed>';
    }
  }
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return (fenced ? fenced[1] : text).trim();
}

function errMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
