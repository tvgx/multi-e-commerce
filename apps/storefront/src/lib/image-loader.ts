import { ImageLoaderProps } from 'next/image';

const PROXY_URL = process.env.NEXT_PUBLIC_IMAGE_PROXY_URL || 'http://localhost:8080';

/**
 * Custom loader cho Next.js Image sử dụng imgproxy.
 * Giúp tự động resize và tối ưu ảnh on-the-fly.
 */
export const imgproxyLoader = ({ src, width, quality }: ImageLoaderProps) => {
  // Nếu src là đường dẫn cục bộ (không có http), không dùng proxy
  if (!src.startsWith('http')) {
    return src;
  }

  // Cấu hình imgproxy: resize fit chiều rộng, giữ nguyên tỷ lệ, chất lượng quality
  // Cú pháp: /unsafe/rs:fit:{width}:0/q:{quality}/plain/{url}
  return `${PROXY_URL}/unsafe/rs:fit:${width}:0/q:${quality || 80}/plain/${src}`;
};
