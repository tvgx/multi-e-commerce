/**
 * Pure, dependency-free reduction of a Figma document tree.
 *
 * The Figma REST file response is huge — every node carries fills, strokes,
 * effects, layout grids, exportSettings, vector geometry, etc. For layout
 * extraction we only need the structural skeleton, so we keep a small
 * whitelist of fields and recurse into `children`. Stripping the rest keeps
 * the Claude prompt small and cheap.
 *
 * Kept intentionally free of Nest/Anthropic imports so it is trivially unit
 * testable (see node-tree-reducer.spec.ts).
 */

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The (loosely-typed) shape of a raw node from the Figma REST API. */
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: BoundingBox | null;
  children?: FigmaNode[];
  // ...plus many heavy fields we deliberately drop (fills, effects, strokes, …)
  [key: string]: unknown;
}

/** The slimmed-down node we actually send to Claude. */
export interface ReducedNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: BoundingBox;
  children?: ReducedNode[];
}

/** Fields preserved on every node. Everything else is discarded. */
const KEPT_KEYS = ['id', 'name', 'type', 'absoluteBoundingBox'] as const;

/**
 * Recursively reduce a node, keeping only structural fields and recursing into
 * children. `children` is omitted entirely when empty so the JSON stays terse.
 */
export function reduceNode(node: FigmaNode): ReducedNode {
  const reduced: ReducedNode = {
    id: node.id,
    name: node.name,
    type: node.type,
  };

  if (node.absoluteBoundingBox) {
    const { x, y, width, height } = node.absoluteBoundingBox;
    reduced.absoluteBoundingBox = { x, y, width, height };
  }

  if (Array.isArray(node.children) && node.children.length > 0) {
    reduced.children = node.children.map(reduceNode);
  }

  return reduced;
}

/** Node types we treat as a "page" frame at the top level of a canvas. */
const PAGE_FRAME_TYPES = new Set(['FRAME', 'COMPONENT', 'COMPONENT_SET']);

/**
 * Collect the top-level frames of a Figma file document. The document's direct
 * children are CANVAS nodes (Figma "pages"); each canvas's direct frame
 * children is one storefront page candidate. Frames from every canvas are
 * returned, preserving order.
 */
export function getTopLevelFrames(document: FigmaNode): FigmaNode[] {
  const canvases = Array.isArray(document.children) ? document.children : [];
  const frames: FigmaNode[] = [];

  for (const canvas of canvases) {
    const nodes = Array.isArray(canvas.children) ? canvas.children : [];
    for (const child of nodes) {
      if (PAGE_FRAME_TYPES.has(child.type)) {
        frames.push(child);
      }
    }
  }

  // Fallback: a node passed in that is already a single frame (e.g. a specific
  // node fetched directly) — treat it as the only page.
  if (frames.length === 0 && PAGE_FRAME_TYPES.has(document.type)) {
    frames.push(document);
  }

  return frames;
}

// The KEPT_KEYS constant documents intent for readers; it is referenced here so
// linters don't flag it as unused while keeping reduceNode explicit/fast.
export const REDUCED_FIELDS: readonly string[] = KEPT_KEYS;
