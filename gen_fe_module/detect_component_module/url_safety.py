"""
Chặn SSRF (server-side request forgery) khi server tự đi fetch 1 URL do người dùng nhập (xem
POST /detect-url trong server.py) — validate URL trước khi cho Playwright điều hướng tới, không
cho trỏ vào địa chỉ nội bộ/loopback/link-local (vd metadata endpoint cloud, service nội bộ như
MinIO/Postgres/Redis đang chạy trên chính máy/mạng nội bộ của dự án).

LƯU Ý GIỚI HẠN: hàm dưới đây phân giải DNS tại THỜI ĐIỂM validate rồi kiểm tra IP — vẫn còn khe hở
lý thuyết kiểu "DNS rebinding" (DNS trả về IP công khai lúc validate, rồi đổi sang IP nội bộ ngay
trước lúc Playwright thực sự kết nối). Đây là mức phòng thủ hợp lý cho 1 dự án nội bộ, không phải
phòng thủ tuyệt đối cho môi trường production nhiều người dùng không tin cậy.
"""
from __future__ import annotations

import ipaddress
import socket
from urllib.parse import urlparse

ALLOWED_SCHEMES = ("http", "https")


class UnsafeUrlError(ValueError):
    pass


def _is_unsafe_ip(ip: ipaddress.IPv4Address | ipaddress.IPv6Address) -> bool:
    return (
        ip.is_private
        or ip.is_loopback
        or ip.is_link_local
        or ip.is_reserved
        or ip.is_multicast
        or ip.is_unspecified
    )


def assert_safe_public_url(url: str) -> None:
    """Raise UnsafeUrlError nếu url không phải http(s) hoặc phân giải ra địa chỉ nội bộ/riêng tư."""
    parsed = urlparse(url)
    if parsed.scheme not in ALLOWED_SCHEMES:
        raise UnsafeUrlError(f"Chỉ chấp nhận URL http:// hoặc https:// (nhận được: {parsed.scheme!r})")

    hostname = parsed.hostname
    if not hostname:
        raise UnsafeUrlError("URL thiếu hostname")

    try:
        addr_infos = socket.getaddrinfo(hostname, None)
    except socket.gaierror as e:
        raise UnsafeUrlError(f"Không phân giải được hostname: {hostname}") from e

    if not addr_infos:
        raise UnsafeUrlError(f"Không phân giải được hostname: {hostname}")

    for _family, _type, _proto, _canonname, sockaddr in addr_infos:
        ip = ipaddress.ip_address(sockaddr[0])
        if _is_unsafe_ip(ip):
            raise UnsafeUrlError(
                f"URL trỏ vào địa chỉ nội bộ/riêng tư ({hostname} -> {ip}) — không được phép để tránh SSRF"
            )
