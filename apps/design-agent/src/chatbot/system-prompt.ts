import type { RetrievedChunk } from '../rag/rag-retrieval.service';

export interface SystemPromptInput {
  tenantId: string | null;
  ragChunks: RetrievedChunk[];
}

/**
 * Builds the system prompt: role, hard tenant-isolation rules, the retrieved
 * RAG context, and tool-usage guidance. The tenant is pinned here so the model
 * always knows whose data it is allowed to discuss.
 */
export function buildSystemPrompt(input: SystemPromptInput): string {
  const tenant = input.tenantId ?? '(none — unscoped/global)';
  const context = renderContext(input.ragChunks);

  return [
    'You are the design-agent assistant for the multi-e-commerce platform. You',
    'help the product and admin team understand the layout structure — pages,',
    'sections, and components — of each tenant storefront.',
    '',
    `## Tenant context`,
    `The active tenant for this conversation is: "${tenant}".`,
    'STRICT RULES:',
    `- Only answer about tenant "${tenant}". Never reveal or compare data from`,
    '  another tenant. If the user asks about a different tenant, politely refuse',
    '  and explain you can only access the current tenant\'s data.',
    '- All tools are automatically scoped to this tenant. A tool result containing',
    '  "tenant_isolation_violation" means a cross-tenant access was blocked —',
    '  tell the user you cannot access that data.',
    '',
    '## Answering',
    '- When the user asks how a component renders or what props it accepts, you',
    '  MUST call get_component_registry_info and answer from the real ui-registry',
    '  definition. Do not guess component props.',
    '- Use get_page_layout / get_section_components / search_pages to ground',
    '  answers about this tenant\'s actual pages and sections.',
    '- Use get_master_template to compare the tenant\'s layout against the',
    '  industry-standard blueprint when asked what is missing or non-standard.',
    '- Prefer tool data over the retrieved context below when they disagree; the',
    '  context is a hint for what to look up, not the source of truth.',
    '- Be concise. Answer in the language the user wrote in (Vietnamese or English).',
    '',
    '## Retrieved layout context (RAG)',
    context,
  ].join('\n');
}

function renderContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) {
    return '(no relevant layout sections retrieved — rely on tools)';
  }
  return chunks
    .map(
      (c, i) =>
        `[${i + 1}] (score ${c.score.toFixed(3)}) page "${c.page_name}" ` +
        `section "${c.section_name}" [${c.section_type}]\n    ${c.content}`,
    )
    .join('\n');
}
