import React from 'react';
import { cn } from '../../lib/utils';

export interface TextBlockProps {
    content?: string;
    size?: 'sm' | 'base' | 'lg' | 'xl';
    alignment?: 'left' | 'center' | 'right';
    color?: string;
    className?: string;
}

export function TextBlock({
    content = "Thêm đoạn văn bản của bạn vào đây",
    size = 'base',
    alignment = 'left',
    color,
    className
}: TextBlockProps) {
    const sizeClasses = {
        sm: 'text-sm',
        base: 'text-base',
        lg: 'text-lg',
        xl: 'text-xl'
    };

    const alignClasses = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    };

    return (
        <div 
            className={cn(
                "prose prose-sm md:prose-base dark:prose-invert max-w-none",
                sizeClasses[size],
                alignClasses[alignment],
                className
            )}
            style={{ color: color || undefined }}
        >
            <p>{content}</p>
        </div>
    );
}

export const textSchema = {
    name: 'Text',
    category: 'Atomic Blocks',
    settings: [
        { id: 'content', type: 'text', label: 'Nội dung' },
        { id: 'size', type: 'select', label: 'Kích thước', options: ['sm', 'base', 'lg', 'xl'] },
        { id: 'alignment', type: 'segmented', label: 'Căn lề', options: ['left', 'center', 'right'] },
        { id: 'color', type: 'color', label: 'Màu chữ' }
    ]
};
