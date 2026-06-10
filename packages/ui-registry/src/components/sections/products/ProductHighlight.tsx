import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { cn } from '../../../lib/utils';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface ProductHighlightProps {
    productId?: string;
    mediaLayout?: string;
    backgroundImageUrl?: string;
    title?: string;
    subtitle?: string;
}

export function ProductHighlight({
    productId,
    mediaLayout = 'right',
    backgroundImageUrl,
    title,
    subtitle,
}: ProductHighlightProps) {
    const isRight = mediaLayout === 'right';

    return (
        <section className="w-full py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-12 relative">
                <div className="absolute top-0 right-0 text-[10rem] md:text-[15rem] font-black text-slate-50 leading-none select-none z-0 -translate-y-16 translate-x-12">
                    FOCUS
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className={cn('space-y-8', isRight ? 'order-2 lg:order-1' : 'order-2 lg:order-2')}>
                        <span className="text-emerald-500 font-bold tracking-widest uppercase">Spotlight</span>
                        <HeadingBlock
                            content={title || 'Artisan Crafted Leather Tote.'}
                            level="h2"
                            alignment="left"
                            className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight"
                        />
                        <p className="text-lg text-slate-600 leading-relaxed">{subtitle || 'Sourced from sustainable tanneries, develops a unique patina over time.'}</p>
                        <div className="pt-6">
                            <ButtonBlock
                                label="Discover Details - $285"
                                style="primary"
                                size="lg"
                                className="bg-slate-900 text-white rounded-xl shadow-xl hover:bg-emerald-600"
                            />
                        </div>
                    </div>

                    <div className={cn('relative', isRight ? 'order-1 lg:order-2' : 'order-1 lg:order-1')}>
                        <div className="aspect-[4/5] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl z-10 relative">
                            <SmartImage
                                src={backgroundImageUrl || DEFAULT_IMG}
                                alt="Product"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div className="absolute -bottom-8 -right-8 w-full h-full border-2 border-emerald-500 rounded-3xl z-0" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export const productHighlightSchema = {
    name: 'Product Highlight',
    category: 'Products',
    settings: [
        { id: 'backgroundImageUrl', type: 'image', label: 'Ảnh sản phẩm' },
        { id: 'title', type: 'text', label: 'Tiêu đề sản phẩm' },
        { id: 'subtitle', type: 'textarea', label: 'Mô tả ngắn' },
        { id: 'mediaLayout', type: 'segmented', label: 'Vị trí hình ảnh', options: ['left', 'right'] },
    ],
};
