'use client';

import React from 'react';
import Link from 'next/link';
import { User, ShoppingCart, Menu } from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { HeaderSearch } from './HeaderSearch';
import { SmartImage } from '../../blocks/SmartImage';

export interface HeaderProps {
    shopName?: string;
    logoUrl?: string;
    logoPosition?: 'left' | 'center';
    backgroundColor?: string;
    textColor?: string;
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
    blocks = []
}) => {
    // Extract menu items from blocks
    const navigation = blocks.length > 0 
        ? blocks.filter(b => b.componentId === 'HeaderMenuItem')
        : [{ id: '1', componentId: 'HeaderMenuItem', props: { label: 'All Products', link: '/all-products' } }];

    const hasLanguageSwitcher = blocks.some(b => b.componentId === 'HeaderLanguageSwitcher');
    const hasCartTrigger = blocks.some(b => b.componentId === 'HeaderCartTrigger');

    return (
        <div className="w-full relative z-50">
            {/* Render Announcement Bar if it exists in blocks */}
            {blocks.filter(b => b.componentId === 'AnnouncementBar').map((block, idx) => (
                <div key={block.id || idx} className="relative group">
                    <AnnouncementBar {...block.props} />
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
                        {/* Mobile menu */}
                        <button className="mr-4 lg:hidden p-2 text-inherit opacity-80 hover:opacity-100" title="Open menu">
                            <Menu className="h-6 w-6" />
                        </button>

                        {logoPosition === 'left' && (
                            <>
                                <Link href="/" className="flex items-center space-x-2 mr-10">
                                    {logoUrl ? (
                                        <SmartImage src={logoUrl} alt="Logo" className="h-8 max-w-[200px] object-contain" sizes="200px" priority />
                                    ) : (
                                        <span className="font-bold text-xl tracking-tighter uppercase whitespace-nowrap">{shopName}</span>
                                    )}
                                </Link>
                                <nav className="hidden lg:flex space-x-8">
                                    {navigation.map((item, idx) => (
                                        <Link
                                            key={item.id || idx}
                                            href={item.props?.link || '/'}
                                            className="text-sm font-medium transition-opacity opacity-80 hover:opacity-100"
                                        >
                                            {item.props?.label || 'Menu Item'}
                                        </Link>
                                    ))}
                                </nav>
                            </>
                        )}
                    </div>

                    {/* Center Logo */}
                    {logoPosition === 'center' && (
                        <Link href="/" className="flex items-center space-x-2">
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
                             <nav className="hidden lg:flex space-x-8 mr-4">
                                {navigation.map((item, idx) => (
                                    <Link
                                        key={item.id || idx}
                                        href={item.props?.link || '/'}
                                        className="text-sm font-medium transition-opacity opacity-80 hover:opacity-100"
                                    >
                                        {item.props?.label || 'Menu Item'}
                                    </Link>
                                ))}
                            </nav>
                        )}
                        <div className="flex items-center space-x-2 sm:space-x-4">
                            <HeaderSearch />
                            <Link href="/profile" className="p-2 text-inherit opacity-80 hover:opacity-100" title="Account">
                                <User className="h-5 w-5" />
                            </Link>
                            
                            {(blocks.length === 0 || hasLanguageSwitcher) && (
                                <div className="text-sm font-medium mx-2 opacity-80 hover:opacity-100 cursor-pointer">VI</div>
                            )}
                            
                            {(blocks.length === 0 || hasCartTrigger) && (
                                <Link href="/cart" className="p-2 text-inherit opacity-80 hover:opacity-100 relative" title="Cart">
                                    <ShoppingCart className="h-5 w-5" />
                                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-brand" />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
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
