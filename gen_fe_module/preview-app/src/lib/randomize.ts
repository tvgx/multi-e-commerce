/**
 * Sinh props/theme NGẪU NHIÊN cho 1 component thật, dựa trên FieldSchema khai báo trong
 * component-schemas.ts. Dùng chung bởi scripts/capture-crops.mts (chụp crop train YOLO) và
 * src/app/render/page.tsx (xem thử 1 trang ghép từ JSON layout — nội dung tạm thời là ngẫu nhiên,
 * vì layout xuất ra từ detect_component_module hiện chỉ có componentId, chưa có nội dung thật).
 */
import { ComponentSchemas, GOOGLE_FONTS, type ComponentSchema, type FieldSchema } from "@ecommerce/ui-registry/src/component-schemas";

const WORD_POOL = [
  "Mua ngay", "Xem thêm", "Đặt hàng", "Yêu thích", "Chia sẻ", "Xác nhận", "Huỷ bỏ", "Lưu lại",
  "Gửi đi", "Đóng lại", "Sản phẩm mới", "Khuyến mãi hè", "Giao hàng nhanh", "Thanh toán", "Tài khoản",
  "Trợ giúp", "Free ship toàn quốc", "Giảm 50% hôm nay", "Hàng mới về", "Đang giảm giá sốc",
  "Xin chào bạn", "Cảm ơn đã ghé thăm", "Đăng nhập", "Đăng ký ngay", "Liên hệ chúng tôi",
  "Ưu đãi hôm nay", "Bộ sưu tập mùa hè", "Phong cách tối giản", "Chất lượng hàng đầu",
  "Miễn phí đổi trả 30 ngày", "Được yêu thích nhất", "Hàng chính hãng 100%",
];

const COLOR_POOL = [
  "#111827", "#1f2937", "#0f172a", "#ffffff", "#f8fafc", "#fef2f2", "#eff6ff", "#f0fdf4",
  "#4f46e5", "#059669", "#dc2626", "#d97706", "#0891b2", "#7c3aed", "#db2777", "#ea580c",
];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomText(maxWords = 2): string {
  const n = randomInt(1, maxWords);
  return Array.from({ length: n }, () => WORD_POOL[randomInt(0, WORD_POOL.length - 1)]).join(" ");
}

function randomColor(): string {
  return COLOR_POOL[randomInt(0, COLOR_POOL.length - 1)];
}

function randomImageUrl(w = 1200, h = 800): string {
  return `https://picsum.photos/seed/gfm-${randomInt(1, 999999)}/${w}/${h}`;
}

export interface RandomizeOptions {
  /** false = giữ màu mặc định của schema thay vì random — dùng cho /render (xem trang thử) để
   * màu sắc đồng nhất theo 1 theme đã chọn thay vì mỗi component tự chọn màu ngẫu nhiên riêng gây
   * chỏi nhau. Mặc định true (random) — giữ nguyên hành vi cũ cho capture-crops.mts (train YOLO
   * cần đa dạng màu sắc để model không học lệch theo 1 bảng màu cố định). */
  randomizeColors?: boolean;
}

export function randomFieldValue(field: FieldSchema, opts: RandomizeOptions = {}): unknown {
  const randomizeColors = opts.randomizeColors ?? true;
  switch (field.type) {
    case "text":
      return randomText(field.id.toLowerCase().includes("link") ? 1 : 2);
    case "textarea":
      return randomText(4) + ". " + randomText(4) + ".";
    case "color":
      return randomizeColors ? randomColor() : field.default;
    case "image":
      return randomImageUrl();
    case "number": {
      // Field kiểu "opacity" (vd overlayOpacity) là TỈ LỆ 0-1, không khai báo min/max riêng (mặc
      // định field.min=1 sẽ sai hoàn toàn — CSS opacity >1 tự kẹp về 1, overlay luôn đục hoàn
      // toàn, che kín ảnh nền). Né 2 đầu (0 = mất tác dụng, gần 1 = che kín ảnh) để còn nhìn được
      // cả ảnh lẫn overlay.
      if (field.min === undefined && field.max === undefined && field.id.toLowerCase().includes("opacity")) {
        return Math.round((0.15 + Math.random() * 0.45) * 100) / 100;
      }
      const min = field.min ?? 1;
      const max = field.max ?? Math.max(min + 4, 8);
      return randomInt(min, max);
    }
    case "boolean":
      return Math.random() < 0.5;
    case "font":
      return GOOGLE_FONTS[randomInt(0, GOOGLE_FONTS.length - 1)].value;
    case "select":
    case "segmented": {
      if (!field.options || field.options.length === 0) return field.default;
      const opt = field.options[randomInt(0, field.options.length - 1)];
      return typeof opt === "string" ? opt : opt.value;
    }
    case "product":
      return "sample-1";
    default:
      return field.default;
  }
}

export function randomizeProps(schema: ComponentSchema, opts: RandomizeOptions = {}): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const field of schema.settings) {
    props[field.id] = randomFieldValue(field, opts);
  }
  return props;
}

let uuidCounter = 0;
function fakeId(): string {
  uuidCounter += 1;
  return `preview-${uuidCounter}`;
}

export function randomizeBlocks(
  schema: ComponentSchema,
  opts: RandomizeOptions = {},
): Array<{ id: string; componentId: string; type: string; props: Record<string, unknown> }> | undefined {
  if (!schema.defaultBlocks || schema.defaultBlocks.length === 0) return undefined;
  return schema.defaultBlocks.map((block) => {
    const blockSchema = ComponentSchemas[block.componentId];
    const props = blockSchema ? randomizeProps(blockSchema, opts) : { ...block.props };
    return { id: fakeId(), componentId: block.componentId, type: blockSchema?.type || "block", props };
  });
}

export function randomTheme(): Record<string, string> {
  return {
    primaryColor: randomColor(),
    backgroundColor: randomColor(),
    textColor: randomColor(),
    buttonColor: randomColor(),
    buttonTextColor: randomColor(),
    fontFamily: GOOGLE_FONTS[randomInt(0, GOOGLE_FONTS.length - 1)].value,
  };
}
