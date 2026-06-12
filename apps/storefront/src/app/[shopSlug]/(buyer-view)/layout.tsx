import { getShopBootstrapData } from '@/lib/api/storefront.api';
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
import { getT } from '@/lib/i18n';

interface Props {
    children: React.ReactNode;
    params: Promise<{ shopSlug: string }>;
}

export default async function BuyerLayout({ children, params }: Props) {
    const { shopSlug } = await params;

    // These are independent — run them in parallel instead of serially
    // (this layout runs on every storefront page view).
    const [token, customerData, bootstrapData, t] = await Promise.all([
        getCustomerSession(shopSlug),
        getCustomerData(shopSlug),
        getShopBootstrapData(shopSlug),
        getT('common'),
    ]);
    const customerId = customerData?.sub || customerData?.id;

    const shopInfo = bootstrapData?.shop;
    const globalLayout = bootstrapData?.globalLayout;
    const mainMenu = bootstrapData?.navigation?.mainMenu;
    const footerMenu = bootstrapData?.navigation?.footerMenu;

    const shopName = shopInfo?.name || shopSlug.toUpperCase();
    const globalComponents = globalLayout?.globalComponents || [];

    return (
        <StorefrontPreviewProvider>
            <div 
                className="flex flex-col min-h-screen storefront-layout-wrapper"
            style={{
                '--theme-primary': globalLayout?.theme?.primaryColor || '#059669',
                fontFamily: globalLayout?.theme?.fontFamily || 'Inter, sans-serif'
            } as React.CSSProperties}
        >
            {shopInfo?.id && <CartInitializer shopId={shopInfo.id} />}
            <CartSidebar />
            <NotificationToast token={token ?? undefined} />
            
            {/* ── Global Header (Dynamic) or Fallback ── */}
            <DynamicGlobalHeader initialComponents={globalComponents}>
            {globalComponents.length > 0 ? (
                <ErrorBoundary componentName="GlobalHeader">
                    <DynamicRenderer components={globalComponents.filter((c: any) => c.componentId.toLowerCase().includes('header'))} />
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
                            {mainMenu?.items?.map((item: any, idx: number) => (
                                <a key={idx} href={`/${shopSlug}${item.url}`} className="hover:text-brand transition-colors">
                                    {item.title}
                                </a>
                            ))}
                            {!mainMenu && (
                                <a href={`/${shopSlug}/all-products`} className="hover:text-brand transition-colors">
                                    {t('nav.allProducts')}
                                </a>
                            )}
                            <div className="mx-2 w-px h-4 bg-slate-200"></div>
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
                </ErrorBoundary>
            ) : (
                <footer className="border-t border-slate-200 py-12 mt-20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-wrap justify-between gap-8 mb-8">
                            <div className="max-w-xs">
                                <h3 className="font-bold text-slate-800 mb-4">{shopName}</h3>
                                <p className="text-slate-500 text-sm">{t('footer.poweredBy')}</p>
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
        </div>
        </StorefrontPreviewProvider>
    );
}
