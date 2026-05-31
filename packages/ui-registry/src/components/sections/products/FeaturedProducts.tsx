import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { cn } from '../../../lib/utils';

interface FeaturedProductProps {
    productId?: string;
    mediaLayout?: string; // 'left' | 'right'
}

export function FeaturedProducts({
    productId,
    mediaLayout = 'left'
}: FeaturedProductProps) {
    const isRight = mediaLayout === 'right';

    return (
        <section className="w-full py-20 px-4 md:px-12 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className={cn("lg:w-1/2 w-full", isRight ? "lg:order-2" : "lg:order-1")}>
                    <div className="aspect-square bg-slate-800 rounded-full overflow-hidden relative shadow-[0_0_50px_rgba(16,185,129,0.2)] p-4">
                        <div className="w-full h-full rounded-full overflow-hidden border border-slate-700">
                            <img src="http://localhost:9000/assets/default-1.png" alt="Featured Product" className="w-full h-full object-cover scale-110" />
                        </div>
                        {/* Floating elements */}
                        <div className="absolute top-1/4 -left-4 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold shadow-xl rotate-[-5deg]">★ Top Rated</div>
                        <div className="absolute bottom-1/4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-xl rotate-[5deg]">Limited Stock</div>
                    </div>
                </div>

                <div className={cn("lg:w-1/2 w-full space-y-8 text-center lg:text-left", isRight ? "lg:order-1" : "lg:order-2")}>
                    <HeadingBlock 
                        content="The Ultimate Everyday Sneaker." 
                        level="h2" 
                        alignment="left"
                        className="text-5xl md:text-6xl font-black italic tracking-tighter"
                    />
                    <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        Engineered for all-day comfort with our proprietary cloud-foam tech. This isn&apos;t just a shoe, it&apos;s a statement.
                    </p>

                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-500 ring-2 ring-white ring-offset-2 ring-offset-slate-900 cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-black border border-slate-600 cursor-pointer"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                        <span className="text-4xl font-bold">$149.00</span>
                        <ButtonBlock 
                            label="Add To Cart"
                            style="primary"
                            size="lg"
                            className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 rounded-full shadow-lg shadow-emerald-500/20"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

export const featuredProductSchema = {
    name: 'Featured Product',
    category: 'Products',
    settings: [
        { id: 'productId', type: 'resource_picker', label: 'Sản phẩm nổi bật' },
        { id: 'mediaLayout', type: 'segmented', label: 'Vị trí hình ảnh', options: ['left', 'right'] }
    ]
};
