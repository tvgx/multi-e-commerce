import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface CollectionListsEditorialProps {
    title?: string;
    showViewAll?: string;
    viewAllLink?: string;
    collectionId?: string;
    mainImage?: string;
}

export function CollectionListsEditorial({
    title = 'Curated For You',
    showViewAll = 'yes',
    viewAllLink = '#',
    collectionId,
    mainImage,
}: CollectionListsEditorialProps) {
    const finalImage = mainImage || DEFAULT_IMG;
    const items = [1, 2];

    return (
        <section className="w-full py-24 px-4 md:px-12 bg-brand text-white">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="flex flex-col gap-12">
                        {title && (
                            <HeadingBlock
                                content={title}
                                level="h2"
                                alignment="left"
                                className="text-4xl font-bold mb-4"
                            />
                        )}

                        {items.map((i) => (
                            <div key={i} className="flex flex-col border-b border-white/20 pb-12 group">
                                <span className="text-brand font-mono mb-2">0{i}</span>
                                <a href="#" className="text-4xl md:text-5xl font-bold hover:text-brand transition-colors mb-4">Collection {i}</a>
                                <p className="text-white/80 max-w-sm mb-6">Lightweight fabrics and vibrant patterns for the warmer days ahead.</p>
                                <ButtonBlock
                                    label="Shop Now"
                                    link="#"
                                    style="link"
                                    className="text-brand hover:text-white uppercase tracking-widest text-sm font-bold"
                                />
                            </div>
                        ))}

                        {showViewAll === 'yes' && (
                            <div className="pt-4">
                                <ButtonBlock
                                    label="Xem tất cả bộ sưu tập"
                                    link={viewAllLink}
                                    style="outline"
                                    className="border-brand text-brand hover:bg-brand hover:text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <div className="w-full aspect-[4/5] overflow-hidden rounded-t-full relative bg-brand">
                        <SmartImage
                            src={finalImage}
                            alt="Editorial"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}

export const collectionListsEditorialSchema = {
    name: 'Featured Collection (Editorial)',
    category: 'Collections',
    settings: [
        { id: 'title', type: 'text', label: 'Tiêu đề' },
        { id: 'showViewAll', type: 'segmented', label: 'Nút Xem tất cả', options: ['yes', 'no'] },
        { id: 'viewAllLink', type: 'page_selector', label: 'Link Xem tất cả' },
        { id: 'mainImage', type: 'image', label: 'Ảnh Editorial chính' },
    ],
};
