import { ChatbotService } from './chatbot.service';
import { RagRetrievalService } from '../rag/rag-retrieval.service';
import { ConversationRepository } from './conversation.repository';
import { ToolExecutorService } from './tools/tool-executor.service';

/**
 * The tool-use loop is capped at MAX_TOOL_ITERATIONS. These tests pin the
 * behaviour at the cap: the model's last turn is a tool_use block (empty text),
 * so the service must NOT hand the user a blank reply — it forces a final
 * tool-free answer, and falls back to a message if even that is empty.
 */
describe('ChatbotService — tool-loop termination', () => {
  function makeService(
    create: jest.Mock,
    { history = [] as { role: 'user' | 'assistant'; content: string }[] } = {},
  ) {
    const rag = {
      retrieveContext: jest.fn().mockResolvedValue([]),
    } as unknown as RagRetrievalService;
    const conversations = {
      loadRecent: jest.fn().mockResolvedValue(history),
      appendTurn: jest.fn().mockResolvedValue(undefined),
    } as unknown as ConversationRepository;
    const executor = {
      execute: jest.fn().mockResolvedValue({ ok: true }),
    } as unknown as ToolExecutorService;

    const service = new ChatbotService(rag, conversations, executor);
    // Inject a fake Anthropic client (the real getter would read ANTHROPIC_API_KEY).
    (service as unknown as { _client: unknown })._client = {
      messages: { create },
    };
    return { service, conversations };
  }

  const textResponse = (text: string) => ({
    content: text ? [{ type: 'text', text }] : [],
    stop_reason: 'end_turn',
  });
  const toolUseResponse = () => ({
    content: [{ type: 'tool_use', id: 'tu1', name: 'get_page_layout', input: {} }],
    stop_reason: 'tool_use',
  });

  const req = { message: 'hi', conversationId: 'c1', tenantId: null };

  it('returns the model text on a normal (no-tool) turn without a closing call', async () => {
    const create = jest.fn().mockResolvedValue(textResponse('here is the layout'));
    const { service } = makeService(create);

    const res = await service.chat(req);

    expect(res.reply).toBe('here is the layout');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('forces a tool-free answer when the tool-call budget is exhausted', async () => {
    const create = jest.fn();
    // 6 iterations all keep asking for tools…
    for (let i = 0; i < 6; i++) create.mockResolvedValueOnce(toolUseResponse());
    // …then the forced closing call (no tools) returns real text.
    create.mockResolvedValueOnce(textResponse('final summary'));
    const { service, conversations } = makeService(create);

    const res = await service.chat(req);

    expect(res.reply).toBe('final summary');
    expect(create).toHaveBeenCalledTimes(7);
    // The 7th (closing) call must omit `tools` so the model has to answer in text.
    expect(create.mock.calls[6][0].tools).toBeUndefined();
    // The forced answer is what gets persisted — never the empty tool_use turn.
    const persisted = (conversations.appendTurn as jest.Mock).mock.calls[0][2];
    expect(persisted[1].content).toBe('final summary');
  });

  it('falls back to a message instead of persisting an empty reply', async () => {
    const create = jest.fn().mockResolvedValue(textResponse(''));
    const { service } = makeService(create);

    const res = await service.chat(req);

    expect(res.reply).toContain('Xin lỗi');
  });
});
