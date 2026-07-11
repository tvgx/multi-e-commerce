/** Client gọi detect_component_module/server.py (Python, chạy riêng — xem ../../../server.py). */

export interface BoxDict {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface ImageSize {
  width: number;
  height: number;
}

export interface DetectionDict {
  group: string;
  component: string;
  variant: string | null;
  confidence: number;
  box: BoxDict;
}

export interface GroundTruthDict {
  group: string;
  component: string;
  box: BoxDict;
}

export interface ScoreDict {
  true_positives: number;
  false_positives: number;
  false_negatives: number;
  precision: number;
  recall: number;
  f1: number;
}

export interface UIComponentRefDict {
  id: string;
  componentId: string;
  type: string;
  props: Record<string, unknown>;
  order: number;
}

/** JSON hợp lệ theo packages/schema/src/layout.schema.ts (ShopPageLayoutSchema) — componentId
 * khớp đúng tên thật trong packages/ui-registry (backend yolo), dùng thẳng được trong builder. */
export interface LayoutDict {
  shopId: string | null;
  pageType: string;
  components: UIComponentRefDict[];
}

export interface DetectResponse {
  count: number;
  image_size: ImageSize;
  detections: DetectionDict[];
  layout: LayoutDict;
}

export interface DetectUrlResponse extends DetectResponse {
  image_base64: string;
}

export interface SampleTestResponse {
  image_base64: string;
  image_size: ImageSize;
  ground_truth: GroundTruthDict[];
  detections: DetectionDict[];
  score: ScoreDict;
  layout: LayoutDict;
}

async function parseJsonOrThrow<T>(res: Response): Promise<T> {
  let data: unknown;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Server trả về phản hồi không phải JSON (HTTP ${res.status})`);
  }
  if (!res.ok) {
    const message = typeof data === "object" && data && "error" in data ? String((data as { error: unknown }).error) : `HTTP ${res.status}`;
    throw new Error(message);
  }
  return data as T;
}

function pageTypeQuery(pageType: string): string {
  return pageType ? `&page_type=${encodeURIComponent(pageType)}` : "";
}

/** Chế độ "Tải ảnh lên" — POST /detect, body là bytes ảnh thô. */
export async function detectUpload(serverUrl: string, file: Blob, confidenceThreshold: number, pageType: string): Promise<DetectResponse> {
  const res = await fetch(`${serverUrl}/detect?confidence_threshold=${confidenceThreshold}${pageTypeQuery(pageType)}`, {
    method: "POST",
    body: file,
  });
  return parseJsonOrThrow<DetectResponse>(res);
}

/** Chế độ "Nhập URL" — POST /detect-url, server tự chụp ảnh trang rồi detect. */
export async function detectUrl(serverUrl: string, url: string, confidenceThreshold: number, pageType: string): Promise<DetectUrlResponse> {
  const res = await fetch(`${serverUrl}/detect-url?confidence_threshold=${confidenceThreshold}${pageTypeQuery(pageType)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return parseJsonOrThrow<DetectUrlResponse>(res);
}

/** Chế độ "Test có giám sát" — GET /sample-test, trả kèm ground-truth + điểm chính xác. */
export async function sampleTest(serverUrl: string, confidenceThreshold: number, pageType: string): Promise<SampleTestResponse> {
  const res = await fetch(`${serverUrl}/sample-test?confidence_threshold=${confidenceThreshold}${pageTypeQuery(pageType)}`);
  return parseJsonOrThrow<SampleTestResponse>(res);
}

export async function checkHealth(serverUrl: string): Promise<{ status: string; backend: string; device: string }> {
  const res = await fetch(`${serverUrl}/health`);
  return parseJsonOrThrow(res);
}
