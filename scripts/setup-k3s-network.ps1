# ==========================================================
# setup-k3s-network.ps1
# Script cấu hình Port Forwarding + Firewall cho K3s trên WSL2
# CHẠY VỚI QUYỀN: PowerShell Administrator
# ==========================================================

Write-Host "======================================"
Write-Host "  K3s Network Setup Script           "
Write-Host "======================================"

# Lấy IP hiện tại của WSL2 (IP thay đổi mỗi lần restart)
$wslIP = (wsl hostname -I).Trim().Split(" ")[0]
Write-Host "WSL2 IP: $wslIP"

if (-not $wslIP) {
    Write-Host "❌ Không lấy được IP của WSL2. Hãy đảm bảo WSL2 đang chạy." -ForegroundColor Red
    exit 1
}

# Các port cần forward (thêm port tùy ý)
$ports = @(80, 443, 3000, 3100, 5432, 27017)

# Xóa mapping cũ trước (tránh conflict)
Write-Host "`n[1/3] Xóa port proxy cũ..."
foreach ($port in $ports) {
    netsh interface portproxy delete v4tov4 listenport=$port listenaddress=0.0.0.0 2>$null
}

# Thêm port proxy mới từ Windows → WSL2
Write-Host "[2/3] Thêm port proxy mới (Windows → WSL2 $wslIP)..."
foreach ($port in $ports) {
    netsh interface portproxy add v4tov4 `
        listenport=$port `
        listenaddress=0.0.0.0 `
        connectport=$port `
        connectaddress=$wslIP
    Write-Host "  ✅ Port ${port}: 0.0.0.0:${port} → ${wslIP}:${port}"
    
}

# Mở Windows Defender Firewall Inbound Rules
Write-Host "[3/3] Cấu hình Windows Firewall..."

# Xóa rule cũ nếu có
Remove-NetFirewallRule -DisplayName "K3s WSL2 Ports" -ErrorAction SilentlyContinue

# Thêm rule mới cho tất cả các port
New-NetFirewallRule `
    -DisplayName "K3s WSL2 Ports" `
    -Direction Inbound `
    -Protocol TCP `
    -LocalPort $ports `
    -Action Allow `
| Out-Null

Write-Host "  ✅ Firewall rule đã được tạo cho ports: $($ports -join ', ')"

# Hiển thị kết quả
Write-Host "`n======================================"
Write-Host "  ✅ Cấu hình hoàn tất!              "
Write-Host "======================================"
Write-Host ""
Write-Host "Danh sách Port Proxy hiện tại:"
netsh interface portproxy show all

$winIP = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notmatch "Loopback|WSL|vEthernet" } | Select-Object -First 1).IPAddress
Write-Host ""
Write-Host "Truy cập server từ mạng LAN: http://$winIP"
Write-Host ""
Write-Host "💡 Lưu ý: Chạy lại script này sau mỗi khi khởi động lại máy"
Write-Host "          hoặc restart WSL2 để cập nhật IP mới của WSL2."
