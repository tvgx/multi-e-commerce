/**
 * Helper to build an optimized image URL using imgproxy
 * @param originalUrl The original image URL (e.g. from MinIO)
 * @param width Optional width to resize to
 * @param height Optional height to resize to
 * @param quality Optional quality (1-100, default 80)
 * @param format Optional format (webp, avif, png, default webp)
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  width?: number,
  height?: number,
  quality: number = 80,
  format: 'webp' | 'avif' | 'png' | 'jpeg' = 'webp',
): string {
  if (!originalUrl) return '';

  const imgproxyUrl = process.env.IMGPROXY_URL || 'http://localhost:8080';

  // Base64 encode the original URL (using url-safe base64 is recommended by imgproxy)
  let encodedUrl: string;
  try {
    encodedUrl = Buffer.from(originalUrl)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    encodedUrl = encodeURIComponent(originalUrl);
  }

  // Construct options
  const options: string[] = [];
  if (width || height) {
    options.push(`rs:fill:${width || 0}:${height || 0}:0`);
  }
  options.push(`q:${quality}`);

  const optionsStr = options.length > 0 ? options.join('/') : 'raw';

  // Format is: /{signature}/{options}/{encoded_url}.{extension}
  return `${imgproxyUrl}/insecure/${optionsStr}/${encodedUrl}.${format}`;
}
