import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';
import { DEFAULT_IMG } from '../../../lib/media';
import { formatPrice } from '../../../lib/format';
import { normalizeProducts, productHref } from '../../../lib/products';
import { sectionStyle, headingSizeClass } from '../../../lib/section-style';

interface FeaturedCollectionGridProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
    columns?: number;
    maxItems?: number;
    viewAllLink?: string;
    viewAllText?: string;
    paddingY?: string;
    headingSize?: string;
    backgroundColor?: string;
    textColor?: string;
    /** Sản phẩm thật của shop — inject từ pageContext/preview. */
    products?: any[];
    basePath?: string;
}

// Demo khi shop chưa có sản phẩm — giữ preview không trống.
const DEMO_ITEMS = [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    id: '',
    name: `Textured Knit Sweater ${i}`,
    price: `$${65 + i * 2}.00`,
    image: DEFAULT_IMG,
    href: '#',
    category: undefined as string | undefined,
}));

export function FeaturedCollectionGrid({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
    columns = 4,
    maxItems = 8,
    viewAllLink,
    viewAllText,
    paddingY,
    headingSize,
    backgroundColor,
    textColor,
    products,
    basePath,
}: FeaturedCollectionGridProps) {
    const catalog = normalizeProducts(products);
    const items =
        catalog.length > 0
            ? catalog.slice(0, Math.max(1, maxItems)).map((p, i) => ({
                  id: p.id,
                  name: p.name,
                  price: formatPrice(p.basePrice),
                  image: (i === 0 && backgroundImageUrl) || p.image || DEFAULT_IMG,
                  href: productHref(basePath, p.id),
                  category: p.category,
              }))
            : DEMO_ITEMS.slice(0, Math.max(1, maxItems)).map((d, i) => ({
                  ...d,
                  image: i === 0 && backgroundImageUrl ? backgroundImageUrl : d.image,
              }));

    const allLink = viewAllLink || `${basePath || ''}/all-products`;

    return (
        <section className="w-full px-4 md:px-12 bg-white" style={sectionStyle({ paddingY, backgroundColor, textColor })}>
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className={`${headingSizeClass(headingSize)} font-bold text-slate-900 mb-4`} style={textColor ? { color: textColor } : undefined}>{title || 'New Arrivals'}</h2>
                    <p className="text-slate-600">{subtitle || 'Fresh styles just landed. Upgrade your rotation.'}</p>
                </div>

                <div className={`grid grid-cols-2 gap-6 md:gap-8 ${columns >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}>
                    {items.map((item, i) => (
                        <a key={item.id || i} href={item.href} className="group relative block">
                            <div className="aspect-[4/5] bg-slate-100 rounded-2xl overflow-hidden mb-4 relative">
                                <SmartImage
                                    src={item.image}
                                    alt={item.name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                />
                                <div className="absolute inset-x-0 bottom-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="block w-full text-center bg-slate-900 text-white font-semibold py-2.5 rounded-xl hover:bg-brand transition-colors text-sm">Xem chi tiết</span>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 text-sm md:text-base leading-tight mb-1">{item.name}</h3>
                                {item.category && <p className="text-slate-500 text-sm mb-2">{item.category}</p>}
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-900">{item.price}</span>
                                </div>
                            </div>
                        </a>
                    ))}
                </div>

                <div className="mt-16 text-center">
                    <a
                        href={allLink}
                        className="inline-block border-2 border-slate-900 text-slate-900 px-8 py-4 rounded-full font-bold hover:bg-slate-900 hover:text-white transition-colors uppercase tracking-widest text-sm"
                    >
                        {viewAllText || 'View All'}
                    </a>
                </div>
            </div>
        </section>
    );
}
