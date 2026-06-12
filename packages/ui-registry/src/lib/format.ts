/**
 * Centralized money formatting for the whole platform.
 *
 * Before this helper, prices were formatted ad-hoc in ~60 call sites with three
 * incompatible styles: `$${n.toFixed(2)}` (USD), `n.toLocaleString('vi-VN') + 'đ'`,
 * and a locale-less `n.toLocaleString() + 'đ'` (wrong grouping). This is the single
 * source of truth — default is Vietnamese đồng (no minor units).
 *
 * Pass `opts` later if/when per-shop currency is wired up.
 */
export interface FormatPriceOptions {
  /** ISO 4217 currency code. Defaults to VND. */
  currency?: string;
  /** BCP-47 locale. Defaults to vi-VN. */
  locale?: string;
}

const VND = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

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

  const locale = opts.locale ?? 'vi-VN';
  const currency = opts.currency ?? 'VND';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}
