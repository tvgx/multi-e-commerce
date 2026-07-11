"""
Convert kết quả detect_component_module (danh sách Detection trên 1 ảnh trang web) thành JSON
HỢP LỆ theo packages/schema/src/layout.schema.ts (UIComponentRef / ShopPageLayoutSchema) — nạp
thẳng được vào builder/storefront thật vì componentId ở đây LÀ đúng tên component thật trong
packages/ui-registry (detect_component_module bản YOLO được train trực tiếp trên chính các
component đó qua gen_fe_module/preview-app, không qua bước ánh xạ nào).

Lưu ý: `props` của mỗi section trong JSON xuất ra luôn rỗng — detect chỉ biết LOẠI + VỊ TRÍ
component trên ảnh, không đọc lại được nội dung/màu sắc thật (title, ảnh nền, màu nút...) của
section đó trên trang gốc. JSON này phù hợp làm khung layout để chỉnh tiếp trong builder (đã đúng
thứ tự + đúng loại section), không phải bản sao y hệt trang gốc.
"""
from __future__ import annotations

import uuid
from typing import Optional, Sequence

from .types import Detection

# Component "Standard*" LÀ cả 1 trang hoàn chỉnh (category/product-detail/checkout/profile), không
# phải section ghép chung với section khác — có mặt trong detection là tín hiệu rất mạnh xác định
# đúng loại trang (khớp PageTypeEnum trong packages/schema/src/layout.schema.ts). StandardProfile
# không có PageType tương ứng trực tiếp -> map về 'custom_page' (không phải trang marketing chung).
_PAGE_TYPE_BY_COMPONENT: dict[str, str] = {
    "StandardCategoryPage": "product_listing",
    "StandardProductDetail": "product_detail",
    "StandardCheckout": "checkout",
    "StandardProfile": "custom_page",
}


def infer_page_type(detections: Sequence[Detection]) -> str:
    """Đoán `pageType` từ các component "Standard*" đã detect được (xem _PAGE_TYPE_BY_COMPONENT).
    Không có tín hiệu nào (chỉ toàn section marketing chung như Hero/FeaturedProducts/Header/Footer)
    thì mặc định "home" — cấu trúc trang phổ biến nhất khi không có 1 "mega section" đặc thù nào.
    """
    for det in detections:
        page_type = _PAGE_TYPE_BY_COMPONENT.get(det.component)
        if page_type:
            return page_type
    return "home"


def detections_to_layout(
    detections: Sequence[Detection],
    page_type: Optional[str] = None,
    shop_id: Optional[str] = None,
) -> dict:
    """Sắp theo vị trí trên->dưới (y_min tăng dần, đúng thứ tự section thật xuất hiện trên trang)
    rồi build thành {shopId, pageType, components: UIComponentRef[]} — đúng ShopPageLayoutSchema.

    page_type: truyền vào nếu ĐÃ BIẾT CHẮC (vd người dùng tự chọn) — bỏ trống (None) để tự suy luận
    qua infer_page_type() dựa vào chính các component đã detect được.
    """
    resolved_page_type = page_type or infer_page_type(detections)
    ordered = sorted(detections, key=lambda d: d.box.y_min)
    components = [
        {
            "id": str(uuid.uuid4()),
            "componentId": det.component,
            "type": det.group or "section",
            "props": {},
            "order": order,
        }
        for order, det in enumerate(ordered)
    ]
    return {
        "shopId": shop_id,
        "pageType": resolved_page_type,
        "components": components,
    }
