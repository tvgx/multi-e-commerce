import { defaultAsset } from '../../../lib/media';
import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { SmartImage } from '../../blocks/SmartImage';
import { formatPrice } from '../../../lib/format';
import { normalizeProducts, productHref } from '../../../lib/products';
import { sectionStyle, headingSizeClass } from '../../../lib/section-style';
import type { ProductCardBlock } from './FeaturedProducts';

interface RecommendedProductsProps {
    title?: string;
    recommendationType?: string;
    maxItems?: number;
    paddingY?: string;
    headingSize?: string;
    backgroundColor?: string;
    textColor?: string;
    blocks?: ProductCardBlock[];
    /** Sản phẩm thật của shop — inject từ pageContext/preview. */
    products?: any[];
    basePath?: string;
}

// Demo items — chỉ dùng khi shop chưa có sản phẩm nào (giữ preview không trống).
const DEMO_ITEMS = [1, 2, 3, 4].map((i) => ({
    id: '',
    name: `Perfect Match Item ${i}`,
    price: `$${45 + i * 3}.00`,
    image: defaultAsset('default-3.png'),
    href: '#',
}));

export function RecommendedProducts({
    title = 'You May Also Like',
    recommendationType = 'related',
    maxItems = 4,
    paddingY,
    headingSize,
    backgroundColor,
    textColor,
    blocks = [],
    products,
    basePath,
}: RecommendedProductsProps) {
    const catalog = normalizeProducts(products);
    const items =
        catalog.length > 0
            ? catalog.slice(0, Math.max(1, maxItems)).map((p) => ({
                  id: p.id,
                  name: p.name,
                  price: formatPrice(p.basePrice),
                  image: p.image || defaultAsset('default-3.png'),
                  href: productHref(basePath, p.id),
              }))
            : DEMO_ITEMS.slice(0, Math.max(1, maxItems));

    // Thẻ SP ghép từ block con: block ẩn không render, thứ tự block quyết định
    // thứ tự phần tử trong thẻ. Layout cũ (không có blocks) render đủ ảnh/tên/giá.
    const hasBlocks = blocks.length > 0;
    const visible = hasBlocks
        ? blocks.filter((b) => !b.isHidden)
        : ([
              { id: '_img', componentId: 'ProductCardImage' },
              { id: '_name', componentId: 'ProductCardName' },
              { id: '_price', componentId: 'ProductCardPrice' },
          ] as ProductCardBlock[]);

    const renderBlock = (block: ProductCardBlock, item: (typeof items)[number]) => {
        const props = block.props ?? {};
        switch (block.componentId) {
            case 'ProductCardImage':
                return (
                    <div key={block.id} className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden mb-3">
                        <SmartImage
                            src={item.image}
                            alt={item.name}
                            className={`w-full h-full group-hover:scale-105 transition-transform duration-500 ${
                                props.fit === 'contain' ? 'object-contain' : 'object-cover'
                            }`}
                            sizes="(min-width: 768px) 25vw, 50vw"
                        />
                    </div>
                );
            case 'ProductCardName':
                return (
                    <h3 key={block.id} className="font-medium text-slate-900 text-sm mb-1 group-hover:text-brand transition-colors">
                        {item.name}
                    </h3>
                );
            case 'ProductCardPrice':
                return (
                    <p key={block.id} className="font-bold text-slate-900 text-sm">
                        {item.price}
                    </p>
                );
            case 'ProductCardButton':
                return (
                    <button
                        key={block.id}
                        type="button"
                        className="mt-2 w-full bg-brand text-white text-xs font-bold py-2 rounded-lg hover:opacity-90 transition-opacity"
                    >
                        {props.label || 'Thêm vào giỏ'}
                    </button>
                );
            case 'ProductCardRating':
                return (
                    <span key={block.id} className="inline-block text-xs font-semibold text-amber-500 mb-1">
                        {props.label || '★★★★★'}
                    </span>
                );
            default:
                return null;
        }
    };

    return (
        <section className="w-full border-t border-slate-200 bg-white" style={sectionStyle({ paddingY: paddingY || 'compact', backgroundColor, textColor })}>
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="mb-8 border-b border-slate-200 pb-4">
                    <HeadingBlock
                        content={title}
                        level="h2"
                        alignment="left"
                        className={`${headingSize ? headingSizeClass(headingSize) : 'text-2xl'} font-bold text-slate-900 m-0 p-0`}
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {items.map((item, i) => (
                        <a href={item.href} key={item.id || i} className="group block">
                            {visible.map((block) => renderBlock(block, item))}
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

export const recommendedProductsSchema = {
    name: 'Recommended Products',
    category: 'Products',
    settings: [
        { id: 'title', type: 'text', label: 'Tiêu đề' },
        { id: 'maxItems', type: 'number', label: 'Số sản phẩm hiển thị', default: 4, min: 1, max: 12, step: 1 },
        { id: 'headingSize', type: 'segmented', label: 'Cỡ tiêu đề', options: [
            { value: 'sm', label: 'Nhỏ' }, { value: 'md', label: 'Vừa' }, { value: 'lg', label: 'Lớn' },
        ], default: 'sm' },
        { id: 'paddingY', type: 'segmented', label: 'Khoảng đệm dọc', options: [
            { value: 'compact', label: 'Gọn' }, { value: 'normal', label: 'Vừa' }, { value: 'spacious', label: 'Rộng' },
        ], default: 'compact' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền', default: '#ffffff' },
        {
            id: 'recommendationType',
            type: 'select',
            label: 'Thuật toán gợi ý',
            options: ['related', 'bought_together', 'trending'],
        },
    ],
};
