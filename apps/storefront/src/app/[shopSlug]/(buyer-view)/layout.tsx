import { getShopBootstrapData, getShopCategories, getMyProfile } from '@/lib/api/storefront.api';
import { metaText } from '@/lib/seo';
import type { Metadata } from 'next';
import React from 'react';
import { CartInitializer } from '@ecommerce/ui-registry/src/components/cart/CartInitializer';
import { CartSidebar } from '@ecommerce/ui-registry/src/components/cart/CartSidebar';
import { CartTrigger } from '@ecommerce/ui-registry/src/components/cart/CartTrigger';
import { SearchBar } from '@ecommerce/ui-registry/src/components/products/SearchBar';
import { DynamicRenderer } from '@/lib/layout/dynamic-loader';
import { NotificationToast } from '@/components/NotificationToast';
import { getCustomerSession, getCustomerData } from '@/app/actions/auth.actions';
import { StorefrontPreviewProvider } from '@/components/preview/StorefrontPreviewProvider';
import { DynamicGlobalHeader } from '@/components/preview/DynamicGlobalHeader';
import { DynamicGlobalFooter } from '@/components/preview/DynamicGlobalFooter';
import { DynamicPageContent } from '@/components/preview/DynamicPageContent';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ChatWidget } from '@ecommerce/ui-registry/src/components/chat/ChatWidget';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { SmartImage } from '@ecommerce/ui-registry/src/components/blocks/SmartImage';
import { AnnouncementBar } from '@ecommerce/ui-registry/src/components/sections/header/AnnouncementBar';
import { SocialLinks } from '@/components/SocialLinks';
import { getT } from '@/lib/i18n';
import { VisitTracker } from '@/components/VisitTracker';
import { ShopQuickNav } from '@/components/ShopQuickNav';
import { User } from 'lucide-react';

interface Props {
    children: React.ReactNode;
    params: Promise<{ shopSlug: string }>;
}

// Per-shop SEO defaults driven by the merchant's Setup (name, theme logo/favicon,
// announcement). Reuses the cached bootstrap fetch, so no extra round-trip.
// Canonical is intentionally NOT set here — it must be per-page, so each page's
// own generateMetadata declares its canonical URL.
export async function generateMetadata({ params }: { params: Promise<{ shopSlug: string }> }): Promise<Metadata> {
    const { shopSlug } = await params;
    const bootstrap = await getShopBootstrapData(shopSlug);
    const shop = bootstrap?.shop;
    const theme = bootstrap?.globalLayout?.theme || {};
    const name = shop?.name || shopSlug;
    const description = metaText(
        theme.metaDescription ||
        theme.announcementText ||
        `Mua sắm trực tuyến tại ${name}. Sản phẩm chính hãng, thanh toán an toàn, giao hàng tận nơi.`,
    );
    const image = theme.logoUrl || theme.faviconUrl || undefined;
    const faviconUrl = theme.faviconUrl;

    // Home-page title needs to be more than the bare shop slug ("demo") — a
    // one-word title is flagged as too short and hurts ranking. Append the
    // merchant tagline (Setup) or a sensible default, clamped so it stays within
    // the ~60-char pixel budget search engines render.
    const tagline = metaText(theme.metaTitleSuffix || theme.tagline || 'Mua sắm trực tuyến chính hãng', 48);
    const homeTitle = `${name} — ${tagline}`;

    return {
        // `default` shows on the home page; `template` appends the shop name to
        // every child page title (e.g. "Áo thun · MyShop").
        title: { default: homeTitle, template: `%s · ${name}` },
        description,
        applicationName: name,
        robots: { index: true, follow: true },
        openGraph: {
            type: 'website',
            siteName: name,
            title: name,
            description,
            ...(image ? { images: [{ url: image, alt: name }] } : {}),
        },
        twitter: {
            card: image ? 'summary_large_image' : 'summary',
            title: name,
            description,
            ...(image ? { images: [image] } : {}),
        },
        ...(faviconUrl ? { icons: { icon: faviconUrl } } : {}),
    };
}

export default async function BuyerLayout({ children, params }: Props) {
    const { shopSlug } = await params;

    // These are independent — run them in parallel instead of serially
    // (this layout runs on every storefront page view).
    const [token, customerData, bootstrapData, categories, t, ts] = await Promise.all([
        getCustomerSession(shopSlug),
        getCustomerData(shopSlug),
        getShopBootstrapData(shopSlug),
        getShopCategories(shopSlug),
        getT('common'),
        getT('shop'),
    ]);
    const customerId = customerData?.sub || customerData?.id;
    // TODO 16: tên user cho header. Token mới có claim `name`; token cũ (trước
    // khi thêm claim) fallback gọi /me một lần cho phiên đăng nhập đó.
    let customerName: string | null = customerData?.name || null;
    if (customerId && !customerName && token) {
        customerName = (await getMyProfile(shopSlug, token))?.name || null;
    }

    const shopInfo = bootstrapData?.shop;
    const globalLayout = bootstrapData?.globalLayout;
    const mainMenu = bootstrapData?.navigation?.mainMenu;
    const footerMenu = bootstrapData?.navigation?.footerMenu;

    const shopName = shopInfo?.name || shopSlug.toUpperCase();
    const globalComponents = globalLayout?.globalComponents || [];

    // Merchant theme → CSS variables consumed by the storefront (and bridged to
    // Tailwind `brand`/`button` utilities in globals.css). Every value falls
    // back to the previous emerald/light defaults so un-themed shops are
    // unchanged. `bodyFont`/`headingFont` are the new Setup fields; `fontFamily`
    // is the legacy single-font field kept for backward compatibility.
    const theme = globalLayout?.theme || {};
    const bodyFont = theme.bodyFont || theme.fontFamily || 'Inter, sans-serif';
    const themeStyle = {
        '--theme-primary': theme.primaryColor || '#059669',
        '--theme-bg': theme.backgroundColor || '#ffffff',
        '--theme-text': theme.textColor || '#111111',
        '--theme-button': theme.buttonColor || theme.primaryColor || '#059669',
        '--theme-button-text': theme.buttonTextColor || '#ffffff',
        '--theme-heading-font': theme.headingFont || bodyFont,
        '--theme-body-font': bodyFont,
        fontFamily: bodyFont,
        // Nền trang đổi theo theme (Setup > Màu nền) thay vì trắng cố định.
        backgroundColor: 'var(--theme-bg)',
    } as React.CSSProperties;

    const announcementText = (theme.announcementText || '').trim();

    return (
        <StorefrontPreviewProvider>
            <div
                className="flex flex-col min-h-screen storefront-layout-wrapper"
            style={themeStyle}
        >
            <CartInitializer shopSlug={shopSlug} />
            {shopInfo?.id && <VisitTracker shopId={shopInfo.id} customerId={customerId} />}
            <CartSidebar />
            <NotificationToast token={token ?? undefined} />

            {/* ── Announcement bar (theme.announcementText, ẩn khi rỗng) ── */}
            {announcementText && (
                <AnnouncementBar
                    text={announcementText}
                    basePath={`/${shopSlug}`}
                    backgroundColor={theme.primaryColor || '#059669'}
                    textColor={theme.buttonTextColor || '#ffffff'}
                />
            )}

            {/* ── Global Header (Dynamic) or Fallback ── */}
            <DynamicGlobalHeader initialComponents={globalComponents}>
            {globalComponents.length > 0 ? (
                <ErrorBoundary componentName="GlobalHeader">
                    {/* Header builder-driven cần context thật: danh mục cho dropdown,
                        user đăng nhập cho label tài khoản, basePath cho link nội bộ. */}
                    <DynamicRenderer
                        components={globalComponents.filter((c: any) => c.componentId.toLowerCase().includes('header'))}
                        pageContext={{
                            basePath: `/${shopSlug}`,
                            categories,
                            customerId,
                            customerName,
                        }}
                    />
                </ErrorBoundary>
            ) : (
                <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white shadow-sm">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <a href={`/${shopSlug}`} className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:opacity-80 transition-opacity">
                            {shopInfo?.logoUrl ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <SmartImage src={shopInfo.logoUrl} alt={shopName} className="h-8 w-auto object-contain" sizes="200px" priority />
                            ) : (
                                <span>{shopName}</span>
                            )}
                        </a>

                        <SearchBar />

                        <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
                            {/* Nav cố định (TODO 15): luôn đủ link các page chính */}
                            <a href={`/${shopSlug}/all-products`} className="hidden md:inline hover:text-brand transition-colors">
                                {ts('header.allProducts')}
                            </a>
                            {categories.length > 0 && (
                                <div className="relative group hidden md:block">
                                    <span className="cursor-default hover:text-brand transition-colors inline-flex items-center gap-1">
                                        {ts('header.categories')} <span className="text-[10px]">▾</span>
                                    </span>
                                    <div className="absolute left-0 top-full pt-2 hidden group-hover:block z-50">
                                        <div className="min-w-[200px] max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg py-2">
                                            {categories.map((c: any) => (
                                                <a
                                                    key={c.id}
                                                    href={`/${shopSlug}/all-products?category=${encodeURIComponent(c.id)}`}
                                                    className="block px-4 py-2 text-sm hover:bg-slate-50 hover:text-brand transition-colors"
                                                >
                                                    {c.name}
                                                </a>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                            <a href={`/${shopSlug}/wishlist`} className="hidden md:inline hover:text-brand transition-colors">
                                {ts('header.wishlist')}
                            </a>
                            {mainMenu?.items?.map((item: any, idx: number) => (
                                <a key={idx} href={`/${shopSlug}${item.url}`} className="hidden lg:inline hover:text-brand transition-colors">
                                    {item.title}
                                </a>
                            ))}
                            <div className="mx-2 w-px h-4 bg-slate-200"></div>
                            <a
                                href={customerId ? `/${shopSlug}/profile` : `/${shopSlug}/account/login`}
                                className="flex items-center gap-1.5 hover:text-brand transition-colors"
                                title={customerId ? (customerName || ts('header.account')) : ts('header.login')}
                            >
                                <User className="h-4 w-4" />
                                {/* TODO 16: hiển thị tên user khi đã đăng nhập */}
                                <span className="max-w-[140px] truncate">
                                    {customerId ? (customerName || ts('header.account')) : ts('header.login')}
                                </span>
                            </a>
                            <LanguageSwitcher />
                            <CartTrigger />
                        </nav>
                    </div>
                </header>
            )}
            </DynamicGlobalHeader>

            {/* ── Main Content ── */}
            <main className="flex-1">
                <ErrorBoundary componentName="PageContent">
                    <DynamicPageContent>
                        {children}
                    </DynamicPageContent>
                </ErrorBoundary>
            </main>

            {/* ── Global Footer (Dynamic) or Fallback ── */}
            <DynamicGlobalFooter initialComponents={globalComponents}>
            {globalComponents.length > 0 ? (
                <ErrorBoundary componentName="GlobalFooter">
                    <DynamicRenderer components={globalComponents.filter((c: any) => c.componentId.toLowerCase().includes('footer'))} />
                    {/* Social/contact từ theme.social (Setup > Liên hệ) */}
                    <div className="border-t border-slate-200/60 py-4">
                        <div className="container mx-auto px-4 flex justify-center">
                            <SocialLinks social={theme.social} />
                        </div>
                    </div>
                </ErrorBoundary>
            ) : (
                <footer className="border-t border-slate-200 py-12 mt-20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-wrap justify-between gap-8 mb-8">
                            <div className="max-w-xs">
                                <h3 className="font-bold text-slate-800 mb-4">{shopName}</h3>
                                <p className="text-slate-500 text-sm">{t('footer.poweredBy')}</p>
                                <SocialLinks social={theme.social} className="mt-4 text-slate-600" />
                            </div>
                            <div className="flex gap-12">
                                {footerMenu?.items && (
                                    <div>
                                        <h4 className="text-xs font-bold uppercase text-slate-400 mb-4">{t('footer.links')}</h4>
                                        <ul className="space-y-2">
                                            {footerMenu.items.map((item: any, idx: number) => (
                                                <li key={idx}>
                                                    <a href={`/${shopSlug}${item.url}`} className="text-sm text-slate-600 hover:text-brand">
                                                        {item.title}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="pt-8 border-t border-slate-100 text-center text-slate-500 text-xs">
                            &copy; {new Date().getFullYear()} {shopName}. {t('footer.rightsReserved')}
                        </div>
                    </div>
                </footer>
            )}
            </DynamicGlobalFooter>

            {shopInfo?.id && (
                <ChatWidget shopId={shopInfo.id} customerId={customerId} />
            )}

            {/* Điều hướng nổi — luôn có mặt dù shop chưa thiết kế Header/section nào */}
            <ShopQuickNav shopSlug={shopSlug} loggedIn={!!customerId} />
        </div>
        </StorefrontPreviewProvider>
    );
}
