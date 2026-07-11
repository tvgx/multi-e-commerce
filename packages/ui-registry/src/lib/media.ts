/**
 * Media/CDN URL helpers.
 *
 * Ảnh trong MinIO được phục vụ path-style qua CDN_BASE (`/<bucket>/<key>`).
 * NEXT_PUBLIC_CDN_URL được bake lúc build (CI build-arg) — local dev không set
 * thì rơi về MinIO localhost.
 */
export const CDN_BASE = (process.env.NEXT_PUBLIC_CDN_URL || 'http://localhost:9000').replace(/\/$/, '');

/** URL 1 file trong bucket `assets` (ảnh placeholder mặc định của platform). */
export const defaultAsset = (name: string) => `${CDN_BASE}/assets/${name}`;

/** Ảnh placeholder chung cho section chưa có ảnh. */
export const DEFAULT_IMG = defaultAsset('default-component.png');

/**
 * Placeholder cứng trong codebase (TODO 10): SVG khung xám + icon ảnh, encode
 * thành data-URI nên KHÔNG phụ thuộc CDN/mạng — dùng làm nền chờ ảnh load và
 * là nấc fallback cuối cùng khi cả src lẫn fallbackSrc đều hỏng.
 */
const PLACEHOLDER_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">' +
    '<rect width="800" height="600" fill="#e2e8f0"/>' +
    '<g fill="none" stroke="#94a3b8" stroke-width="14" stroke-linecap="round" stroke-linejoin="round">' +
    '<rect x="300" y="215" width="200" height="170" rx="14"/>' +
    '<path d="M318 355l52-52 44 44 34-34 34 34"/>' +
    '</g>' +
    '<circle cx="352" cy="265" r="16" fill="#94a3b8"/>' +
    '</svg>';

export const PLACEHOLDER_DATA_URI = `data:image/svg+xml,${encodeURIComponent(PLACEHOLDER_SVG)}`;
