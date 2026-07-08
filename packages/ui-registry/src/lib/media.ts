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
