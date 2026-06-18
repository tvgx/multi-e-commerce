import {
  FigmaNode,
  getTopLevelFrames,
  reduceNode,
  summarizeFills,
} from './node-tree-reducer';

describe('reduceNode', () => {
  it('keeps structural fields, summarises a solid fill, and drops heavy props', () => {
    const node: FigmaNode = {
      id: '1:2',
      name: 'Hero',
      type: 'FRAME',
      absoluteBoundingBox: { x: 0, y: 0, width: 1440, height: 600 },
      fills: [{ type: 'SOLID', color: { r: 1, g: 0, b: 0 } }],
      effects: [{ type: 'DROP_SHADOW' }],
      strokes: [{ type: 'SOLID' }],
      exportSettings: [{ format: 'PNG' }],
    };

    const reduced = reduceNode(node) as unknown as Record<string, unknown>;

    expect(Object.keys(reduced).sort()).toEqual([
      'absoluteBoundingBox',
      'backgroundColor',
      'id',
      'name',
      'type',
    ]);
    // raw fills/effects/strokes are gone; the solid fill is summarised to hex
    expect(reduced.fills).toBeUndefined();
    expect(reduced.effects).toBeUndefined();
    expect(reduced.strokes).toBeUndefined();
    expect(reduced.backgroundColor).toBe('#ff0000');
    expect(reduced.absoluteBoundingBox).toEqual({
      x: 0,
      y: 0,
      width: 1440,
      height: 600,
    });
  });

  it('captures TEXT content and font summary', () => {
    const reduced = reduceNode({
      id: 't1',
      name: 'Title',
      type: 'TEXT',
      characters: '  Summer Collection  ',
      style: {
        fontFamily: 'Inter',
        fontSize: 48,
        fontWeight: 700,
        textAlignHorizontal: 'CENTER',
      },
    });

    expect(reduced.text).toBe('Summer Collection');
    expect(reduced.font).toEqual({
      family: 'Inter',
      size: 48,
      weight: 700,
      align: 'CENTER',
    });
  });

  it('flags image fills via imageRef and ignores invisible fills', () => {
    const { imageRef, backgroundColor } = summarizeFills({
      id: 'r',
      name: 'Bg',
      type: 'RECTANGLE',
      fills: [
        { type: 'SOLID', color: { r: 0, g: 0, b: 0 }, visible: false },
        { type: 'IMAGE', imageRef: 'abc123' },
      ],
    });

    expect(imageRef).toBe('abc123');
    expect(backgroundColor).toBeUndefined();
  });

  it('recurses into children and preserves order', () => {
    const node: FigmaNode = {
      id: 'root',
      name: 'Page',
      type: 'FRAME',
      children: [
        { id: 'a', name: 'A', type: 'TEXT', fills: [{}] },
        {
          id: 'b',
          name: 'B',
          type: 'GROUP',
          children: [{ id: 'b1', name: 'B1', type: 'RECTANGLE' }],
        },
      ],
    };

    const reduced = reduceNode(node);

    expect(reduced.children).toHaveLength(2);
    expect(reduced.children?.map((c) => c.id)).toEqual(['a', 'b']);
    expect(reduced.children?.[1].children?.[0].id).toBe('b1');
    // child styling stripped
    expect(
      (reduced.children?.[0] as unknown as Record<string, unknown>).fills,
    ).toBeUndefined();
  });

  it('omits the children key when there are none', () => {
    const reduced = reduceNode({ id: 'x', name: 'X', type: 'TEXT' });
    expect('children' in reduced).toBe(false);
  });
});

describe('getTopLevelFrames', () => {
  const document: FigmaNode = {
    id: '0:0',
    name: 'Document',
    type: 'DOCUMENT',
    children: [
      {
        id: '0:1',
        name: 'Page 1',
        type: 'CANVAS',
        children: [
          { id: '1:1', name: 'Home', type: 'FRAME' },
          { id: '1:2', name: 'Product', type: 'FRAME' },
          { id: '1:3', name: 'stray vector', type: 'VECTOR' },
        ],
      },
      {
        id: '0:2',
        name: 'Page 2',
        type: 'CANVAS',
        children: [{ id: '2:1', name: 'About', type: 'COMPONENT' }],
      },
    ],
  };

  it('collects FRAME/COMPONENT children across canvases, skipping non-frames', () => {
    const frames = getTopLevelFrames(document);
    expect(frames.map((f) => f.id)).toEqual(['1:1', '1:2', '2:1']);
  });

  it('falls back to treating a lone frame as the only page', () => {
    const frames = getTopLevelFrames({ id: 'f', name: 'F', type: 'FRAME' });
    expect(frames.map((f) => f.id)).toEqual(['f']);
  });
});
