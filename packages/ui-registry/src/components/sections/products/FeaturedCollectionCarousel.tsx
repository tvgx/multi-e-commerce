import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';
import { DEFAULT_IMG } from '../../../lib/media';
import { formatPrice } from '../../../lib/format';
import { normalizeProducts, productHref } from '../../../lib/products';
import { sectionStyle, headingSizeClass } from '../../../lib/section-style';

interface FeaturedCollectionCarouselProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
    maxItems?: number;
    paddingY?: string;
    headingSize?: string;
    backgroundColor?: string;
    textColor?: string;
    /** Sản phẩm thật của shop — inject từ pageContext/preview. */
    products?: any[];
    basePath?: string;
    locale?: string;
}

const DEMO_ITEMS = [1, 2, 3, 4, 5, 6].map((i) => ({
    id: '',
    name: `Premium Essential Tee ${i}`,
    price: `$${29 + i * 10}.00`,
    image: DEFAULT_IMG,
    href: '#',
    category: 'Cotton Blend' as string | undefined,
}));

export function FeaturedCollectionCarousel({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
    maxItems = 6,
    paddingY,
    headingSize,
    backgroundColor,
    textColor,
    products,
    basePath,
    locale,
}: FeaturedCollectionCarouselProps) {
    const catalog = normalizeProducts(products);
    const items =
        catalog.length > 0
            ? catalog.slice(0, Math.max(1, maxItems)).map((p, i) => ({
                  id: p.id,
                  name: p.name,
                  price: formatPrice(p.basePrice, { locale }),
                  image: (i === 0 && backgroundImageUrl) || p.image || DEFAULT_IMG,
                  href: productHref(basePath, p.id),
                  category: p.category,
              }))
            : DEMO_ITEMS.slice(0, Math.max(1, maxItems)).map((d, i) => ({
                  ...d,
                  image: i === 0 && backgroundImageUrl ? backgroundImageUrl : d.image,
              }));

    return (
        <section className="w-full bg-slate-50 overflow-hidden" style={sectionStyle({ paddingY: paddingY || 'spacious', backgroundColor, textColor })}>
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col md:flex-row items-end justify-between mb-12 gap-6">
                <div className="max-w-xl">
                    <h2 className={`${headingSizeClass(headingSize)} font-bold text-slate-900 mb-4`} style={textColor ? { color: textColor } : undefined}>{title || 'Featured Collection'}</h2>
                    <p className="text-slate-600 text-lg">{subtitle || 'Our most loved pieces, designed with precision and crafted for ultimate comfort.'}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                    <button className="w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors">&larr;</button>
                    <button className="w-12 h-12 bg-slate-900 text-white shadow-sm rounded-full flex items-center justify-center hover:bg-slate-800 transition-colors">&rarr;</button>
                </div>
            </div>

            <div className="flex gap-6 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory pb-8" style={{ scrollbarWidth: 'none' }}>
                {items.map((item, i) => (
                    <a key={item.id || i} href={item.href} className="min-w-[70vw] md:min-w-[400px] snap-center group cursor-pointer flex-shrink-0 block">
                        <div className="w-full aspect-[4/5] bg-slate-200 rounded-2xl overflow-hidden mb-6 relative">
                            <span className="absolute top-4 left-4 bg-white px-3 py-1 rounded-full text-xs font-bold text-slate-900 z-10 shadow-sm">New</span>
                            <SmartImage
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-x-0 bottom-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-300">
                                <span className="block w-full text-center bg-white/90 backdrop-blur text-slate-900 font-bold py-3 rounded-xl hover:bg-slate-900 hover:text-white transition-colors shadow-lg">Xem chi tiết</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1 group-hover:text-brand transition-colors">{item.name}</h3>
                                {item.category && <p className="text-slate-500 text-sm">{item.category}</p>}
                            </div>
                            <span className="font-bold text-lg text-slate-900">{item.price}</span>
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
}
