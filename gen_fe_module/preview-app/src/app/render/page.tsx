import { registry } from "@ecommerce/ui-registry";
import { ComponentSchemas, type ComponentSchema } from "@ecommerce/ui-registry/src/component-schemas";
import { pageContextFor } from "@/lib/sample-data";
import { themeStyleFor } from "@/lib/theme-style";
import { randomizeProps, randomizeBlocks } from "@/lib/randomize";
import { pickTheme, themeColorForField, isBackgroundField, readableTextColor, CURATED_THEMES, type CuratedTheme } from "@/lib/themes";

/**
 * Ghi đè mọi field type "color" (kể cả trong blocks lồng bên trong) bằng màu lấy từ theme đã chọn
 * — xem giải thích trong themes.ts: component thật không tự đọc theme của shop, phải tự tiêm vào
 * đây thì đổi theme mới thấy khác biệt trên cả trang.
 *
 * 2 bước: (1) tìm field nền của CHÍNH component này (nếu có) để biết nó đang vẽ trên nền gì — nếu
 * không có thì coi như dùng luôn nền trang; (2) mọi field "chữ" tính màu theo ĐỘ TƯƠNG PHẢN với
 * nền đã tìm ở bước 1 (readableTextColor), KHÔNG gán thẳng theme.textColor — vì theme.textColor
 * chỉ chắc đúng khi chữ nằm trên nền trang, nhiều component có card/nền riêng khác nền trang.
 *
 * Ngoại lệ: component có field "overlay*" (vd SlideItem — ảnh nền + lớp phủ tối để chữ đọc được,
 * xem component-schemas.ts) thì chữ KHÔNG nằm trên `localBg` mà nằm trên ẢNH + OVERLAY — bỏ qua,
 * giữ nguyên default của schema (đã thiết kế sẵn để đọc được trên ảnh, đổi theo theme dễ làm mất
 * tác dụng, vd overlay trắng phủ mờ lên ảnh sáng).
 *
 * Ngoại lệ khác: 1 số component có card/nền HARD-CODE ngay trong JSX (không qua field nào cả, vd
 * `LayeredSlideshow.tsx` — card chữ luôn `bg-white/90`, tách biệt hẳn field `backgroundColor` của
 * section) — trường hợp này default của SCHEMA cũng sai (vd `textColor: '#ffffff'` trên card trắng
 * mờ, đã tối màu sẵn kể cả khi không đổi theme) nên không thể "giữ default" như case overlay ở
 * trên. Khai báo thủ công trong KNOWN_LOCAL_SURFACE khi phát hiện qua test trực quan.
 *
 * QUAN TRỌNG: key theo "<componentId cha>.<componentId block>", KHÔNG phải chỉ tên block — 1 block
 * (vd SlideItem) có thể dùng chung bởi nhiều section khác nhau với bối cảnh hiển thị khác hẳn nhau
 * (LayeredSlideshow đặt SlideItem trong card trắng hard-code, còn SlideshowFullFrame đặt SlideItem
 * nằm thẳng trên ảnh+overlay — không có card nào cả). Key theo mỗi tên block sẽ áp nhầm override
 * của trường hợp này sang trường hợp kia (đã xảy ra thật — SlideshowFullFrame bị ép chữ tối trên
 * nền ảnh tối, gần như không đọc được).
 */
const KNOWN_LOCAL_SURFACE: Record<string, string> = {
  "LayeredSlideshow.SlideItem": "#ffffff", // LayeredSlideshow.tsx: card text luôn bg-white/90
};

function applyThemeColors(schema: ComponentSchema, props: Record<string, unknown>, theme: CuratedTheme, parentComponentId?: string): void {
  const hasOverlay = schema.settings.some((f) => f.id.toLowerCase().includes("overlay"));
  const knownSurface = KNOWN_LOCAL_SURFACE[parentComponentId ? `${parentComponentId}.${schema.id}` : schema.id];

  let localBg = theme.backgroundColor;
  for (const field of schema.settings) {
    if (field.type === "color" && isBackgroundField(field.id)) {
      localBg = themeColorForField(field.id, theme);
      break;
    }
  }

  for (const field of schema.settings) {
    if (field.type !== "color") continue;
    const id = field.id.toLowerCase();
    if (id.includes("overlay")) {
      continue;
    } else if (id.includes("buttontext") || id.includes("button_text")) {
      props[field.id] = theme.buttonTextColor;
    } else if (id.includes("button")) {
      props[field.id] = theme.buttonColor;
    } else if (isBackgroundField(id)) {
      props[field.id] = localBg;
    } else if (id.includes("text") || id.includes("color")) {
      if (knownSurface) {
        props[field.id] = readableTextColor(knownSurface);
      } else if (hasOverlay) {
        continue;
      } else {
        props[field.id] = readableTextColor(localBg);
      }
    } else {
      props[field.id] = theme.primaryColor;
    }
  }

  const blocks = props.blocks as Array<{ componentId: string; props: Record<string, unknown> }> | undefined;
  if (blocks) {
    for (const block of blocks) {
      const blockSchema = ComponentSchemas[block.componentId];
      if (blockSchema) applyThemeColors(blockSchema, block.props, theme, schema.id);
    }
  }
}

interface PageProps {
  searchParams: Promise<{ layout?: string; global?: string; theme?: string }>;
}

interface LayoutComponentRef {
  componentId: string;
  order?: number;
}

interface LayoutDict {
  components: LayoutComponentRef[];
}

interface GlobalLayoutDict {
  globalComponents: LayoutComponentRef[];
}

// Header/AnnouncementBar luôn hiển thị TRƯỚC nội dung trang, Footer luôn SAU — đúng cách
// apps/storefront/.../layout.tsx bọc quanh mọi trang (xem packages/schema/src/layout.schema.ts).
const GLOBAL_BEFORE = new Set(["AnnouncementBar", "Header"]);
const GLOBAL_AFTER = new Set(["Footer"]);

function parseLayout(raw: string | undefined): LayoutDict | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.components)) return parsed as LayoutDict;
    return null;
  } catch {
    return null;
  }
}

function parseGlobal(raw: string | undefined): GlobalLayoutDict | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.globalComponents)) return parsed as GlobalLayoutDict;
    return null;
  } catch {
    return null;
  }
}

function renderComponentRef(ref: LayoutComponentRef, key: string | number, theme: CuratedTheme) {
  const Component = registry[ref.componentId];
  const schema = ComponentSchemas[ref.componentId];
  if (!Component || !schema) {
    return (
      <div key={key} style={{ padding: 16, color: "#b91c1c", fontFamily: "monospace" }}>
        Unknown componentId: {ref.componentId}
      </div>
    );
  }
  const props = randomizeProps(schema, { randomizeColors: false });
  const blocks = randomizeBlocks(schema, { randomizeColors: false });
  if (blocks) props.blocks = blocks;
  applyThemeColors(schema, props, theme);
  const pageContext = pageContextFor(ref.componentId);
  return <Component key={key} {...pageContext} {...props} previewMode blocks={props.blocks ?? []} />;
}

/**
 * Render thử 1 trang ĐẦY ĐỦ từ JSON layout (output của detect_component_module) bằng component
 * thật, xếp đúng thứ tự — dùng để xem trực quan "layout này khi lên trang thật trông ra sao".
 *
 * layout xuất ra từ detect_component_module hiện chỉ có componentId (chưa nhận diện được nội dung
 * thật trong ảnh gốc) -> nội dung (text/ảnh/số) ở đây là NGẪU NHIÊN (tạm thời), chỉ minh hoạ đúng
 * cấu trúc/thứ tự section, không phải nội dung đúng như ảnh đã detect. MÀU SẮC thì KHÔNG random
 * độc lập từng component (khác capture-crops.mts) — dùng 1 theme cố định trong CURATED_THEMES
 * (themes.ts) cho cả trang, rồi TIÊM thẳng vào từng field màu của từng component
 * (applyThemeColors, xem themes.ts — component thật không tự đọc theme của shop) để đổi theme
 * thấy khác biệt rõ trên cả trang, không chỉ ở vài nút bấm.
 *
 * Dùng: /render?layout=<...>&global=<encodeURIComponent(JSON.stringify({globalComponents:[...]}))>&theme=<tên_theme|bỏ trống=random>
 * global (tuỳ chọn): Header/AnnouncementBar/Footer — ghép vào trước/sau nội dung trang, xem
 * GLOBAL_BEFORE/GLOBAL_AFTER bên dưới. Tên theme hợp lệ: light | dark | ocean | sunset | forest |
 * berry (xem themes.ts)
 */
export default async function RenderPage({ searchParams }: PageProps) {
  const { layout: layoutRaw, global: globalRaw, theme: themeName } = await searchParams;
  const layout = parseLayout(layoutRaw);

  if (!layout || layout.components.length === 0) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace", color: "#b91c1c" }}>
        Thiếu hoặc sai query param &quot;layout&quot; — cần JSON dạng{" "}
        {'{ "components": [{ "componentId": "Hero", "order": 0 }, ...] }'}
        <br />
        Tên theme hợp lệ (query &quot;theme&quot;, tuỳ chọn): {CURATED_THEMES.map((t) => t.name).join(", ")}
      </div>
    );
  }

  const ordered = [...layout.components].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const globalLayout = parseGlobal(globalRaw);
  const globalComponents = globalLayout?.globalComponents ?? [];
  const globalBefore = globalComponents
    .filter((c) => GLOBAL_BEFORE.has(c.componentId))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const globalAfter = globalComponents
    .filter((c) => GLOBAL_AFTER.has(c.componentId))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const theme = pickTheme(themeName);
  const themeStyle = themeStyleFor({ ...theme });

  return (
    <div id="gfm-render-root" style={themeStyle}>
      {globalBefore.map((ref, i) => renderComponentRef(ref, `global-before-${i}`, theme))}
      {ordered.map((ref, i) => renderComponentRef(ref, i, theme))}
      {globalAfter.map((ref, i) => renderComponentRef(ref, `global-after-${i}`, theme))}
    </div>
  );
}
