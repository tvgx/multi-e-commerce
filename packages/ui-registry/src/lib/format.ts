/**
 * Centralized money formatting for the whole platform.
 *
 * Before this helper, prices were formatted ad-hoc in ~60 call sites with three
 * incompatible styles: `$${n.toFixed(2)}` (USD), `n.toLocaleString('vi-VN') + 'đ'`,
 * and a locale-less `n.toLocaleString() + 'đ'` (wrong grouping). This is the single
 * source of truth — default is Vietnamese đồng (no minor units).
 *
 * TODO 11: giá trong DB LUÔN là VND; khi UI đang ở ngôn ngữ `en`, giá được quy
 * đổi sang USD theo tỷ giá cố định NEXT_PUBLIC_USD_RATE (env, bake lúc build)
 * và format kiểu Mỹ: 26.000đ ↔ $1.00. Client component dùng usePriceFormatter()
 * (lib/use-price.ts) để tự lấy locale; server component truyền `locale` từ
 * cookie NEXT_LOCALE qua props/pageContext.
 */
export interface FormatPriceOptions {
  /** ISO 4217 currency code. Defaults to VND. */
  currency?: string;
  /** 'vi' | 'en' hoặc BCP-47. `en` kích hoạt quy đổi VND→USD theo tỷ giá env. */
  locale?: string;
}

/** VND mỗi 1 USD — tỷ giá cố định cho demo, chỉnh qua env khi deploy. */
export const USD_RATE = Number(process.env.NEXT_PUBLIC_USD_RATE) || 26000;

const VND = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });
const USD = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function formatPrice(
  amount: number | null | undefined,
  opts?: FormatPriceOptions,
): string {
  const value = typeof amount === 'number' && Number.isFinite(amount) ? amount : 0;

  if (!opts || (!opts.currency && !opts.locale)) {
    // Fast path for the platform default (VND), keeps output identical to the
    // previous `toLocaleString('vi-VN')` calls: e.g. 1234567 -> "1.234.567đ".
    return `${VND.format(value)}đ`;
  }

  const locale = opts.locale ?? 'vi';

  if (!opts.currency) {
    // Chỉ đổi theo ngôn ngữ UI: en → USD (quy đổi), còn lại giữ VND.
    if (locale === 'en' || locale.startsWith('en-')) {
      return USD.format(value / USD_RATE);
    }
    return `${VND.format(value)}đ`;
  }

  // Explicit currency override (per-shop currency, nếu có sau này) — không quy đổi.
  return new Intl.NumberFormat(locale === 'vi' ? 'vi-VN' : locale, {
    style: 'currency',
    currency: opts.currency,
  }).format(value);
}
