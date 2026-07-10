import type { MetadataRoute } from "next";

/**
 * Admin là trang quản trị nội bộ (phải đăng nhập) → chặn toàn bộ crawler.
 * Kết hợp với `robots: { index: false }` ở layout.tsx và header X-Robots-Tag
 * ở next.config.ts để phủ cả HTML lẫn asset.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
