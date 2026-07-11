import { useEffect, useState, type ChangeEvent, type CSSProperties, type FormEvent } from "react";
import {
  checkHealth,
  detectUpload,
  detectUrl,
  sampleTest,
  type BoxDict,
  type DetectUrlResponse,
  type DetectionDict,
  type ImageSize,
  type LayoutDict,
  type SampleTestResponse,
  type ScoreDict,
  type UIComponentRefDict,
} from "./api";
import { DetectionOverlay, type OverlayBox } from "./DetectionOverlay";

const DEFAULT_SERVER_URL = "http://localhost:8600";
const DEFAULT_PREVIEW_APP_URL = "http://localhost:3210";
const GT_COLOR = "#16a34a";
const PRED_COLOR = "#dc2626";

// Khớp đúng CURATED_THEMES trong gen_fe_module/preview-app/src/lib/themes.ts — 1 theme cố định
// cho cả trang xem thử (thay vì mỗi component tự random màu riêng, gây chỏi màu).
const PREVIEW_THEMES: { name: string; label: string }[] = [
  { name: "", label: "Ngẫu nhiên" },
  { name: "light", label: "Sáng tối giản" },
  { name: "dark", label: "Tối sang trọng" },
  { name: "ocean", label: "Ocean" },
  { name: "sunset", label: "Sunset" },
  { name: "forest", label: "Forest" },
  { name: "berry", label: "Berry" },
];

// Khớp đúng PageTypeEnum trong packages/schema/src/layout.schema.ts — gán vào layout.pageType
// trong response.
const PAGE_TYPES: { value: string; label: string }[] = [
  { value: "home", label: "Trang chủ" },
  { value: "product_listing", label: "Danh sách sản phẩm" },
  { value: "product_detail", label: "Chi tiết sản phẩm" },
  { value: "cart", label: "Giỏ hàng" },
  { value: "checkout", label: "Thanh toán" },
  { value: "search_results", label: "Kết quả tìm kiếm" },
  { value: "policy", label: "Chính sách" },
  { value: "terms", label: "Điều khoản" },
  { value: "about", label: "Giới thiệu" },
  { value: "contact", label: "Liên hệ" },
  { value: "custom_page", label: "Trang tuỳ chỉnh" },
];

// Header/Footer/AnnouncementBar KHÔNG thuộc riêng 1 trang nào — thật ra là component GLOBAL
// (ShopGlobalLayoutSchema.globalComponents, hiển thị chung quanh mọi trang, xem
// packages/schema/src/layout.schema.ts + apps/storefront/.../layout.tsx). Tách riêng khi detect
// được để không lẫn vào JSON của từng trang.
const GLOBAL_COMPONENT_IDS = new Set(["Header", "Footer", "AnnouncementBar"]);
// Thứ tự cố định lúc xuất globalComponents (Header luôn trên cùng, Footer luôn dưới cùng) — vì mỗi
// component global có thể lấy từ ảnh (trang) khác nhau, y_min giữa các ảnh không so sánh được.
const GLOBAL_ORDER: Record<string, number> = { AnnouncementBar: 0, Header: 1, Footer: 2 };
const GLOBAL_COLOR = "#7c3aed";

type TabId = "supervised" | "upload" | "url";

const TABS: { id: TabId; label: string }[] = [
  { id: "supervised", label: "1. Test có giám sát" },
  { id: "upload", label: "2. Tải ảnh lên" },
  { id: "url", label: "3. Nhập URL trang web" },
];

function toPredBoxes(detections: DetectionDict[]): OverlayBox[] {
  return detections.map((d) => ({
    box: d.box,
    label: `${d.group}.${d.component} ${(d.confidence * 100).toFixed(0)}%`,
    color: PRED_COLOR,
  }));
}

interface StoredPage {
  pageType: string;
  imageDataUrl: string;
  imageSize: ImageSize;
  detections: DetectionDict[];
}

interface GlobalCandidate {
  pageType: string;
  detection: DetectionDict;
  imageDataUrl: string;
  imageSize: ImageSize;
}

interface GlobalLayoutDict {
  shopId: string | null;
  theme: Record<string, unknown>;
  globalComponents: UIComponentRefDict[];
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error("Không đọc được file"));
    reader.readAsDataURL(file);
  });
}

/** Tách detection thành 2 nhóm: thuộc trang riêng (đưa vào JSON của trang) và thuộc global (đưa
 * vào JSON global riêng, xem GLOBAL_COMPONENT_IDS). */
function splitDetections(detections: DetectionDict[]): { pageDetections: DetectionDict[]; globalDetections: DetectionDict[] } {
  const pageDetections = detections.filter((d) => !GLOBAL_COMPONENT_IDS.has(d.component));
  const globalDetections = detections.filter((d) => GLOBAL_COMPONENT_IDS.has(d.component));
  return { pageDetections, globalDetections };
}

/** JSON hợp lệ ShopPageLayoutSchema cho 1 loại trang — CHỈ gồm component không phải global. */
function buildPageLayout(pageType: string, detections: DetectionDict[]): LayoutDict {
  const { pageDetections } = splitDetections(detections);
  const ordered = [...pageDetections].sort((a, b) => a.box.y_min - b.box.y_min);
  return {
    shopId: null,
    pageType,
    components: ordered.map((d, i) => ({
      id: crypto.randomUUID(),
      componentId: d.component,
      type: d.group || "section",
      props: {},
      order: i,
    })),
  };
}

/** JSON hợp lệ ShopGlobalLayoutSchema từ các global component đã CHỌN (mỗi componentId chỉ lấy
 * đúng 1 bản — bản người dùng chọn trong GlobalComponentsPanel, mặc định bản đầu tiên phát hiện). */
function buildGlobalLayout(candidates: Record<string, GlobalCandidate[]>, selected: Record<string, number>): GlobalLayoutDict {
  const chosen = Object.entries(candidates)
    .map(([componentId, list]) => {
      const c = list[selected[componentId] ?? 0];
      return c ? { componentId, group: c.detection.group } : null;
    })
    .filter((x): x is { componentId: string; group: string } => x !== null)
    .sort((a, b) => (GLOBAL_ORDER[a.componentId] ?? 99) - (GLOBAL_ORDER[b.componentId] ?? 99));

  return {
    shopId: null,
    theme: {},
    globalComponents: chosen.map((c, i) => ({
      id: crypto.randomUUID(),
      componentId: c.componentId,
      type: c.group || "section",
      props: {},
      order: i,
    })),
  };
}

/** Style crop 1 vùng box từ ảnh gốc (kỹ thuật background-position, khỏi cần canvas) — dùng làm
 * ảnh xem trước nhỏ cho từng candidate trong GlobalComponentsPanel. */
function cropThumbStyle(box: BoxDict, imageSize: ImageSize, imageDataUrl: string, maxW = 200, maxH = 120): CSSProperties {
  const boxW = Math.max(1, box.x_max - box.x_min);
  const boxH = Math.max(1, box.y_max - box.y_min);
  const scale = Math.min(maxW / boxW, maxH / boxH, 1);
  return {
    width: boxW * scale,
    height: boxH * scale,
    backgroundImage: `url(${imageDataUrl})`,
    backgroundSize: `${imageSize.width * scale}px ${imageSize.height * scale}px`,
    backgroundPosition: `-${box.x_min * scale}px -${box.y_min * scale}px`,
    backgroundRepeat: "no-repeat",
  };
}

function DetectionList({ detections }: { detections: DetectionDict[] }) {
  if (detections.length === 0) return <p className="detect-tab__empty">Không nhận diện được component nào.</p>;
  return (
    <ul className="detection-list">
      {detections.map((d, i) => (
        <li key={i}>
          <span className="detection-list__name">{d.group}.{d.component}</span>
          <span className="detection-list__conf">{(d.confidence * 100).toFixed(1)}%</span>
        </li>
      ))}
    </ul>
  );
}

function LayoutJsonPanel({
  layout,
  previewAppUrl,
  globalLayout,
}: {
  layout: LayoutDict;
  previewAppUrl: string;
  globalLayout?: GlobalLayoutDict;
}) {
  const [copied, setCopied] = useState(false);
  const [themeName, setThemeName] = useState("");
  const json = JSON.stringify(layout, null, 2);
  const globalCount = globalLayout?.globalComponents.length ?? 0;

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleViewAsPage() {
    let url = `${previewAppUrl}/render?layout=${encodeURIComponent(JSON.stringify(layout))}`;
    if (globalCount > 0) url += `&global=${encodeURIComponent(JSON.stringify(globalLayout))}`;
    if (themeName) url += `&theme=${encodeURIComponent(themeName)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <details className="layout-json-panel">
      <summary>
        JSON layout ({layout.components.length} component) — hợp lệ theo ShopPageLayoutSchema, dùng
        thẳng được cho builder/storefront thật
      </summary>
      <div className="layout-json-panel__actions">
        <button type="button" onClick={handleCopy} className="layout-json-panel__copy">
          {copied ? "Đã copy!" : "Copy JSON"}
        </button>
        <select
          value={themeName}
          onChange={(e) => setThemeName(e.target.value)}
          className="layout-json-panel__theme"
          aria-label="Theme cho trang xem thử"
        >
          {PREVIEW_THEMES.map((t) => (
            <option key={t.name} value={t.name}>{t.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleViewAsPage}
          disabled={layout.components.length === 0}
          className="layout-json-panel__view"
        >
          Xem thử trang web (nội dung ngẫu nhiên, màu theo theme{globalCount > 0 ? `, kèm ${globalCount} component global` : ""})
        </button>
      </div>
      <pre className="layout-json-panel__code">{json}</pre>
    </details>
  );
}

function GlobalComponentsPanel({
  candidates,
  selected,
  onSelect,
}: {
  candidates: Record<string, GlobalCandidate[]>;
  selected: Record<string, number>;
  onSelect: (componentId: string, index: number) => void;
}) {
  const [copied, setCopied] = useState(false);
  const componentIds = Object.keys(candidates).filter((id) => candidates[id].length > 0);
  if (componentIds.length === 0) return null;

  const globalLayout = buildGlobalLayout(candidates, selected);
  const json = JSON.stringify(globalLayout, null, 2);

  async function handleCopy() {
    await navigator.clipboard.writeText(json);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="global-panel">
      <h3 className="global-panel__title">Component global đã phát hiện</h3>
      <p className="detect-tab__desc">
        Header/Footer/AnnouncementBar hiển thị chung mọi trang (không thuộc riêng trang nào) — nếu
        phát hiện được từ nhiều ảnh khác nhau, chọn 1 bản để dùng làm global chính thức.
      </p>
      {componentIds.map((componentId) => (
        <div key={componentId} className="global-panel__group">
          <div className="global-panel__group-title">{componentId}</div>
          <div className="global-panel__candidates">
            {candidates[componentId].map((c, i) => (
              <label
                key={i}
                className={`global-panel__candidate${(selected[componentId] ?? 0) === i ? " selected" : ""}`}
              >
                <input
                  type="radio"
                  name={`global-${componentId}`}
                  checked={(selected[componentId] ?? 0) === i}
                  onChange={() => onSelect(componentId, i)}
                />
                <div className="global-panel__thumb" style={cropThumbStyle(c.detection.box, c.imageSize, c.imageDataUrl)} />
                <span className="global-panel__candidate-meta">
                  {c.pageType || "?"} · {(c.detection.confidence * 100).toFixed(0)}%
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
      <details className="layout-json-panel">
        <summary>
          JSON global ({globalLayout.globalComponents.length} component) — hợp lệ theo
          ShopGlobalLayoutSchema
        </summary>
        <div className="layout-json-panel__actions">
          <button type="button" onClick={handleCopy} className="layout-json-panel__copy">
            {copied ? "Đã copy!" : "Copy JSON"}
          </button>
        </div>
        <pre className="layout-json-panel__code">{json}</pre>
      </details>
    </div>
  );
}

function ScoreCard({ score }: { score: ScoreDict }) {
  const items: [string, string][] = [
    [`${(score.precision * 100).toFixed(1)}%`, "Precision"],
    [`${(score.recall * 100).toFixed(1)}%`, "Recall"],
    [`${(score.f1 * 100).toFixed(1)}%`, "F1"],
    [String(score.true_positives), "Đúng"],
    [String(score.false_positives), "Thừa (sai)"],
    [String(score.false_negatives), "Thiếu (bỏ sót)"],
  ];
  return (
    <div className="score-card">
      {items.map(([value, label]) => (
        <div key={label} className="score-card__item">
          <strong>{value}</strong>
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

interface SharedProps {
  serverUrl: string;
  confidenceThreshold: number;
  previewAppUrl: string;
  pageType: string;
}

function SupervisedTab({ serverUrl, confidenceThreshold, previewAppUrl, pageType }: SharedProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SampleTestResponse | null>(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      setResult(await sampleTest(serverUrl, confidenceThreshold, pageType));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  const boxes: OverlayBox[] = result
    ? [
        ...result.ground_truth.map((g) => ({ box: g.box, label: `${g.group}.${g.component}`, color: GT_COLOR })),
        ...toPredBoxes(result.detections),
      ]
    : [];

  return (
    <div className="detect-tab">
      <p className="detect-tab__desc">
        Sinh 1 ảnh "trang web giả" bằng cách ghép ngẫu nhiên nhiều component thật lên canvas — biết
        trước chính xác vị trí/loại từng component (khung <span style={{ color: GT_COLOR, fontWeight: 700 }}>xanh</span>),
        nên so được với kết quả model đoán (khung <span style={{ color: PRED_COLOR, fontWeight: 700 }}>đỏ</span>) để
        tính độ chính xác thật — 2 chế độ còn lại (ảnh chụp trang web thật) không biết trước đáp án
        nên không tính được điểm này.
      </p>
      <button type="button" onClick={handleGenerate} disabled={loading}>
        {loading ? "Đang sinh ảnh + phân tích..." : "Sinh ảnh test mới"}
      </button>
      {error && <p className="detect-tab__error">{error}</p>}
      {result && (
        <>
          <ScoreCard score={result.score} />
          <DetectionOverlay
            imageSrc={`data:image/png;base64,${result.image_base64}`}
            imageSize={result.image_size}
            boxes={boxes}
          />
          <LayoutJsonPanel layout={result.layout} previewAppUrl={previewAppUrl} />
        </>
      )}
    </div>
  );
}

function UploadTab({ serverUrl, confidenceThreshold, previewAppUrl, pageType }: SharedProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Mỗi loại trang lưu ảnh + kết quả detect RIÊNG (key = pageType đã suy luận/chọn) — đổi dropdown
  // "Loại trang" ở trên sẽ hiển thị lại đúng ảnh đã lưu cho loại đó, không cần tải lại.
  const [pages, setPages] = useState<Record<string, StoredPage>>({});
  const [activeViewKey, setActiveViewKey] = useState<string | null>(null);
  // Component global (Header/Footer/AnnouncementBar) gom lại RIÊNG, không thuộc trang nào — có thể
  // xuất hiện lặp lại ở nhiều ảnh khác nhau, người dùng chọn 1 bản làm chính thức.
  const [globalCandidates, setGlobalCandidates] = useState<Record<string, GlobalCandidate[]>>({});
  const [selectedGlobal, setSelectedGlobal] = useState<Record<string, number>>({});

  async function processFile(file: File) {
    setLoading(true);
    setError(null);
    try {
      const [dataUrl, result] = await Promise.all([
        fileToDataUrl(file),
        detectUpload(serverUrl, file, confidenceThreshold, pageType),
      ]);
      const resolvedPageType = result.layout.pageType || "home";

      setPages((prev) => ({
        ...prev,
        [resolvedPageType]: {
          pageType: resolvedPageType,
          imageDataUrl: dataUrl,
          imageSize: result.image_size,
          detections: result.detections,
        },
      }));
      setActiveViewKey(resolvedPageType);

      setGlobalCandidates((prev) => {
        const next = { ...prev };
        for (const componentId of GLOBAL_COMPONENT_IDS) {
          const best = result.detections
            .filter((d) => d.component === componentId)
            .sort((a, b) => b.confidence - a.confidence)[0];
          // Ảnh này upload lại cho cùng 1 loại trang -> thay candidate CŨ của chính trang đó, tránh
          // tích luỹ trùng lặp vô hạn mỗi lần test lại cùng 1 trang.
          const filtered = (next[componentId] ?? []).filter((c) => c.pageType !== resolvedPageType);
          next[componentId] = best
            ? [...filtered, { pageType: resolvedPageType, detection: best, imageDataUrl: dataUrl, imageSize: result.image_size }]
            : filtered;
        }
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  async function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  }

  useEffect(() => {
    function handlePaste(e: ClipboardEvent) {
      const item = Array.from(e.clipboardData?.items ?? []).find((i) => i.type.startsWith("image/"));
      const file = item?.getAsFile();
      if (!file) return;
      e.preventDefault();
      void processFile(file);
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [serverUrl, confidenceThreshold, pageType]);

  // Đổi dropdown "Loại trang" -> hiển thị lại ảnh đã lưu cho loại đó nếu có, không thì để trống
  // (không giữ ảnh của loại trang cũ đang xem dở, tránh hiểu nhầm).
  useEffect(() => {
    setActiveViewKey(pageType && pages[pageType] ? pageType : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chỉ muốn chạy khi đổi pageType, không phải mỗi khi pages thay đổi (processFile đã tự set activeViewKey sau khi upload xong)
  }, [pageType]);

  const currentPage = activeViewKey ? pages[activeViewKey] : null;
  const { pageDetections, globalDetections } = currentPage
    ? splitDetections(currentPage.detections)
    : { pageDetections: [] as DetectionDict[], globalDetections: [] as DetectionDict[] };
  const boxes: OverlayBox[] = currentPage
    ? [
        ...toPredBoxes(pageDetections),
        ...globalDetections.map((d) => ({
          box: d.box,
          label: `[GLOBAL] ${d.component} ${(d.confidence * 100).toFixed(0)}%`,
          color: GLOBAL_COLOR,
        })),
      ]
    : [];

  return (
    <div className="detect-tab">
      <p className="detect-tab__desc">
        Tải lên 1 ảnh chụp trang web bất kỳ (không có đáp án đúng để đối chiếu, chỉ xem model nhận
        diện được những component nào). Có thể chọn file hoặc <strong>dán ảnh từ clipboard bằng
        Ctrl+V</strong> (vd sau khi chụp màn hình). Chọn "Loại trang" ở trên trước khi tải lên để
        lưu ảnh riêng theo từng loại — đổi lại dropdown đó sẽ hiện lại đúng ảnh đã lưu.
      </p>
      <input type="file" accept="image/*" onChange={handleFileChange} disabled={loading} />
      {loading && <p>Đang phân tích...</p>}
      {error && <p className="detect-tab__error">{error}</p>}
      {pageType && !pages[pageType] && !loading && (
        <p className="detect-tab__empty">Chưa có ảnh nào lưu cho loại trang &quot;{pageType}&quot; — tải ảnh lên để lưu.</p>
      )}

      {currentPage && (
        <>
          <DetectionList detections={pageDetections} />
          <DetectionOverlay imageSrc={currentPage.imageDataUrl} imageSize={currentPage.imageSize} boxes={boxes} />
        </>
      )}

      <GlobalComponentsPanel
        candidates={globalCandidates}
        selected={selectedGlobal}
        onSelect={(componentId, index) => setSelectedGlobal((prev) => ({ ...prev, [componentId]: index }))}
      />

      {Object.keys(pages).length > 0 && (
        <div className="upload-tab__exports">
          <h3 className="global-panel__title">JSON từng loại trang đã lưu ({Object.keys(pages).length})</h3>
          {Object.values(pages).map((p) => (
            <div key={p.pageType} className="upload-tab__page-export">
              <div className="upload-tab__page-export-title">{p.pageType}</div>
              <LayoutJsonPanel
                layout={buildPageLayout(p.pageType, p.detections)}
                previewAppUrl={previewAppUrl}
                globalLayout={buildGlobalLayout(globalCandidates, selectedGlobal)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UrlTab({ serverUrl, confidenceThreshold, previewAppUrl, pageType }: SharedProps) {
  const [url, setUrl] = useState("https://example.com");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DetectUrlResponse | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      setResult(await detectUrl(serverUrl, url.trim(), confidenceThreshold, pageType));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lỗi không xác định");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="detect-tab">
      <p className="detect-tab__desc">
        Nhập link 1 trang web — server sẽ tự chụp ảnh trang đó (Playwright) rồi nhận diện component.
        Không có đáp án đúng để đối chiếu. Chỉ chấp nhận URL công khai (http/https, không phải địa
        chỉ nội bộ) — server tự chặn để tránh SSRF.
      </p>
      <form onSubmit={handleSubmit} className="detect-tab__url-form">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://..."
          required
          disabled={loading}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Đang chụp + phân tích..." : "Test"}
        </button>
      </form>
      {error && <p className="detect-tab__error">{error}</p>}
      {result && (
        <>
          <DetectionList detections={result.detections} />
          <DetectionOverlay
            imageSrc={`data:image/png;base64,${result.image_base64}`}
            imageSize={result.image_size}
            boxes={toPredBoxes(result.detections)}
          />
          <LayoutJsonPanel layout={result.layout} previewAppUrl={previewAppUrl} />
        </>
      )}
    </div>
  );
}

export function DetectTestApp() {
  const [serverUrl, setServerUrl] = useState(DEFAULT_SERVER_URL);
  const [previewAppUrl, setPreviewAppUrl] = useState(DEFAULT_PREVIEW_APP_URL);
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.25);
  const [pageType, setPageType] = useState("home");
  const [activeTab, setActiveTab] = useState<TabId>("supervised");
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  async function handleCheckHealth() {
    setHealthStatus("Đang kiểm tra...");
    try {
      const res = await checkHealth(serverUrl);
      setHealthStatus(`OK — backend=${res.backend}, device=${res.device}`);
    } catch (err) {
      setHealthStatus(`Lỗi: ${err instanceof Error ? err.message : "không kết nối được server"}`);
    }
  }

  const sharedProps: SharedProps = { serverUrl, confidenceThreshold, previewAppUrl, pageType };

  return (
    <div className="detect-test-shell">
      <header className="detect-test-header">
        <h1>Test detect_component_module</h1>
        <p>
          Cần chạy <code>python server.py</code> trong <code>gen_fe_module/</code> trước (xem{" "}
          <code>gen_fe_module/detect_component_module/README.md</code> để train YOLO trên component
          thật từ <code>@ecommerce/ui-registry</code>).
        </p>
        <div className="detect-test-config">
          <label>
            Server URL
            <input type="text" value={serverUrl} onChange={(e) => setServerUrl(e.target.value)} />
          </label>
          <label>
            Preview app URL
            <input type="text" value={previewAppUrl} onChange={(e) => setPreviewAppUrl(e.target.value)} />
          </label>
          <label>
            Ngưỡng tin cậy ({confidenceThreshold.toFixed(2)})
            <input
              type="range"
              min={0.05}
              max={0.95}
              step={0.05}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
            />
          </label>
          <label>
            Loại trang
            <select value={pageType} onChange={(e) => setPageType(e.target.value)}>
              {PAGE_TYPES.map((pt) => (
                <option key={pt.value} value={pt.value}>{pt.label}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={handleCheckHealth}>Kiểm tra kết nối</button>
          {healthStatus && <span className="detect-test-config__status">{healthStatus}</span>}
        </div>
        <nav className="detect-test-tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              className={tab.id === activeTab ? "active" : ""}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {activeTab === "supervised" && <SupervisedTab {...sharedProps} />}
      {activeTab === "upload" && <UploadTab {...sharedProps} />}
      {activeTab === "url" && <UrlTab {...sharedProps} />}
    </div>
  );
}
