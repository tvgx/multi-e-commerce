import { registry } from "@ecommerce/ui-registry";
import { pageContextFor } from "@/lib/sample-data";
import { themeStyleFor } from "@/lib/theme-style";

interface PageProps {
  params: Promise<{ componentId: string }>;
  searchParams: Promise<{ props?: string; theme?: string }>;
}

function parseJsonParam(raw: string | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Render 1 component thật (từ @ecommerce/ui-registry) với props tuỳ ý truyền qua query string —
 * dùng bởi script chụp crop train YOLO (xem ../../../capture-crops.mjs) và có thể dùng thủ công
 * để xem trước 1 component: /preview/Hero?props={"title":"Xin chào"}&theme={"primaryColor":"#111"}
 *
 * KHÔNG phải trang sản phẩm — chỉ để chụp ảnh cô lập từng component, không có Header/Footer/layout
 * bao ngoài (giữ nguyên background trang để dễ crop khít).
 */
export default async function PreviewComponentPage({ params, searchParams }: PageProps) {
  const { componentId } = await params;
  const { props: propsRaw, theme: themeRaw } = await searchParams;

  const Component = registry[componentId];
  if (!Component) {
    return (
      <div style={{ padding: 24, color: "#b91c1c", fontFamily: "monospace" }}>
        Unknown componentId: {componentId}
      </div>
    );
  }

  const props = parseJsonParam(propsRaw);
  const theme = parseJsonParam(themeRaw) as Record<string, string>;
  const pageContext = pageContextFor(componentId);

  const themeStyle = themeStyleFor(theme);

  return (
    <div id="gfm-preview-root" style={themeStyle}>
      <Component {...pageContext} {...props} previewMode blocks={props.blocks ?? []} />
    </div>
  );
}
