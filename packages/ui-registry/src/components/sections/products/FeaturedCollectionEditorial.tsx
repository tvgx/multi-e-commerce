import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';
import { DEFAULT_IMG } from '../../../lib/media';
import { formatPrice } from '../../../lib/format';
import { normalizeProducts, productHref } from '../../../lib/products';
import { shopHref } from '../../../lib/href';
import { headingSizeClass } from '../../../lib/section-style';

interface FeaturedCollectionEditorialProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    collectionId?: string;
    ctaText?: string;
    ctaLink?: string;
    maxItems?: number;
    headingSize?: string;
    backgroundColor?: string;
    textColor?: string;
    /** Sản phẩm thật của shop — inject từ pageContext/preview. */
    products?: any[];
    basePath?: string;
    locale?: string;
}

const DEMO_ITEMS = [1, 2, 3, 4].map((i) => ({
    id: '',
    name: `Classic Denim ${i}`,
    price: `$${89 + i * 5}.00`,
    image: DEFAULT_IMG,
    href: '#',
}));

export function FeaturedCollectionEditorial({
    title,
    subtitle,
    backgroundImageUrl,
    collectionId,
    ctaText,
    ctaLink,
    maxItems = 4,
    headingSize,
    backgroundColor,
    textColor,
    products,
    basePath,
    locale,
}: FeaturedCollectionEditorialProps) {
    const catalog = normalizeProducts(products);
    const items =
        catalog.length > 0
            ? catalog.slice(0, Math.max(1, maxItems)).map((p, i) => ({
                  id: p.id,
                  name: p.name,
                  price: formatPrice(p.basePrice, { locale }),
                  image: (i === 0 && backgroundImageUrl) || p.image || DEFAULT_IMG,
                  href: productHref(basePath, p.id),
              }))
            : DEMO_ITEMS.slice(0, Math.max(1, maxItems)).map((d, i) => ({
                  ...d,
                  image: i === 0 && backgroundImageUrl ? backgroundImageUrl : d.image,
              }));

    const allLink = shopHref(basePath || '', ctaLink || '/all-products');

    return (
        <section className="w-full bg-white flex flex-col md:flex-row min-h-[700px]">
            {/* Sticky Editorial Half */}
            <div className="w-full md:w-1/2 p-12 md:p-24 bg-brand text-white flex flex-col justify-center" style={{ ...(backgroundColor ? { backgroundColor } : {}), ...(textColor ? { color: textColor } : {}) }}>
                <div className="max-w-md mx-auto xl:ml-auto xl:mr-12 sticky top-24">
                    <span className="text-brand font-mono text-sm mb-6 block uppercase tracking-widest">The Edit</span>
                    <h2 className={`${headingSize ? headingSizeClass(headingSize) : 'text-5xl md:text-7xl'} font-bold mb-8 leading-none`}>
                        {title || <span>Modern <br /><span className="text-brand italic">Classics</span></span>}
                    </h2>
                    <p className="text-white/80 mb-8">
                        {subtitle || "Pieces that transcend seasons. We've curated a selection of timeless garments that form the foundation of any sophisticated wardrobe."}
                    </p>
                    <a href={allLink} className="inline-block border-b-2 border-brand pb-1 text-brand font-bold hover:text-white hover:border-white transition-colors uppercase tracking-widest text-sm">
                        {ctaText || 'Shop The Complete Edit'}
                    </a>
                </div>
            </div>

            {/* Product Scroll Half */}
            <div className="w-full md:w-1/2 p-8 md:p-16 grid grid-cols-1 sm:grid-cols-2 gap-8 auto-rows-max">
                {items.map((item, i) => (
                    <a href={item.href} key={item.id || i} className="group">
                        <div className="w-full aspect-[3/4] bg-slate-100 rounded-xl overflow-hidden mb-4 relative">
                            <SmartImage
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                        </div>
                        <h3 className="font-bold text-slate-900 group-hover:text-brand transition-colors">{item.name}</h3>
                        <p className="text-slate-500 text-sm mt-1">{item.price}</p>
                    </a>
                ))}
            </div>
        </section>
    );
}
