import React from 'react';
import { cn } from '../../lib/utils';

export interface MediaBlockProps {
    url?: string;
    type?: 'image' | 'video';
    fit?: 'cover' | 'contain' | 'fill';
    aspectRatio?: 'auto' | 'square' | 'video' | 'portrait';
    altText?: string;
    className?: string;
}

export function MediaBlock({
    url,
    type = 'image',
    fit = 'cover',
    aspectRatio = 'auto',
    altText = "Media block",
    className
}: MediaBlockProps) {
    const fitClasses = {
        cover: 'object-cover',
        contain: 'object-contain',
        fill: 'object-fill'
    };

    const aspectClasses = {
        auto: 'aspect-auto',
        square: 'aspect-square',
        video: 'aspect-video',
        portrait: 'aspect-[3/4]'
    };

    const renderPlaceholder = () => (
        <div className="w-full h-full min-h-[200px] bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-image opacity-50"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
        </div>
    );

    return (
        <div className={cn(
            "w-full overflow-hidden rounded-md",
            aspectClasses[aspectRatio],
            className
        )}>
            {!url ? (
                renderPlaceholder()
            ) : type === 'image' ? (
                <img 
                    src={url} 
                    alt={altText}
                    className={cn("w-full h-full", fitClasses[fit])}
                    loading="lazy"
                />
            ) : (
                <video 
                    src={url}
                    className={cn("w-full h-full", fitClasses[fit])}
                    autoPlay
                    muted
                    loop
                    playsInline
                />
            )}
        </div>
    );
}

export const mediaSchema = {
    name: 'Media',
    category: 'Atomic Blocks',
    settings: [
        { id: 'url', type: 'resource_picker', label: 'Hình ảnh/Video' },
        { id: 'type', type: 'segmented', label: 'Loại', options: ['image', 'video'] },
        { id: 'fit', type: 'select', label: 'Kiểu hiển thị', options: ['cover', 'contain', 'fill'] },
        { id: 'aspectRatio', type: 'select', label: 'Tỉ lệ khung hình', options: ['auto', 'square', 'video', 'portrait'] },
        { id: 'altText', type: 'text', label: 'Văn bản thay thế (Alt text)' }
    ]
};
