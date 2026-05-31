import React from 'react';
import Link from 'next/link';

export interface FooterProps {
    backgroundColor?: string;
    textColor?: string;
    copyrightText?: string;
    blocks?: {
        id: string;
        componentId: string;
        props: any;
    }[];
}

export const Footer: React.FC<FooterProps> = ({
    backgroundColor = '#111827',
    textColor = '#ffffff',
    copyrightText = '© 2026 E-commerce',
    blocks = []
}) => {
    
    // Process columns from blocks
    const columns = blocks.length > 0 
        ? blocks
            .filter(b => b.componentId === 'FooterColumn')
            .map(b => ({
                title: b.props?.title || 'Column Title',
                links: (b.props?.links || '').split('\n').filter((l: string) => l.trim().length > 0).map((l: string) => {
                    const parts = l.split(',');
                    return { label: parts[0]?.trim() || 'Link', href: parts[1]?.trim() || '#' };
                })
            }))
        : [
            {
                title: 'Utilities',
                links: [
                    { label: 'Privacy Policy', href: '/privacy' },
                    { label: 'Terms of Service', href: '/terms' },
                    { label: 'Shipping Info', href: '/shipping' },
                    { label: 'Returns', href: '/returns' }
                ]
            }
        ];

    return (
        <footer className="border-t" style={{ backgroundColor, color: textColor }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
                <div className="xl:grid xl:grid-cols-4 xl:gap-8">
                    {/* Brand Info */}
                    <div className="space-y-8 xl:col-span-1">
                        <Link href="/" className="text-xl font-bold tracking-tighter">
                            STOREFRONT
                        </Link>
                        <p className="text-sm opacity-80 max-w-xs">
                            Making styling easy.
                        </p>
                    </div>

                    {/* Dynamic Columns */}
                    <div className="mt-12 grid grid-cols-2 gap-8 xl:col-span-3 xl:mt-0">
                        {columns.map((col, idx) => (
                            <div key={idx}>
                                <h3 className="text-sm font-semibold tracking-wider uppercase">
                                    {col.title}
                                </h3>
                                <ul role="list" className="mt-4 space-y-4">
                                    {col.links.map((item: any, i: number) => (
                                        <li key={i}>
                                            <Link href={item.href} className="text-sm opacity-80 hover:opacity-100 transition-colors">
                                                {item.label}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="mt-12 border-t border-white/10 pt-8 flex justify-center items-center">
                    <p className="text-sm opacity-70">
                        {copyrightText}
                    </p>
                </div>
            </div>
        </footer>
    );
};
