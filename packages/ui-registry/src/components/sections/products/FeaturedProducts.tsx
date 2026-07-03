import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { cn } from '../../../lib/utils';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

/** Block con của thẻ sản phẩm (Phase B): bật/tắt, đổi thứ tự, chỉnh props. */
export interface ProductCardBlock {
    id: string;
    componentId: string;
    props?: Record<string, any>;
    isHidden?: boolean;
}

interface FeaturedProductProps {
    productId?: string;
    mediaLayout?: string;
    backgroundImageUrl?: string;
    title?: string;
    subtitle?: string;
    blocks?: ProductCardBlock[];
}

export function FeaturedProducts({
    productId,
    mediaLayout = 'left',
    backgroundImageUrl,
    title,
    subtitle,
    blocks = [],
}: FeaturedProductProps) {
    const isRight = mediaLayout === 'right';

    // Layout cũ (chưa có blocks) giữ nguyên; layout mới render theo blocks —
    // block bị ẩn (isHidden) không hiện, thứ tự block quyết định thứ tự phần tử.
    const visible = blocks.filter((b) => !b.isHidden);
    const hasBlocks = blocks.length > 0;
    const has = (cid: string) => !hasBlocks || visible.some((b) => b.componentId === cid);
    const propsOf = (cid: string) => visible.find((b) => b.componentId === cid)?.props ?? {};

    const showImage = has('ProductCardImage');
    const showName = has('ProductCardName');
    const showPrice = has('ProductCardPrice');
    const showButton = has('ProductCardButton');
    const showRating = has('ProductCardRating');

    return (
        <section className="w-full py-20 px-4 md:px-12 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                {showImage && (
                    <div className={cn('lg:w-1/2 w-full', isRight ? 'lg:order-2' : 'lg:order-1')}>
                        <div className="aspect-square bg-slate-800 rounded-full overflow-hidden relative shadow-2xl shadow-brand/20 p-4">
                            <div className="w-full h-full rounded-full overflow-hidden border border-slate-700">
                                <SmartImage
                                    src={backgroundImageUrl || DEFAULT_IMG}
                                    alt="Featured Product"
                                    className={cn(
                                        'w-full h-full scale-110',
                                        propsOf('ProductCardImage').fit === 'contain' ? 'object-contain' : 'object-cover',
                                    )}
                                />
                            </div>
                            {showRating && (
                                <div className="absolute top-1/4 -left-4 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold shadow-xl rotate-[-5deg]">
                                    {propsOf('ProductCardRating').label || '★ Top Rated'}
                                </div>
                            )}
                            <div className="absolute bottom-1/4 -right-4 bg-brand text-white px-4 py-2 rounded-xl font-bold shadow-xl rotate-[5deg]">Limited Stock</div>
                        </div>
                    </div>
                )}

                <div className={cn('lg:w-1/2 w-full space-y-8 text-center lg:text-left', isRight ? 'lg:order-1' : 'lg:order-2')}>
                    {showName && (
                        <HeadingBlock
                            content={title || 'The Ultimate Everyday Sneaker.'}
                            level="h2"
                            alignment="left"
                            className="text-5xl md:text-6xl font-black italic tracking-tighter"
                        />
                    )}
                    <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        {subtitle || "Engineered for all-day comfort with our proprietary cloud-foam tech. This isn't just a shoe, it's a statement."}
                    </p>

                    {(showPrice || showButton) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                            {showPrice && <span className="text-4xl font-bold">$149.00</span>}
                            {showButton && (
                                <ButtonBlock
                                    label={propsOf('ProductCardButton').label || 'Add To Cart'}
                                    style="primary"
                                    size="lg"
                                    className="w-full sm:w-auto bg-brand hover:opacity-90 text-brand-fg rounded-full shadow-lg shadow-brand/20"
                                />
                            )}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

export const featuredProductSchema = {
    name: 'Featured Product',
    category: 'Products',
    settings: [
        { id: 'backgroundImageUrl', type: 'image', label: 'Ảnh sản phẩm' },
        { id: 'title', type: 'text', label: 'Tiêu đề sản phẩm' },
        { id: 'subtitle', type: 'textarea', label: 'Mô tả ngắn' },
        { id: 'mediaLayout', type: 'segmented', label: 'Vị trí hình ảnh', options: ['left', 'right'] },
    ],
};
