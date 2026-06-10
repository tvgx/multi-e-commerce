import React from 'react';
import { HeadingBlock } from '../../blocks/heading';
import { ButtonBlock } from '../../blocks/button';
import { cn } from '../../../lib/utils';
import { SmartImage } from '../../blocks/SmartImage';

interface CollectionListsGridProps {
    title?: string;
    showViewAll?: string;
    viewAllLink?: string;
    collectionId?: string;
    columns?: number;
    maxItems?: number;
}

export function CollectionListsGrid({
    title = "Explore Categories",
    showViewAll = "yes",
    viewAllLink = "#",
    collectionId,
    columns = 4,
    maxItems = 8
}: CollectionListsGridProps) {
    const items = Array.from({ length: maxItems }, (_, i) => i + 1);
    
    // Dynamic grid cols class based on property
    const gridColsClass = {
        2: 'grid-cols-2',
        3: 'grid-cols-2 md:grid-cols-3',
        4: 'grid-cols-2 md:grid-cols-4',
        5: 'grid-cols-3 md:grid-cols-5',
        6: 'grid-cols-3 md:grid-cols-6',
    }[columns] || 'grid-cols-2 md:grid-cols-4';

    return (
        <section className="w-full py-20 px-4 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="flex justify-between items-end mb-12">
                    <HeadingBlock 
                        content={title} 
                        level="h2" 
                        alignment="center"
                        className="text-3xl font-bold text-slate-900 m-0 p-0"
                    />
                    {showViewAll === 'yes' && (
                        <ButtonBlock 
                            label="Xem tất cả" 
                            link={viewAllLink}
                            style="link"
                        />
                    )}
                </div>

                <div className={cn("grid gap-4 md:gap-8", gridColsClass)}>
                    {items.map((item, i) => (
                        <a href="#" key={i} className="flex flex-col items-center group">
                            <div className="w-full aspect-square rounded-full overflow-hidden mb-4 bg-slate-100 p-2 border-2 border-transparent group-hover:border-emerald-500 transition-colors">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-200">
                                    <SmartImage src={`http://localhost:9000/assets/default-3.png`} alt={`Category ${item}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" sizes="(min-width: 768px) 16vw, 33vw" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors text-center">Category {item}</h3>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}

export const collectionListsGridSchema = {
    name: 'Featured Collection (Grid)',
    category: 'Collections',
    settings: [
        { id: 'title', type: 'text', label: 'Tiêu đề' },
        { id: 'showViewAll', type: 'segmented', label: 'Nút Xem tất cả', options: ['yes', 'no'] },
        { id: 'viewAllLink', type: 'page_selector', label: 'Link Xem tất cả' },
        { id: 'collectionId', type: 'resource_picker', label: 'Nguồn dữ liệu (Collection)' },
        { id: 'columns', type: 'slider', label: 'Số cột hiển thị', min: 2, max: 6 },
        { id: 'maxItems', type: 'slider', label: 'Số lượng hiển thị', min: 2, max: 12 }
    ]
};
