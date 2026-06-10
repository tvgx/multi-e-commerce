import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface BlogPostGridProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    columns?: number;
}

export function BlogPostGrid({
    title,
    subtitle,
    backgroundImageUrl,
    backgroundColor,
    textColor,
    columns = 3,
}: BlogPostGridProps) {
    return (
        <section className="w-full py-20 px-4 md:px-12" style={{ backgroundColor: backgroundColor || '#ffffff' }}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold mb-4" style={{ color: textColor || '#0f172a' }}>{title || 'Latest Insights'}</h2>
                    {subtitle && <p className="text-lg opacity-70" style={{ color: textColor || '#0f172a' }}>{subtitle}</p>}
                    <a href="#" className="font-bold uppercase tracking-widest text-emerald-600 text-sm hover:text-emerald-500 mt-4 inline-block">View All Posts &rarr;</a>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <a href="#" key={i} className="group flex flex-col">
                            <div className="aspect-[4/3] bg-slate-100 rounded-2xl overflow-hidden mb-6 relative">
                                <SmartImage
                                    src={i === 1 && backgroundImageUrl ? backgroundImageUrl : DEFAULT_IMG}
                                    alt="Blog Post"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-slate-900">Design</div>
                            </div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors leading-tight mb-3">Understanding the shift towards sustainable materials in 2024</h3>
                            <p className="text-slate-500 text-sm mt-auto">By Alex Parker • 5 min read</p>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
