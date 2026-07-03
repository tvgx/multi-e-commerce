/**
 * Static catalog that maps the thesis (đồ án) test-case codes to the real Jest
 * spec files, plus a small set of runnable HTTP scenarios for the "API" tab.
 *
 * Keyed by spec path relative to the api-core package root, using POSIX
 * separators (matches what the service emits via `toRel`). Scenario text is
 * lifted from §4.4 / Phụ lục D of the report so the UI can show the đồ án code
 * next to the real `it()` titles.
 */

export interface ThesisCode {
  code: string;
  scenario: string;
}

export interface ThesisFlow {
  flow: string;
  codes: ThesisCode[];
}

export const THESIS_CODES: Record<string, ThesisFlow> = {
  'src/modules/auth/auth.service.spec.ts': {
    flow: 'Auth',
    codes: [
      { code: 'AU1', scenario: 'Lấy phiên chủ cửa hàng hợp lệ → session owner' },
      { code: 'AU2', scenario: 'Xác minh phiên gặp lỗi → trả null' },
      { code: 'AU3', scenario: 'Ranh giới owner/customer → không lộ phiên owner' },
      { code: 'AU4', scenario: 'Lấy phiên khách mua hàng → ủy thác customerAuth' },
      { code: 'AU5', scenario: 'Đổi tên khi token không hợp lệ → 401 TOKEN_INVALID' },
      { code: 'AU6', scenario: 'Đổi tên trùng tên hiện tại → CHANGE_USERNAME_SAME' },
    ],
  },
  'src/modules/order/order.service.spec.ts': {
    flow: 'Order / Checkout',
    codes: [
      { code: 'OR1', scenario: 'Thiếu ngữ cảnh tenant → BadRequest' },
      { code: 'OR2', scenario: 'Không có lineItems và giỏ trống → 400' },
      { code: 'OR3', scenario: 'Giỏ có hàng → đặt hàng và xóa giỏ trong 1 giao dịch' },
      { code: 'OR4', scenario: 'Số lượng âm/không nguyên → 400' },
      { code: 'OR5', scenario: 'Biến thể sai / chưa xuất bản → 400, rollback' },
      { code: 'OR6', scenario: 'Chuyển khoản ngân hàng → đơn chờ + QR + token 24h' },
      { code: 'OR7', scenario: 'Trả bằng ví đủ số dư → đơn paid, trừ ví' },
      { code: 'OR8', scenario: 'Mã khuyến mãi % hợp lệ → giảm đúng, tăng lượt dùng' },
      { code: 'OR9', scenario: 'Khuyến mãi hết hạn / vượt lượt → 400' },
    ],
  },
  'src/modules/shop/shop.service.spec.ts': {
    flow: 'Shop / Build',
    codes: [
      { code: 'SB1', scenario: 'Tạo cửa hàng thiếu chủ sở hữu → BadRequest' },
      { code: 'SB2', scenario: 'Tạo cửa hàng hợp lệ → tạo DRAFT + xóa cache' },
      { code: 'SB3', scenario: 'Suy ra tiến độ onboarding = 6/6 khi đủ dữ liệu' },
    ],
  },
  'src/modules/build/build.service.spec.ts': {
    flow: 'Shop / Build',
    codes: [
      { code: 'SB4', scenario: 'Thiếu shopId / shop không tồn tại → BadRequest/NotFound' },
      { code: 'SB5', scenario: 'Bấm xuất bản nhiều lần → khử trùng lặp job RUNNING' },
      { code: 'SB6', scenario: 'Job treo >15 phút → FAILED + tạo job QUEUED mới' },
      { code: 'SB7', scenario: 'Chưa có job → tạo QUEUED, gọi queue.add một lần' },
    ],
  },
  'src/modules/inventory/inventory.service.spec.ts': {
    flow: 'Inventory',
    codes: [
      { code: 'IN1', scenario: 'Thiếu ngữ cảnh tenant → BadRequest' },
      { code: 'IN2', scenario: 'Tổng tồn kho trên nhiều điểm lưu trữ → cộng đúng' },
      { code: 'IN3', scenario: 'Tồn không đủ → lỗi Insufficient stock' },
      { code: 'IN4', scenario: 'Trừ kho có khóa → trừ đúng + ghi phiếu OUT' },
      { code: 'IN5', scenario: 'Kho mặc định hết → tràn sang kho khác' },
      { code: 'IN6', scenario: 'Đặt trước phần thiếu → ghi 1 backorder' },
    ],
  },
  'src/modules/cart/cart.service.spec.ts': {
    flow: 'Cart',
    codes: [
      { code: 'CA1', scenario: 'Lấy giỏ có hàng → subtotal/itemCount đúng' },
      { code: 'CA2', scenario: 'Lấy giỏ rỗng → subtotal 0, items []' },
      { code: 'CA3', scenario: 'Thêm số lượng < 1 / không nguyên → BadRequest' },
      { code: 'CA4', scenario: 'Thêm biến thể không hợp lệ → BadRequest' },
      { code: 'CA5', scenario: 'Thêm trùng biến thể → cộng dồn (upsert)' },
      { code: 'CA6', scenario: 'Cập nhật số lượng về 0 → xóa dòng hàng' },
    ],
  },
  'src/modules/payment/payment.service.spec.ts': {
    flow: 'Payment',
    codes: [
      { code: 'PM1', scenario: 'Tạo URL thanh toán cho đơn không tồn tại → NotFound' },
      { code: 'PM2', scenario: 'Tạo URL thanh toán hợp lệ → trả URL checkout' },
      { code: 'PM3', scenario: 'Token sai/đã dùng/hết hạn → từ chối, giữ balance_due' },
      { code: 'PM4', scenario: 'Xác nhận thanh toán → paid + realtime + email' },
      { code: 'PM5', scenario: 'Đơn đã bị timeout hủy → từ chối phục hồi' },
      { code: 'PM6', scenario: 'Từ chối thanh toán → hủy đơn (hoàn kho) + thông báo' },
    ],
  },
  'src/modules/layout/layout.service.spec.ts': {
    flow: 'Layout',
    codes: [
      { code: 'LA1', scenario: 'Truy cập bố cục thiếu tenant → BadRequest' },
      { code: 'LA2', scenario: 'Đọc bố cục lần đầu → tự khởi tạo rỗng' },
      { code: 'LA3', scenario: 'Lưu bản nháp → ghi đè draftData' },
      { code: 'LA4', scenario: 'Xuất bản khi chưa có nháp → lỗi No draft' },
      { code: 'LA5', scenario: 'Xuất bản khi có nháp → publishedData = draftData' },
      { code: 'LA6', scenario: 'Đọc bố cục công khai → trả publishedData / null' },
    ],
  },
  'src/modules/shipping/shipping.service.spec.ts': {
    flow: 'Shipping',
    codes: [
      { code: 'SH1', scenario: 'Đạt ngưỡng miễn phí vận chuyển → phí 0' },
      { code: 'SH2', scenario: 'Dưới ngưỡng / không ngưỡng → phí cơ bản' },
      { code: 'SH3', scenario: 'Phương thức không thuộc cửa hàng → NotFound' },
    ],
  },
  'src/modules/promotions/promotions.service.spec.ts': {
    flow: 'Promotion',
    codes: [
      { code: 'PR1', scenario: 'Tạo mã → viết hoa, từ chối trùng' },
      { code: 'PR2', scenario: 'Áp mã không hoạt động/không tồn tại → BadRequest' },
    ],
  },
  'src/modules/wallet/wallet.service.spec.ts': {
    flow: 'Wallet',
    codes: [
      { code: 'WA1', scenario: 'Nạp/trừ số tiền không dương → lỗi' },
      { code: 'WA2', scenario: 'Trừ ví khi số dư không đủ → Insufficient balance' },
      { code: 'WA3', scenario: 'Nạp ví → tạo giao dịch, ẩn token khỏi phản hồi' },
    ],
  },
  'src/modules/geo/geo.service.spec.ts': {
    flow: 'Geo',
    codes: [
      { code: 'GE1', scenario: 'Liệt kê tỉnh/thành → sắp theo name, {code,name}' },
      { code: 'GE2', scenario: 'Liệt kê phường thiếu provinceCode → BadRequest' },
    ],
  },
};

export interface HttpScenario {
  id: string;
  code?: string;
  title: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  /** Path including the global /api prefix, e.g. "/api/geo/provinces". */
  path: string;
  headers?: Record<string, string>;
  body?: unknown;
  expect: {
    status?: number;
    /** Dot/bracket path into the JSON body, e.g. "data.0.code". */
    jsonPath?: string;
    equals?: unknown;
  };
  /** When set, the scenario needs manual setup (auth/seed) before it will pass. */
  note?: string;
}

export const HTTP_SCENARIOS: HttpScenario[] = [
  {
    id: 'health',
    title: 'API health — GET /api',
    method: 'GET',
    path: '/api',
    expect: { status: 200 },
  },
  {
    id: 'ge1-provinces',
    code: 'GE1',
    title: 'Liệt kê tỉnh/thành — GET /api/geo/provinces',
    method: 'GET',
    path: '/api/geo/provinces',
    expect: { status: 200, jsonPath: 'data.0.code' },
  },
  {
    id: 'ge1-provinces-shape',
    code: 'GE1',
    title: 'Tỉnh/thành trả về đúng {code,name}',
    method: 'GET',
    path: '/api/geo/provinces',
    expect: { status: 200, jsonPath: 'data.0.name' },
  },
  {
    id: 'ge2-wards-template',
    code: 'GE2',
    title: 'Liệt kê phường theo tỉnh (template — sửa mã tỉnh)',
    method: 'GET',
    path: '/api/geo/provinces/01/wards',
    expect: { status: 200 },
    note: 'Đổi "01" thành mã tỉnh có thật. Bỏ mã (…/provinces//wards) để thử nhánh lỗi.',
  },
  {
    id: 'create-shop-template',
    code: 'SB2',
    title: 'Tạo cửa hàng (template — cần đăng nhập owner)',
    method: 'POST',
    path: '/api/shops',
    body: { name: 'Demo Shop', domain: 'demo-shop' },
    expect: { status: 201 },
    note: 'Cần cookie phiên owner. Chạy từ trình duyệt đã đăng nhập admin.',
  },
];
