/**
 * Chụp khít từng component THẬT (từ @ecommerce/ui-registry, qua route /preview/[componentId] của
 * chính preview-app này) với props ngẫu nhiên (sinh từ FieldSchema trong component-schemas.ts —
 * đổi text/màu/số/lựa chọn mỗi lần chụp để model học đặc trưng thị giác chứ không học thuộc props
 * cụ thể nào), dùng làm dữ liệu train YOLO cho detect_component_module.
 *
 * Chạy (từ gen_fe_module/preview-app/, cần `npm run dev` đang chạy ở PORT bên dưới):
 *   npx tsx scripts/capture-crops.mts
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { ComponentSchemas } from "@ecommerce/ui-registry/src/component-schemas";
import { randomizeProps, randomizeBlocks, randomTheme } from "../src/lib/randomize.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.CAPTURE_PORT || "3210";
const SAMPLES_PER_COMPONENT = Number(process.env.CAPTURE_SAMPLES_PER_COMPONENT || 40);
const OUT_DIR = path.resolve(__dirname, "..", "..", "yolo_dataset", "raw_crops");
const MANIFEST_PATH = path.resolve(__dirname, "..", "..", "yolo_dataset", "manifest.json");
const VIEWPORT = { width: 1440, height: 900 };

// Chỉ chụp component type "section" — đây là ĐÚNG những gì có thể xuất hiện trực tiếp trong
// ShopPageLayoutSchema.components[] (1 trang được ghép từ nhiều section, xem packages/schema).
// component type "block" (HeaderMenuItem, SlideItem, FooterColumn, ProductCard*...) chỉ được
// thiết kế để render LỒNG bên trong section cha (Header/Carousel/Footer/FeaturedProducts) — thử
// render độc lập bị treo/lỗi (không tìm thấy DOM), và về mặt schema chúng cũng không tự đặt trực
// tiếp lên trang được nên không cần detect riêng.

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest: Array<{ componentId: string; type: string; category: string | null; path: string }> = [];

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: VIEWPORT });

  const componentIds = Object.entries(ComponentSchemas)
    .filter(([, schema]) => schema.type === "section")
    .map(([id]) => id);
  console.log(`${componentIds.length} component (type=section) sẽ chụp.`);

  for (const componentId of componentIds) {
    const schema = ComponentSchemas[componentId];
    const classDir = path.join(OUT_DIR, componentId);
    fs.mkdirSync(classDir, { recursive: true });

    let saved = 0;
    for (let i = 0; i < SAMPLES_PER_COMPONENT; i++) {
      try {
        const props = randomizeProps(schema);
        const blocks = randomizeBlocks(schema);
        if (blocks) props.blocks = blocks;
        const theme = Math.random() < 0.7 ? randomTheme() : {};

        const url =
          `http://localhost:${PORT}/preview/${encodeURIComponent(componentId)}` +
          `?props=${encodeURIComponent(JSON.stringify(props))}` +
          `&theme=${encodeURIComponent(JSON.stringify(theme))}`;

        await page.goto(url, { waitUntil: "networkidle", timeout: 20000 });

        const root = page.locator("#gfm-preview-root");
        // Ảnh mạng ngoài (picsum.photos) load chậm hơn networkidle đôi khi bắt được -> đợi thêm chút.
        await page.waitForTimeout(150);

        const box = await root.boundingBox();
        if (!box || box.width < 8 || box.height < 8) continue;

        const filePath = path.join(classDir, `${String(saved).padStart(3, "0")}.png`);
        await page.screenshot({ path: filePath, clip: box });
        manifest.push({
          componentId,
          type: schema.type,
          category: schema.category ?? null,
          path: path.relative(path.resolve(__dirname, "..", ".."), filePath).replace(/\\/g, "/"),
        });
        saved++;
      } catch (err) {
        if (saved === 0 && i === 0) {
          console.error(`  [${componentId}] mẫu đầu lỗi:`, (err as Error).message);
        }
      }
    }
    console.log(`${componentId} (${schema.type}): đã lưu ${saved}/${SAMPLES_PER_COMPONENT} ảnh`);
  }

  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
  console.log(`Tổng cộng: ${manifest.length} ảnh, manifest.json đã lưu tại ${MANIFEST_PATH}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
