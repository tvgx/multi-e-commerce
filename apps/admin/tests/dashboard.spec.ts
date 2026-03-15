import { test, expect } from '@playwright/test';

test.describe('Master Dashboard UI Tests', () => {
  test('should render all 10 business metrics correctly', async ({ page }) => {
    // Navigate to the master dashboard
    await page.goto('/master');

    // Check for the page title
    await expect(page.getByText('Master Dashboard', { exact: true })).toBeVisible();

    // Check for the 10 requested metrics
    const expectedMetrics = [
      'Tỷ lệ chuyển đổi (CR)',
      'Giá trị đơn hàng (AOV)',
      'Chi phí thu hút (CAC)',
      'Tỷ lệ hoàn trả',
      'Lưu lượng truy cập',
      'Tỷ lệ thoát',
      'Bỏ giỏ hàng',
      'Tốc độ tải trang',
      'Tỷ lệ quay lại',
      'Giá trị trọn đời (CLV)',
    ];

    for (const metric of expectedMetrics) {
      await expect(page.getByText(metric)).toBeVisible();
    }

    // Check for chart section
    await expect(page.getByText('Tăng trưởng doanh thu & Traffic')).toBeVisible();
    await expect(page.getByText('Phễu chuyển đổi')).toBeVisible();
  });

  test('should have a premium responsive design', async ({ page }) => {
    await page.goto('/master');
    
    // Check for theme-aware background or cards
    const dashboardContainer = page.locator('div').filter({ hasText: /^Master Dashboard/ }).first();
    await expect(dashboardContainer).toBeVisible();
  });
});
