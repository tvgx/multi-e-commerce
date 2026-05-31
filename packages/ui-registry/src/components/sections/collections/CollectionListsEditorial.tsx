import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';

interface CollectionListsEditorialProps {
    title?: string;
    showViewAll?: string;
    viewAllLink?: string;
    collectionId?: string;
    mainImage?: string;
}

export function CollectionListsEditorial({
    title = "Curated For You",
    showViewAll = "yes",
    viewAllLink = "#",
    collectionId,
    mainImage
}: CollectionListsEditorialProps) {
    const finalImage = mainImage || "http://localhost:9000/assets/default-4.png";
    const items = [1, 2];

    return (
        <section className="w-full py-24 px-4 md:px-12 bg-emerald-950 text-emerald-50">
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
                            <div key={i} className="flex flex-col border-b border-emerald-800 pb-12 group">
                                <span className="text-emerald-500 font-mono mb-2">0{i}</span>
                                <a href="#" className="text-4xl md:text-5xl font-bold hover:text-emerald-400 transition-colors mb-4">Collection {i}</a>
                                <p className="text-emerald-200/80 max-w-sm mb-6">Lightweight fabrics and vibrant patterns for the warmer days ahead.</p>
                                <ButtonBlock 
                                    label="Shop Now" 
                                    link="#"
                                    style="link"
                                    className="text-emerald-400 hover:text-white uppercase tracking-widest text-sm font-bold"
                                />
                            </div>
                        ))}

                        {showViewAll === 'yes' && (
                            <div className="pt-4">
                                <ButtonBlock 
                                    label="Xem tất cả bộ sưu tập" 
                                    link={viewAllLink}
                                    style="outline"
                                    className="border-emerald-500 text-emerald-400 hover:bg-emerald-500 hover:text-white"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <div className="w-full aspect-[4/5] overflow-hidden rounded-t-full relative bg-emerald-900">
                        <img src={finalImage} alt="Editorial" className="absolute inset-0 w-full h-full object-cover" />
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
        { id: 'collectionId', type: 'resource_picker', label: 'Nguồn dữ liệu (Collection)' },
        { id: 'mainImage', type: 'resource_picker', label: 'Ảnh Editorial chính' }
    ]
};
