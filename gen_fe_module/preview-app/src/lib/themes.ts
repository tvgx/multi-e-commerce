/**
 * Bảng theme CỐ ĐỊNH (màu phối sẵn, đồng bộ) — dùng cho /render (xem thử trang web từ JSON layout)
 * thay vì random từng màu độc lập (randomTheme() trong randomize.ts, vẫn giữ cho capture-crops.mts
 * vì train YOLO cần đa dạng màu). Field trùng đúng shape theme thật của shop (xem
 * apps/storefront/src/app/[shopSlug]/(buyer-view)/layout.tsx — primaryColor/backgroundColor/
 * textColor/buttonColor/buttonTextColor/headingFont/bodyFont).
 */
export interface CuratedTheme {
  name: string;
  label: string;
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  buttonColor: string;
  buttonTextColor: string;
  fontFamily: string;
}

export const CURATED_THEMES: CuratedTheme[] = [
  {
    name: "light",
    label: "Sáng tối giản",
    primaryColor: "#111827",
    backgroundColor: "#ffffff",
    textColor: "#111827",
    buttonColor: "#111827",
    buttonTextColor: "#ffffff",
    fontFamily: "Inter",
  },
  {
    name: "dark",
    label: "Tối sang trọng",
    primaryColor: "#f8fafc",
    backgroundColor: "#0f172a",
    textColor: "#f1f5f9",
    buttonColor: "#f8fafc",
    buttonTextColor: "#0f172a",
    fontFamily: "Montserrat",
  },
  {
    name: "ocean",
    label: "Ocean",
    primaryColor: "#0891b2",
    backgroundColor: "#f0fdfa",
    textColor: "#134e4a",
    buttonColor: "#0891b2",
    buttonTextColor: "#ffffff",
    fontFamily: "Poppins",
  },
  {
    name: "sunset",
    label: "Sunset",
    primaryColor: "#ea580c",
    backgroundColor: "#fff7ed",
    textColor: "#7c2d12",
    buttonColor: "#ea580c",
    buttonTextColor: "#ffffff",
    fontFamily: "Poppins",
  },
  {
    name: "forest",
    label: "Forest",
    primaryColor: "#059669",
    backgroundColor: "#f0fdf4",
    textColor: "#14532d",
    buttonColor: "#059669",
    buttonTextColor: "#ffffff",
    fontFamily: "Nunito",
  },
  {
    name: "berry",
    label: "Berry",
    primaryColor: "#db2777",
    backgroundColor: "#fdf2f8",
    textColor: "#831843",
    buttonColor: "#db2777",
    buttonTextColor: "#ffffff",
    fontFamily: "Playfair Display",
  },
];

export function pickTheme(name?: string | null): CuratedTheme {
  if (name) {
    const found = CURATED_THEMES.find((t) => t.name === name);
    if (found) return found;
  }
  return CURATED_THEMES[Math.floor(Math.random() * CURATED_THEMES.length)];
}

/**
 * Component thật KHÔNG đọc CSS var --theme-* — mỗi component có field màu riêng
 * (backgroundColor/textColor...) với giá trị mặc định hard-code trong schema (vd Header luôn
 * trắng/đen, Footer luôn navy/trắng), độc lập với theme của shop — chỉ --theme-primary/--theme-
 * button (map sang class bg-brand/text-brand) là có tác dụng, và chỉ hiện ở vài nút/badge nhỏ. Vì
 * vậy đổi theme gần như không thấy khác biệt nếu để nguyên default. Hàm này áp giá trị từ theme
 * ĐÃ CHỌN vào field màu theo tên field (đoán qua id) để đổi theme thấy rõ trên cả trang — chỉ dùng
 * cho /render (xem thử), KHÔNG phản ánh đúng 100% cách theme hoạt động trên storefront thật.
 */
export function isBackgroundField(fieldId: string): boolean {
  const id = fieldId.toLowerCase();
  return id.includes("background") || id.endsWith("bg") || id === "bg";
}

export function themeColorForField(fieldId: string, theme: CuratedTheme): string {
  const id = fieldId.toLowerCase();
  if (id.includes("buttontext") || id.includes("button_text")) return theme.buttonTextColor;
  if (id.includes("button")) return theme.buttonColor;
  if (isBackgroundField(id)) return theme.backgroundColor;
  if (id.includes("text") || id.includes("color")) return theme.textColor;
  return theme.primaryColor;
}

function relativeLuminance(hex: string): number {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;
  const lin = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

/**
 * Màu chữ TƯƠNG PHẢN ĐỦ ĐỌC ĐƯỢC trên nền `bgHex` — dùng thay vì gán thẳng `theme.textColor` cho
 * mọi field "text": `theme.textColor` chỉ chắc chắn đúng khi chữ nằm trên đúng `theme.backgroundColor`
 * (nền trang) — nhiều component có card/nền RIÊNG khác nền trang (vd SplitShowcase, Editorial), ép
 * `theme.textColor` (có thể là màu sáng, dành cho nền tối) vào đó ra chữ gần như vô hình trên nền
 * sáng của chính card đó. Tính theo độ sáng tương đối (WCAG luminance) của nền thực tế thay vì đoán.
 */
export function readableTextColor(bgHex: string): string {
  try {
    return relativeLuminance(bgHex) > 0.5 ? "#111827" : "#f8fafc";
  } catch {
    return "#111827";
  }
}
