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

    const ragChunks = await this.rag.retrieveContext(req.message, {
      tenant_id: req.tenantId ?? undefined,
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

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await this.callModel(system, messages);
      reply = textOf(response);

      const toolUses = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUses.length === 0 || response.stop_reason !== 'tool_use') {
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
  ): Promise<Anthropic.Message> {
    const body = {
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system,
      tools: TOOL_DEFINITIONS,
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
