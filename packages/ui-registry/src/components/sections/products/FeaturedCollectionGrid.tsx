import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface FeaturedCollectionGridProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
    columns?: number;
}

export function FeaturedCollectionGrid({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
    columns = 4,
}: FeaturedCollectionGridProps) {
    return (
        <section className="w-full py-20 px-4 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">{title || 'New Arrivals'}</h2>
                    <p className="text-slate-600">{subtitle || 'Fresh styles just landed. Upgrade your rotation.'}</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div key={i} className="group relative">
                            <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                <SmartImage
                                    src={i === 1 && backgroundImageUrl ? backgroundImageUrl : DEFAULT_IMG}
                                    alt="Product"
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button className="w-full bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-emerald-500 transition-colors text-sm">Add to Cart</button>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight mb-1">Textured Knit Sweater {i}</h3>
                                <p className="text-slate-500 text-sm mb-2">3 Colors</p>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">${65 + i * 2}.00</span>
                                    {i % 3 === 0 && <span className="text-sm text-slate-400 line-through">${85 + i * 2}.00</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <button className="border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-900 hover:text-white transition-colors uppercase tracking-widest text-sm">
                        View All Arrivals
                    </button>
                </div>
            </div>
        </section>
    );
}
