import type { NextConfig } from "next";

/**
 * Harness Next.js độc lập, CHỈ để render component thật từ @ecommerce/ui-registry với dữ liệu
 * mẫu (không auth/không DB/không shop thật) — dùng cho detect_component_module chụp ảnh train +
 * cho gen_fe_module/app/detect-test.html gọi API detect. KHÔNG đụng vào apps/admin/apps/storefront
 * (production) — xem gen_fe_module/preview-app/README.md.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@ecommerce/ui-registry", "@ecommerce/i18n"],
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
