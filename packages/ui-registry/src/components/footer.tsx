import React from 'react';
import Link from 'next/link';
import { Facebook, Instagram, Twitter, Globe } from 'lucide-react';

export interface FooterProps {
    shopName?: string;
    backgroundColor?: string;
    textColor?: string;
    copyrightText?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    twitterUrl?: string;
    websiteUrl?: string;
}

export const Footer: React.FC<FooterProps> = ({
    shopName = 'STOREFRONT',
    backgroundColor = '#111827',
    textColor = '#ffffff',
    copyrightText = '© 2026 E-commerce',
    facebookUrl,
    instagramUrl,
    twitterUrl,
    websiteUrl,
}) => {
    return (
        <footer className="border-t" style={{ backgroundColor, color: textColor }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <Link href="/" className="text-xl font-bold tracking-tighter uppercase">
                            {shopName}
                        </Link>
                        <p className="text-sm opacity-80 max-w-xs">
                            {shopName} - Đẳng cấp mua sắm trực tuyến.
                        </p>
                    </div>

                    {/* Utilities */}
                    <div className="flex flex-col sm:flex-row gap-6 sm:gap-12">
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">
                                Khám phá
                            </h3>
                            <ul role="list" className="space-y-3">
                                <li>
                                    <Link href="/pages/about" className="text-sm opacity-80 hover:opacity-100 transition-colors">
                                        About Us
                                    </Link>
                                </li>
                                <li>
                                    <Link href="/pages/policy" className="text-sm opacity-80 hover:opacity-100 transition-colors">
                                        Policies & Terms of Service
                                    </Link>
                                </li>
                            </ul>
                        </div>
                        
                        {/* Social Links */}
                        <div>
                            <h3 className="text-sm font-semibold tracking-wider uppercase mb-4">
                                Liên kết
                            </h3>
                            <div className="flex items-center space-x-4">
                                {facebookUrl && (
                                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Facebook</span>
                                        <Facebook className="h-6 w-6" />
                                    </a>
                                )}
                                {instagramUrl && (
                                    <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Instagram</span>
                                        <Instagram className="h-6 w-6" />
                                    </a>
                                )}
                                {twitterUrl && (
                                    <a href={twitterUrl} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Twitter</span>
                                        <Twitter className="h-6 w-6" />
                                    </a>
                                )}
                                {websiteUrl && (
                                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="opacity-80 hover:opacity-100 transition-opacity">
                                        <span className="sr-only">Website</span>
                                        <Globe className="h-6 w-6" />
                                    </a>
                                )}
                                {!facebookUrl && !instagramUrl && !twitterUrl && !websiteUrl && (
                                    <p className="text-sm opacity-60 italic">Chưa có liên kết ngoài</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-12 border-t border-white/10 pt-8 flex justify-center items-center">
                    <p className="text-sm opacity-70">
                        {copyrightText.replace('STOREFRONT', shopName)}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export const footerSchema = {
    name: 'Footer',
    category: 'Footer',
    settings: [
        { id: 'shopName', type: 'text', label: 'Tên Shop', default: 'STOREFRONT' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền', default: '#111827' },
        { id: 'textColor', type: 'color', label: 'Màu chữ', default: '#ffffff' },
        { id: 'copyrightText', type: 'text', label: 'Bản quyền', default: '© 2026 STOREFRONT' },
        { id: 'facebookUrl', type: 'text', label: 'Facebook URL' },
        { id: 'instagramUrl', type: 'text', label: 'Instagram URL' },
        { id: 'twitterUrl', type: 'text', label: 'Twitter URL' },
        { id: 'websiteUrl', type: 'text', label: 'Website khác URL' }
    ]
};
