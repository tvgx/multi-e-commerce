import { Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { RagRetrievalService } from '../rag/rag-retrieval.service';
import { ConversationRepository } from './conversation.repository';
import { buildSystemPrompt } from './system-prompt';
import { TOOL_DEFINITIONS } from './tools/tool-definitions';
import { ToolContext, ToolExecutorService } from './tools/tool-executor.service';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 4096;
const MAX_TOOL_ITERATIONS = 6; // guards against tool-call loops
const RAG_TOP_K = 6;

export interface ChatRequest {
  message: string;
  conversationId: string;
  tenantId: string | null;
}

export interface ToolCallTrace {
  name: string;
  input: Record<string, unknown>;
}

export interface ChatResult {
  conversation_id: string;
  reply: string;
  tool_calls: ToolCallTrace[];
  retrieved_sections: { section_id: string; score: number }[];
}

/**
 * Orchestrates one chat turn:
 *   1. load recent history (tenant-scoped)
 *   2. RAG-retrieve relevant layout sections for this tenant
 *   3. build the system prompt (role + tenant rules + context + tools)
 *   4. run the Claude tool-use loop, executing tools on the backend
 *   5. persist the user message and the final assistant reply
 */
@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private _client?: Anthropic;

  constructor(
    private readonly rag: RagRetrievalService,
    private readonly conversations: ConversationRepository,
    private readonly executor: ToolExecutorService,
  ) {}

  private get client(): Anthropic {
    if (!this._client) this._client = new Anthropic(); // reads ANTHROPIC_API_KEY
    return this._client;
  }

  async chat(req: ChatRequest): Promise<ChatResult> {
    const ctx: ToolContext = { tenantId: req.tenantId };

    const history = await this.conversations.loadRecent(
      req.conversationId,
      req.tenantId,
    );

    // Pass the session tenant THROUGH verbatim — including a literal `null`.
    // `?? undefined` would collapse a null-tenant session into the repo's
    // "search across ALL tenants" scope, leaking other tenants' layout sections
    // into the prompt + the API response (the tool executor is scoped to `null`,
    // so the RAG path must match it, not widen it).
    const ragChunks = await this.rag.retrieveContext(req.message, {
      tenant_id: req.tenantId,
      k: RAG_TOP_K,
    });

    const system = buildSystemPrompt({
      tenantId: req.tenantId,
      ragChunks,
    });

    const messages: Anthropic.MessageParam[] = [
      ...history.map(
        (m): Anthropic.MessageParam => ({
          role: m.role,
          content: m.content,
        }),
      ),
      { role: 'user', content: req.message },
    ];

    const toolCalls: ToolCallTrace[] = [];
    let reply = '';
    let finished = false;

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.callModel(system, messages);
      reply = textOf(response);

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
        finished = true;
        break;
      }

      // Preserve the assistant turn verbatim (incl. thinking blocks) so the
      // follow-up request stays valid.
      messages.push({ role: 'assistant', content: response.content });

      const results: Anthropic.ToolResultBlockParam[] = [];
      for (const use of toolUses) {
        const input = (use.input ?? {}) as Record<string, unknown>;
        toolCalls.push({ name: use.name, input });
        let output: unknown;
        try {
          output = await this.executor.execute(use.name, input, ctx);
        } catch (err) {
          output = {
            error: 'tool_execution_failed',
            message: err instanceof Error ? err.message : String(err),
          };
        }
        results.push({
          type: 'tool_result',
          tool_use_id: use.id,
          content: JSON.stringify(output),
        });
      }
      messages.push({ role: 'user', content: results });
    }

    // The loop exhausted the tool-call budget while the model was still asking
    // for tools: its last turn was a tool_use block, so `reply` is the (usually
    // empty) preamble text of that turn. Returning it would hand the user a blank
    // message and persist it as the assistant reply. Force ONE final pass without
    // tools so the model has to answer in text from the tool results we gathered.
    if (!finished) {
      this.logger.warn(
        `Tool loop hit ${MAX_TOOL_ITERATIONS} iterations for conversation ` +
          `${req.conversationId}; forcing a final tool-free answer.`,
      );
      const closing = await this.callModel(system, messages, {
        allowTools: false,
      });
      reply = textOf(closing);
    }

    // Last-resort guard: never persist/return an empty assistant turn.
    if (!reply) {
      reply =
        'Xin lỗi, mình chưa tổng hợp được câu trả lời cho yêu cầu này. ' +
        'Bạn thử hỏi cụ thể hơn hoặc chia nhỏ câu hỏi giúp mình nhé.';
    }

    await this.conversations.appendTurn(req.conversationId, req.tenantId, [
      { role: 'user', content: req.message, timestamp: new Date() },
      { role: 'assistant', content: reply, timestamp: new Date() },
    ]);

    return {
      conversation_id: req.conversationId,
      reply,
      tool_calls: toolCalls,
      retrieved_sections: ragChunks.map((c) => ({
        section_id: c.section_id,
        score: c.score,
      })),
    };
  }

  private async callModel(
    system: string,
    messages: Anthropic.MessageParam[],
    opts: { allowTools?: boolean } = {},
  ): Promise<Anthropic.Message> {
    const allowTools = opts.allowTools ?? true;
    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      // Omitting tools forces a text-only answer — used for the final closing
      // turn after the tool-call budget is spent (see chat()).
      ...(allowTools ? { tools: TOOL_DEFINITIONS } : {}),
      thinking: { type: 'adaptive' },
      messages,
    };
    return this.client.messages.create(
      body as unknown as Anthropic.MessageCreateParamsNonStreaming,
    );
  }
}

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
}
