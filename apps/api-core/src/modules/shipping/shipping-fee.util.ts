/**
 * Phí ship của một phương thức theo subtotal (áp dụng ngưỡng freeship nếu có).
 *
 * Tách khỏi ShippingService để OrderService dùng được mà không phải import
 * ShippingService — vì ShippingService inject OrderService (voidOrder), import
 * ngược lại sẽ tạo vòng phụ thuộc khiến Nest không resolve được DI.
 */
export function computeShippingFee(
  method: { baseFee: number; freeThreshold: number | null },
  subtotal: number,
): number {
  if (method.freeThreshold != null && subtotal >= method.freeThreshold) return 0;
  return method.baseFee;
}
