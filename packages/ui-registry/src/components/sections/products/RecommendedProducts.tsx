import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { SmartImage } from '../../blocks/SmartImage';
import type { ProductCardBlock } from './FeaturedProducts';

interface RecommendedProductsProps {
    title?: string;
    recommendationType?: string;
    blocks?: ProductCardBlock[];
}

// Demo items — section gợi ý chưa nối dữ liệu thật (P3, cố ý).
const DEMO_ITEMS = [1, 2, 3, 4].map((i) => ({
    name: `Perfect Match Item ${i}`,
    price: `$${45 + i * 3}.00`,
    image: 'http://localhost:9000/assets/default-3.png',
}));

export function RecommendedProducts({
    title = 'You May Also Like',
    recommendationType = 'related',
    blocks = [],
}: RecommendedProductsProps) {
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

    const renderBlock = (block: ProductCardBlock, item: (typeof DEMO_ITEMS)[number]) => {
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
        <section className="w-full py-16 border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="mb-8 border-b border-slate-200 pb-4">
                    <HeadingBlock
                        content={title}
                        level="h2"
                        alignment="left"
                        className="text-2xl font-bold text-slate-900 m-0 p-0"
                    />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {DEMO_ITEMS.map((item, i) => (
                        <a href="#" key={i} className="group block">
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
        {
            id: 'recommendationType',
            type: 'select',
            label: 'Thuật toán gợi ý',
            options: ['related', 'bought_together', 'trending'],
        },
    ],
};
