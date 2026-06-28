import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { SmartImage } from '../../blocks/SmartImage';

interface CollectionListsCarouselProps {
    title?: string;
    showViewAll?: string; // 'yes' or 'no'
    viewAllLink?: string;
    collectionId?: string;
    maxItems?: number;
}

export function CollectionListsCarousel({
    title = "Trending Collections",
    showViewAll = "yes",
    viewAllLink = "#",
    collectionId,
    maxItems = 5
}: CollectionListsCarouselProps) {
    // Dummy items based on maxItems
    const items = Array.from({ length: maxItems }, (_, i) => i + 1);

    return (
        <section className="w-full py-20 bg-white overflow-hidden">
            <div className="px-4 md:px-12 mb-10 flex justify-between items-end">
                <HeadingBlock 
                    content={title} 
                    level="h2" 
                    alignment="left"
                    className="text-3xl font-bold text-slate-900 m-0 p-0"
                />
                <div className="flex gap-4 items-center">
                    {showViewAll === 'yes' && (
                        <ButtonBlock 
                            label="Xem tất cả" 
                            link={viewAllLink}
                            style="link"
                            className="hidden md:inline-flex"
                        />
                    )}
                    <div className="flex gap-2">
                        <button className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50">&larr;</button>
                        <button className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50">&rarr;</button>
                    </div>
                </div>
            </div>

            <div className="flex gap-6 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8">
                {items.map((i) => (
                    <a href="#" key={i} className="min-w-[280px] md:min-w-[350px] snap-center group block">
                        <div className="w-full h-[400px] rounded-2xl overflow-hidden mb-4 relative bg-slate-100">
                            <SmartImage src={`http://localhost:9000/assets/default-2.png`} alt="Collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" sizes="(min-width: 768px) 33vw, 80vw" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand transition-colors">Collection {i}</h3>
                        <p className="text-slate-500 mt-1 text-sm font-medium">Explore Items &rarr;</p>
                    </a>
                ))}
            </div>
        </section>
    );
}

export const collectionListsCarouselSchema = {
    name: 'Featured Collection (Carousel)',
    category: 'Collections',
    settings: [
        { id: 'title', type: 'text', label: 'Tiêu đề' },
        { id: 'showViewAll', type: 'segmented', label: 'Nút Xem tất cả', options: ['yes', 'no'] },
        { id: 'viewAllLink', type: 'page_selector', label: 'Link Xem tất cả' },
        { id: 'collectionId', type: 'resource_picker', label: 'Nguồn dữ liệu (Collection)' },
        { id: 'maxItems', type: 'slider', label: 'Số lượng hiển thị', min: 3, max: 10 }
    ]
};
