import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface FeaturedCollectionEditorialProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
}

export function FeaturedCollectionEditorial({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
}: FeaturedCollectionEditorialProps) {
    return (
        <section className="w-full bg-white flex flex-col md:flex-row min-h-[700px]">
            {/* Sticky Editorial Half */}
            <div className="w-full md:w-1/2 p-12 md:p-24 bg-emerald-950 text-emerald-50 flex flex-col justify-center">
                <div className="max-w-md mx-auto xl:ml-auto xl:mr-12 sticky top-24">
                    <span className="text-emerald-400 font-mono text-sm mb-6 block uppercase tracking-widest">The Edit</span>
                    <h2 className="text-5xl md:text-7xl font-bold mb-8 leading-none">
                        {title || <span>Modern <br /><span className="text-emerald-500 italic">Classics</span></span>}
                    </h2>
                    <p className="text-emerald-200/80 mb-8">
                        {subtitle || "Pieces that transcend seasons. We've curated a selection of timeless garments that form the foundation of any sophisticated wardrobe."}
                    </p>
                    <a href="#" className="inline-block border-b-2 border-emerald-400 pb-1 text-emerald-400 font-bold hover:text-white hover:border-white transition-colors uppercase tracking-widest text-sm">
                        Shop The Complete Edit
                    </a>
                </div>
            </div>

            {/* Product Scroll Half */}
            <div className="w-full md:w-1/2 p-8 md:p-16 grid grid-cols-1 sm:grid-cols-2 gap-8 auto-rows-max">
                {[1, 2, 3, 4].map((i) => (
                    <a href="#" key={i} className="group">
                        <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden mb-4 relative">
                            <SmartImage
                                src={i === 1 && backgroundImageUrl ? backgroundImageUrl : DEFAULT_IMG}
                                alt="Product"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Classic Denim {i}</h3>
                        <p className="text-slate-500 text-sm mt-1">${89 + i * 5}.00</p>
                    </a>
                ))}
            </div>
        </section>
    );
}
