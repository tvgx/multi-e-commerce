/** Request body for POST /design-agent/chat. */
export interface ChatRequestDto {
  message: string;
  conversation_id: string;
  tenant_id?: string | null;
}

export interface ChatResponseDto {
  conversation_id: string;
  reply: string;
  tool_calls: { name: string; input: Record<string, unknown> }[];
  retrieved_sections: { section_id: string; score: number }[];
}

/** Throws a descriptive message per missing/invalid field (no global pipe). */
export function validateChatRequest(body: unknown): Required<
  Pick<ChatRequestDto, 'message' | 'conversation_id'>
> & { tenant_id: string | null } {
  const b = (body ?? {}) as Record<string, unknown>;
  if (typeof b.message !== 'string' || !b.message.trim()) {
    throw new Error('`message` is required and must be a non-empty string.');
  }
  if (typeof b.conversation_id !== 'string' || !b.conversation_id.trim()) {
    throw new Error('`conversation_id` is required and must be a string.');
  }
  const tenant =
    b.tenant_id === undefined || b.tenant_id === null
      ? null
      : String(b.tenant_id);
  return {
    message: b.message,
    conversation_id: b.conversation_id,
    tenant_id: tenant,
  };
}
