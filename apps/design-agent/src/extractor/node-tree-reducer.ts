/**
 * Pure, dependency-free reduction of a Figma document tree.
 *
 * The Figma REST file response is huge — every node carries fills, strokes,
 * effects, layout grids, exportSettings, vector geometry, etc. For layout
 * extraction we keep the structural skeleton PLUS a small, prompt-cheap summary
 * of the visual signal we actually use to match an existing storefront section:
 * the text content, the dominant font, a solid background colour, and a marker
 * for image fills (so the asset pipeline knows which nodes need a real image).
 * Everything else (vector geometry, effects, strokes, gradients, layout grids)
 * is discarded to keep the Claude prompt small and cheap.
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

/** Compact font summary lifted from a TEXT node's `style`. */
export interface FontSummary {
  family?: string;
  size?: number;
  weight?: number;
  align?: string;
}

/** The (loosely-typed) shape of a raw node from the Figma REST API. */
export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: BoundingBox | null;
  children?: FigmaNode[];
  // ...plus many heavy fields we deliberately drop (effects, strokes, vector …)
  [key: string]: unknown;
}

/** The slimmed-down node we actually send to Claude. */
export interface ReducedNode {
  id: string;
  name: string;
  type: string;
  absoluteBoundingBox?: BoundingBox;
  /** TEXT content (`node.characters`), trimmed. */
  text?: string;
  /** Dominant font for TEXT nodes. */
  font?: FontSummary;
  /** Hex of a SOLID fill, e.g. `#ff0000`. */
  backgroundColor?: string;
  /** Set when the node has an IMAGE fill — flags it for the asset pipeline. */
  imageRef?: string;
  children?: ReducedNode[];
}

/** Structural fields preserved on every node before the visual summary. */
const KEPT_KEYS = ['id', 'name', 'type', 'absoluteBoundingBox'] as const;

/** Max characters of text kept per node so the prompt stays bounded. */
const MAX_TEXT_LEN = 300;

/**
 * Recursively reduce a node, keeping structural fields, a compact visual
 * summary, and recursing into children. `children` is omitted entirely when
 * empty so the JSON stays terse.
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

  const text = summarizeText(node);
  if (text) reduced.text = text;

  const font = summarizeFont(node);
  if (font) reduced.font = font;

  const { backgroundColor, imageRef } = summarizeFills(node);
  if (backgroundColor) reduced.backgroundColor = backgroundColor;
  if (imageRef) reduced.imageRef = imageRef;

  if (Array.isArray(node.children) && node.children.length > 0) {
    reduced.children = node.children.map(reduceNode);
  }

  return reduced;
}

/** Extract trimmed, length-capped text content from a TEXT node. */
export function summarizeText(node: FigmaNode): string | undefined {
  if (typeof node.characters !== 'string') return undefined;
  const text = node.characters.trim();
  if (!text) return undefined;
  return text.length > MAX_TEXT_LEN ? `${text.slice(0, MAX_TEXT_LEN)}…` : text;
}

/** Reduce a TEXT node's `style` to the handful of font fields we use. */
export function summarizeFont(node: FigmaNode): FontSummary | undefined {
  const style = node.style as Record<string, unknown> | undefined;
  if (!style || typeof style !== 'object') return undefined;

  const font: FontSummary = {};
  if (typeof style.fontFamily === 'string') font.family = style.fontFamily;
  if (typeof style.fontSize === 'number') font.size = style.fontSize;
  if (typeof style.fontWeight === 'number') font.weight = style.fontWeight;
  if (typeof style.textAlignHorizontal === 'string') {
    font.align = style.textAlignHorizontal;
  }

  return Object.keys(font).length > 0 ? font : undefined;
}

/**
 * Inspect a node's `fills` for the two signals we care about: the first SOLID
 * fill (→ background colour) and the first IMAGE fill (→ imageRef marker for
 * the asset pipeline). Gradients/other paint types are intentionally ignored.
 */
export function summarizeFills(node: FigmaNode): {
  backgroundColor?: string;
  imageRef?: string;
} {
  const fills = node.fills;
  if (!Array.isArray(fills)) return {};

  const result: { backgroundColor?: string; imageRef?: string } = {};

  for (const fill of fills) {
    if (!fill || typeof fill !== 'object') continue;
    const f = fill as Record<string, unknown>;
    if (f.visible === false) continue;

    if (f.type === 'SOLID' && !result.backgroundColor && isColor(f.color)) {
      result.backgroundColor = colorToHex(f.color);
    }
    if (f.type === 'IMAGE' && !result.imageRef && typeof f.imageRef === 'string') {
      result.imageRef = f.imageRef;
    }
  }

  return result;
}

interface RgbColor {
  r: number;
  g: number;
  b: number;
  a?: number;
}

function isColor(value: unknown): value is RgbColor {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.r === 'number' &&
    typeof c.g === 'number' &&
    typeof c.b === 'number'
  );
}

/** Figma colours are 0–1 floats; convert to a `#rrggbb` hex string. */
function colorToHex(color: RgbColor): string {
  const channel = (v: number) =>
    Math.round(Math.min(1, Math.max(0, v)) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(color.r)}${channel(color.g)}${channel(color.b)}`;
}

/**
 * Walk a reduced tree and collect every node carrying an IMAGE fill, so the
 * asset pipeline knows which `imageRef`s to resolve + re-host. Returns the node
 * id alongside its imageRef (node id is what props are keyed on downstream).
 */
export function collectImageNodes(
  node: ReducedNode,
): Array<{ id: string; imageRef: string }> {
  const out: Array<{ id: string; imageRef: string }> = [];
  const walk = (n: ReducedNode) => {
    if (n.imageRef) out.push({ id: n.id, imageRef: n.imageRef });
    n.children?.forEach(walk);
  };
  walk(node);
  return out;
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
