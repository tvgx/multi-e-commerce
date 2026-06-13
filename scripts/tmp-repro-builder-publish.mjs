// Repro tạm: bấm "Xuất bản" trong dashboard builder và quan sát network/console.
// Run: node scripts/tmp-repro-builder-publish.mjs
import { PrismaClient } from '@prisma/client';
import { chromium } from 'playwright';

const prisma = new PrismaClient();
const stamp = Date.now();

// 1. Owner sign-up để lấy session cookie
const email = `repro-${stamp}@test.local`;
const res = await fetch('http://localhost:3000/api/auth/owner/sign-up/email', {
    method: 'POST',
    headers: { 'content-type': 'application/json', origin: 'http://localhost:3001' },
    body: JSON.stringify({ email, password: 'repro-pass-123', name: 'Repro Owner' }),
});
const setCookies = res.headers.getSetCookie?.() ?? [];
const json = await res.json();
const ownerId = json?.user?.id;
const sessionCookie = setCookies
    .map((c) => c.split(';')[0])
    .find((c) => c.includes('session_token'));
if (!ownerId || !sessionCookie) {
    console.error('Sign-up failed', res.status, json, setCookies);
    process.exit(1);
}
const [cookieName, ...rest] = sessionCookie.split('=');
const cookieValue = rest.join('=');
console.log(`owner=${ownerId} cookie=${cookieName}`);

// 2. Shop fixture (hoặc dùng shop có sẵn qua env SHOP_ID)
let shopId = process.env.SHOP_ID;
if (!shopId) {
    const shop = await prisma.shop.create({
        data: { name: `Repro Shop ${stamp}`, domain: `repro-${stamp}`, ownerId, status: 'ACTIVE' },
    });
    shopId = shop.id;
}
console.log(`shop=${shopId}`);

// 3. Browser
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1600, height: 900 } });
await ctx.addCookies([
    { name: cookieName, value: cookieValue, domain: 'localhost', path: '/' },
]);
const page = await ctx.newPage();

const apiRequests = [];
page.on('request', (r) => {
    if (r.url().includes(':3000/')) apiRequests.push(`${r.method()} ${r.url().replace('http://localhost:3000', '')}`);
});
page.on('response', (r) => {
    if (r.url().includes(':3000/') && r.status() >= 400)
        console.log(`  [API ${r.status()}] ${r.url().replace('http://localhost:3000', '')}`);
});
page.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning')
        console.log(`  [console.${m.type()}] ${m.text().slice(0, 300)}`);
});
page.on('pageerror', (e) => console.log(`  [pageerror] ${String(e).slice(0, 500)}`));

const url = `http://localhost:3001/dashboard/${shopId}/online-store/builder`;
console.log(`\n== goto ${url}`);
await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
console.log(`landed on: ${page.url()}`);

// Đợi builder load xong (nút Xuất bản xuất hiện)
const publishBtn = page.getByRole('button', { name: 'Xuất bản' });
await publishBtn.waitFor({ state: 'visible', timeout: 30000 });
console.log('publish button visible');

// Chuyển sang "Trang chi tiết sản phẩm" như user
try {
    await page.getByRole('button', { name: /Trang chủ|Trang danh sách|Trang chi tiết/ }).first().click();
    await page.getByRole('button', { name: 'Trang chi tiết sản phẩm' }).click();
    await page.waitForTimeout(1500);
    console.log('switched to product_detail page');
} catch (e) {
    console.log('page switch failed:', String(e).slice(0, 200));
}

apiRequests.length = 0;
console.log('\n== click "Xuất bản"');
await publishBtn.click();
await page.waitForTimeout(6000);

console.log(`\nAPI requests sau click (${apiRequests.length}):`);
for (const r of apiRequests) console.log('  ' + r);

const btnText = await publishBtn.textContent().catch(() => '(gone)');
console.log(`button text now: "${btnText?.trim()}"`);

// Toast hiện không?
const toasts = await page.locator('[class*="toast"], [role="status"], [role="alert"]').allTextContents().catch(() => []);
console.log('toasts:', JSON.stringify(toasts));

await page.screenshot({ path: '/tmp/repro-publish.png' });
console.log('screenshot: /tmp/repro-publish.png');

await browser.close();
await prisma.$disconnect();
