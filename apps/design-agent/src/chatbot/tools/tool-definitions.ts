import type Anthropic from '@anthropic-ai/sdk';

/**
 * Tool schemas advertised to Claude. `tenant_id` appears on the data tools for
 * the model's benefit, but the executor ALWAYS overrides it with the
 * authenticated tenant from the request — the model can never widen its own
 * scope (see {@link ToolExecutorService}).
 */
export const TOOL_DEFINITIONS: Anthropic.Tool[] = [
  {
    name: 'get_page_layout',
    description:
      'Return the full extracted layout document for one page of a tenant ' +
      'storefront. Use when the user asks about a specific page (by slug, path, ' +
      'or page type such as "home", "product_detail", "cart").',
    input_schema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string', description: 'Tenant the page belongs to.' },
        page_path: {
          type: 'string',
          description:
            'Page slug, path, or pageType (e.g. "home", "/products", "cart").',
        },
      },
      required: ['page_path'],
    },
  },
  {
    name: 'get_section_components',
    description:
      'Return the component list of one section on a page. Use when the user ' +
      'asks what is inside a specific section/block of a page.',
    input_schema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        page_path: { type: 'string', description: 'Page slug/path/pageType.' },
        section_name: {
          type: 'string',
          description:
            'Section title or component id (e.g. "Hero", "Featured Products").',
        },
      },
      required: ['page_path', 'section_name'],
    },
  },
  {
    name: 'search_pages',
    description:
      'Full-text search the tenant\'s pages by name/slug keyword. Use to ' +
      'discover which pages exist or find a page when the exact path is unknown.',
    input_schema: {
      type: 'object',
      properties: {
        tenant_id: { type: 'string' },
        keyword: { type: 'string', description: 'Search term.' },
      },
      required: ['keyword'],
    },
  },
  {
    name: 'get_component_registry_info',
    description:
      'Look up a UI component in the real @ecommerce/ui-registry: whether it ' +
      'exists, its category, and its prop fields. ALWAYS prefer this over ' +
      'guessing when the user asks how a component renders or what props it takes.',
    input_schema: {
      type: 'object',
      properties: {
        component_name: {
          type: 'string',
          description: 'Component id or name (e.g. "Hero", "FeaturedProducts").',
        },
      },
      required: ['component_name'],
    },
  },
  {
    name: 'get_master_template',
    description:
      'Return the industry blueprint ("standard" template) from ' +
      '@ecommerce/master-templates to compare against a tenant\'s actual layout. ' +
      'Industries: standard, visual, technical, service (plus aliases).',
    input_schema: {
      type: 'object',
      properties: {
        industry: {
          type: 'string',
          description: 'Industry/template key, e.g. "standard", "fashion", "saas".',
        },
      },
      required: ['industry'],
    },
  },
];
