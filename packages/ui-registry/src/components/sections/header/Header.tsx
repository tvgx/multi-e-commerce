'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { User, ShoppingCart, Menu, X, Heart, ChevronDown } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { HeaderSearch } from './HeaderSearch';
import { HeaderLanguageSwitcher } from './HeaderLanguageSwitcher';
import { SmartImage } from '../../blocks/SmartImage';
import { useShopBase, shopHref } from '../../../lib/use-shop-base';
import { useTranslations } from '@ecommerce/i18n/src/react';

export interface HeaderCategory {
    id: string;
    name: string;
}

export interface HeaderProps {
    shopName?: string;
    logoUrl?: string;
    logoPosition?: 'left' | 'center';
    backgroundColor?: string;
    textColor?: string;
    // True when rendered inside the admin builder canvas, so interactive blocks
    // (language switcher) stay inert instead of navigating / reloading.
    previewMode?: boolean;
    /** Danh mục của shop — inject từ layout (server) để dropdown "Danh mục" có data thật. */
    categories?: HeaderCategory[];
    /** Buyer đang đăng nhập (id + tên) — inject từ layout để hiển thị tên thay vì "Tài khoản". */
    customerId?: string | null;
    customerName?: string | null;
    blocks?: {
        id: string;
        componentId: string;
        props: any;
    }[];
}

export const Header: React.FC<HeaderProps> = ({
    shopName = 'STOREFRONT',
    logoUrl,
    logoPosition = 'left',
    backgroundColor = '#ffffff',
    textColor = '#000000',
    previewMode = false,
    categories = [],
    customerId,
    customerName,
    blocks = []
}) => {
    const t = useTranslations('shop');
    // Link nội bộ phải mang prefix /{shopSlug} — thiếu nó thì Account/Cart/nav
    // 404 khi shop được truy cập theo path (lý do "không thấy nút đăng nhập").
    const base = useShopBase();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [catOpen, setCatOpen] = useState(false);

    // Menu items owner tự cấu hình trong builder (block HeaderMenuItem).
    const customNav = blocks.filter(b => b.componentId === 'HeaderMenuItem');

    const hasLanguageSwitcher = blocks.some(b => b.componentId === 'HeaderLanguageSwitcher');
    const hasCartTrigger = blocks.some(b => b.componentId === 'HeaderCartTrigger');

    // Nav cố định (TODO 15): mọi header đều có đủ link tới các page chính,
    // owner KHÔNG tắt được — menu tự cấu hình chỉ bổ sung thêm.
    const fixedNav = [
        { label: t('header.home'), href: shopHref(base, '/') },
        { label: t('header.allProducts'), href: shopHref(base, '/all-products') },
        { label: t('header.wishlist'), href: shopHref(base, '/wishlist') },
    ];

    const accountLabel = customerId ? (customerName || t('header.account')) : t('header.login');
    const accountHref = customerId ? `${base}/profile` : `${base}/account/login`;

    const categoryLinks = categories.map((c) => ({
        label: c.name,
        href: `${shopHref(base, '/all-products')}?category=${encodeURIComponent(c.id)}`,
    }));

    const navLinkCls = 'text-sm font-medium transition-opacity opacity-80 hover:opacity-100 whitespace-nowrap';

    const desktopNav = (
        <nav className="hidden lg:flex items-center space-x-6">
            {fixedNav.map((item) => (
                <Link key={item.href} href={item.href} className={navLinkCls}>
                    {item.label}
                </Link>
            ))}
            {/* Dropdown danh mục — chỉ hiện khi shop có category */}
            {categoryLinks.length > 0 && (
                <div
                    className="relative"
                    onMouseEnter={() => setCatOpen(true)}
                    onMouseLeave={() => setCatOpen(false)}
                >
                    <button
                        type="button"
                        className={`${navLinkCls} flex items-center gap-1`}
                        onClick={() => setCatOpen(v => !v)}
                        aria-expanded={catOpen}
                    >
                        {t('header.categories')}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${catOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {catOpen && (
                        <div className="absolute left-0 top-full pt-2 z-50">
                            <div className="min-w-[200px] max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white text-slate-800 shadow-lg py-2">
                                {categoryLinks.map((c) => (
                                    <a key={c.href} href={c.href} className="block px-4 py-2 text-sm hover:bg-slate-50 hover:text-brand transition-colors">
                                        {c.label}
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            {customNav.map((item, idx) => (
                <Link key={item.id || idx} href={shopHref(base, item.props?.link)} className={navLinkCls}>
                    {item.props?.label || t('header.home')}
                </Link>
            ))}
        </nav>
    );

    return (
        <div className="w-full relative z-50">
            {/* Render Announcement Bar if it exists in blocks */}
            {blocks.filter(b => b.componentId === 'AnnouncementBar').map((block, idx) => (
                <div key={block.id || idx} className="relative group">
                    <AnnouncementBar {...block.props} basePath={base} />
                </div>
            ))}

            <header
                className="sticky top-0 w-full border-b backdrop-blur"
                style={{ backgroundColor, color: textColor }}
            >
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className={`flex h-16 items-center ${logoPosition === 'center' ? 'justify-center relative' : 'justify-between'}`}>

                    {/* Left section (Mobile menu or Left Logo + Nav) */}
                    <div className={`flex items-center ${logoPosition === 'center' ? 'absolute left-0' : ''}`}>
                        {/* Mobile menu toggle */}
                        <button
                            className="mr-4 lg:hidden p-2 text-inherit opacity-80 hover:opacity-100"
                            title={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
                            aria-expanded={mobileOpen}
                            onClick={() => setMobileOpen(v => !v)}
                        >
                            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>

                        {logoPosition === 'left' && (
                            <>
                                <Link href={base || '/'} className="flex items-center space-x-2 mr-10">
                                    {logoUrl ? (
                                        <SmartImage src={logoUrl} alt="Logo" className="h-8 max-w-[200px] object-contain" sizes="200px" priority />
                                    ) : (
                                        <span className="font-bold text-xl tracking-tighter uppercase whitespace-nowrap">{shopName}</span>
                                    )}
                                </Link>
                                {desktopNav}
                            </>
                        )}
                    </div>

                    {/* Center Logo */}
                    {logoPosition === 'center' && (
                        <Link href={base || '/'} className="flex items-center space-x-2">
                            {logoUrl ? (
                                <SmartImage src={logoUrl} alt="Logo" className="h-8 max-w-[200px] object-contain" sizes="200px" priority />
                            ) : (
                                <span className="font-bold text-xl tracking-tighter uppercase whitespace-nowrap">{shopName}</span>
                            )}
                        </Link>
                    )}

                    {/* Right section (Nav if center logo + Icons) */}
                    <div className={`flex items-center space-x-4 ${logoPosition === 'center' ? 'absolute right-0' : ''}`}>
                        {logoPosition === 'center' && (
                            <div className="mr-4">{desktopNav}</div>
                        )}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <HeaderSearch />
                            <Link
                                href={accountHref}
                                className="p-2 text-inherit opacity-80 hover:opacity-100 flex items-center gap-1.5"
                                title={accountLabel}
                            >
                                <User className="h-5 w-5" />
                                {/* TODO 16: đã đăng nhập → hiện tên người dùng thay vì icon trơ trọi */}
                                <span className="hidden sm:inline text-sm font-medium max-w-[140px] truncate">
                                    {accountLabel}
                                </span>
                            </Link>

                            {(blocks.length === 0 || hasLanguageSwitcher) && (
                                <div className="mx-2">
                                    <HeaderLanguageSwitcher previewMode={previewMode} />
                                </div>
                            )}

                            {(blocks.length === 0 || hasCartTrigger) && (
                                <Link href={`${base}/cart`} className="p-2 text-inherit opacity-80 hover:opacity-100 relative" title={t('header.cart')}>
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>

                {/* Mobile menu panel — đủ link mọi page + danh mục (TODO 15) */}
                {mobileOpen && (
                    <div className="lg:hidden border-t border-black/10 py-3 space-y-1">
                        {fixedNav.map((item) => (
                            <Link key={item.href} href={item.href} className="block px-2 py-2 text-sm font-medium opacity-80 hover:opacity-100" onClick={() => setMobileOpen(false)}>
                                {item.label}
                            </Link>
                        ))}
                        {customNav.map((item, idx) => (
                            <Link key={item.id || idx} href={shopHref(base, item.props?.link)} className="block px-2 py-2 text-sm font-medium opacity-80 hover:opacity-100" onClick={() => setMobileOpen(false)}>
                                {item.props?.label || t('header.home')}
                            </Link>
                        ))}
                        <Link href={`${base}/cart`} className="block px-2 py-2 text-sm font-medium opacity-80 hover:opacity-100" onClick={() => setMobileOpen(false)}>
                            {t('header.cart')}
                        </Link>
                        <Link href={accountHref} className="block px-2 py-2 text-sm font-medium opacity-80 hover:opacity-100" onClick={() => setMobileOpen(false)}>
                            {accountLabel}
                        </Link>
                        {categoryLinks.length > 0 && (
                            <div className="pt-2 border-t border-black/10">
                                <div className="px-2 py-1 text-xs font-bold uppercase opacity-60">{t('header.categories')}</div>
                                {categoryLinks.map((c) => (
                                    <a key={c.href} href={c.href} className="block px-2 py-2 text-sm opacity-80 hover:opacity-100" onClick={() => setMobileOpen(false)}>
                                        {c.label}
                                    </a>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
            </header>
        </div>
    );
};

export const headerSchema = {
    name: 'Header',
    category: 'Header',
    allowedBlocks: ['AnnouncementBar', 'HeaderMenuItem', 'HeaderLanguageSwitcher', 'HeaderCartTrigger'],
    settings: [
        { id: 'shopName', type: 'text', label: 'Tên Shop', default: 'STOREFRONT' },
        { id: 'logoUrl', type: 'image', label: 'Logo' },
        { id: 'logoPosition', type: 'select', label: 'Vị trí Logo', options: [{label: 'Trái', value: 'left'}, {label: 'Giữa', value: 'center'}], default: 'left' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền', default: '#ffffff' },
        { id: 'textColor', type: 'color', label: 'Màu chữ', default: '#000000' }
    ]
};
