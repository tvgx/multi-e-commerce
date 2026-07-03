import * as QRCode from 'qrcode';

/**
 * Sinh QR (data-URI PNG) trỏ tới một URL xác nhận thanh toán.
 *
 * Đây là "công cụ sinh QR" dùng chung của nền tảng: order checkout
 * (order.service) và platform billing (billing.service) cùng gọi hàm này với
 * confirm URL tương ứng. QR chỉ mã hoá URL — người dùng quét bằng điện thoại,
 * mở trang xác nhận và tự xác nhận đã chuyển khoản (self-attested, không tích
 * hợp cổng ngân hàng).
 */
export function generateConfirmQr(confirmUrl: string): Promise<string> {
  return QRCode.toDataURL(confirmUrl);
}
