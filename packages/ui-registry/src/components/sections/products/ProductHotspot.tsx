import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { UIComponentRef } from '@ecommerce/schema';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';

interface ProductHotspotProps {
    mainImage?: string;
    blocks?: UIComponentRef[];
}

export function ProductHotspot({
    mainImage,
    blocks = [],
}: ProductHotspotProps) {
    const finalImage = mainImage || DEFAULT_IMG;

    return (
        <section className="w-full py-24 bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 text-center mb-16">
                <HeadingBlock
                    content="Explore The Setup"
                    level="h2"
                    alignment="center"
                    className="text-4xl md:text-5xl font-bold text-slate-900 mb-6"
                />
                <p className="text-lg text-slate-600 mx-auto max-w-2xl">Hover over the pulsing markers to discover the individual pieces that make up this curated look.</p>
            </div>

            <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl">
                <SmartImage
                    src={finalImage}
                    alt="Room Setup"
                    className="w-full h-auto object-contain"
                />

                {blocks.map(block => {
                    if (block.isHidden) return null;
                    const props: any = block.props || {};
                    if (block.componentId === 'HotspotBlock') {
                        return <HotspotBlock key={block.id} {...props} />;
                    }
                    return null;
                })}
            </div>
        </section>
    );
}

export interface HotspotBlockProps {
    productId?: string;
    horizontalPosition?: number;
    verticalPosition?: number;
}

export function HotspotBlock({
    productId,
    horizontalPosition = 50,
    verticalPosition = 50,
}: HotspotBlockProps) {
    return (
        <div
            className="absolute group"
            style={{
                left: `${horizontalPosition}%`,
                top: `${verticalPosition}%`,
                transform: 'translate(-50%, -50%)',
            }}
        >
            <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center relative cursor-pointer z-10 text-brand">
                <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75" />
                <span className="relative font-bold text-xs">+</span>
            </div>
            <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-white p-3 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-20 origin-bottom">
                <p className="font-bold text-sm text-slate-900">Product {productId || 'Item'}</p>
                <p className="font-bold text-brand text-sm mt-1">$99.00</p>
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45" />
            </div>
        </div>
    );
}

export const productHotspotSchema = {
    name: 'Product Hotspots',
    category: 'Products',
    settings: [
        { id: 'mainImage', type: 'image', label: 'Ảnh không gian/người mẫu' },
    ],
};

export const hotspotBlockSchema = {
    name: 'Hotspot Marker',
    category: 'Atomic Blocks',
    settings: [
        { id: 'horizontalPosition', type: 'slider', label: 'Tọa độ X (%)', min: 0, max: 100 },
        { id: 'verticalPosition', type: 'slider', label: 'Tọa độ Y (%)', min: 0, max: 100 },
    ],
};
