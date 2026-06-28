import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface FeaturedCollectionCarouselProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
}

export function FeaturedCollectionCarousel({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
}: FeaturedCollectionCarouselProps) {
    return (
        <section className="w-full py-24 bg-slate-50 overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                <div className="max-w-xl">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">{title || 'Featured Collection'}</h2>
                    <p className="text-slate-600 text-lg">{subtitle || 'Our most loved pieces, designed with precision and crafted for ultimate comfort.'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button className="w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">&larr;</button>
                    <button className="w-12 h-12 bg-slate-900 text-white shadow-sm rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors">&rarr;</button>
                </div>
            </div>

            <div className="flex gap-6 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory pb-8" style={{ scrollbarWidth: 'none' }}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="min-w-[70vw] md:min-w-[400px] snap-center group cursor-pointer flex-shrink-0">
                        <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl overflow-hidden mb-6 relative">
                            <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-900 z-10 shadow-sm">New</span>
                            <SmartImage
                                src={i === 1 && backgroundImageUrl ? backgroundImageUrl : DEFAULT_IMG}
                                alt="Product"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                                <button className="w-full bg-white/90 backdrop-blur text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors shadow-lg">Quick Add</button>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand transition-colors">Premium Essential Tee {i}</h3>
                                <p className="text-slate-500 text-sm">Cotton Blend</p>
                            </div>
                            <span className="font-bold text-lg text-slate-900">${29 + i * 10}.00</span>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
