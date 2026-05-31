import React from 'react';
import { cn } from '../../lib/utils';

export interface HeadingBlockProps {
    content?: string;
    level?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    className?: string;
}

export function HeadingBlock({
    content = "Tiêu đề khối",
    level = 'h2',
    alignment = 'left',
    color,
    className
}: HeadingBlockProps) {
    const Tag = level;

    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    const sizeClasses = {
        h1: 'text-4xl md:text-5xl font-bold tracking-tight',
        h2: 'text-3xl md:text-4xl font-semibold tracking-tight',
        h3: 'text-2xl md:text-3xl font-semibold',
        h4: 'text-xl md:text-2xl font-medium',
        h5: 'text-lg md:text-xl font-medium',
        h6: 'text-base md:text-lg font-medium'
    };

    return (
        <Tag 
            className={cn(
                sizeClasses[level],
                alignClasses[alignment],
                "mb-4",
                className
            )}
            style={{ color: color || undefined }}
        >
            {content}
        </Tag>
    );
}

export const headingSchema = {
    name: 'Heading',
    category: 'Atomic Blocks',
    settings: [
        { id: 'content', type: 'text', label: 'Tiêu đề' },
        { id: 'level', type: 'select', label: 'Thẻ (H1-H6)', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] },
        { id: 'alignment', type: 'segmented', label: 'Căn lề', options: ['left', 'center', 'right'] },
        { id: 'color', type: 'color', label: 'Màu chữ' }
    ]
};
