import React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonBlockProps {
    label?: string;
    link?: string;
    style?: 'primary' | 'secondary' | 'outline' | 'link';
    size?: 'sm' | 'md' | 'lg' | 'full';
    alignment?: 'left' | 'center' | 'right';
    className?: string;
}

export function ButtonBlock({
    label = "Nhấn vào đây",
    link = "#",
    style = 'primary',
    size = 'md',
    alignment = 'left',
    className
}: ButtonBlockProps) {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50";
    
    const styleClasses = {
        primary: "bg-zinc-900 text-white hover:bg-zinc-900/90 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-50/90 shadow",
        secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-100/80 dark:bg-zinc-800 dark:text-zinc-50 dark:hover:bg-zinc-800/80",
        outline: "border border-zinc-200 bg-transparent hover:bg-zinc-100 text-zinc-900 dark:border-zinc-800 dark:hover:bg-zinc-800 dark:text-zinc-50",
        link: "text-zinc-900 underline-offset-4 hover:underline dark:text-zinc-50 bg-transparent p-0"
    };

    const sizeClasses = {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2 text-sm",
        lg: "h-12 px-8 text-base",
        full: "h-10 w-full px-4 py-2 text-sm"
    };

    const alignWrapper = {
        left: 'flex justify-start',
        center: 'flex justify-center',
        right: 'flex justify-end'
    };

    const Wrapper = size === 'full' ? 'div' : 'div';

    return (
        <Wrapper className={cn(alignWrapper[alignment], "w-full")}>
            <a 
                href={link} 
                className={cn(
                    baseClasses,
                    styleClasses[style],
                    style !== 'link' && sizeClasses[size],
                    className
                )}
            >
                {label}
            </a>
        </Wrapper>
    );
}

export const buttonSchema = {
    name: 'Button',
    category: 'Atomic Blocks',
    settings: [
        { id: 'label', type: 'text', label: 'Nhãn nút' },
        { id: 'link', type: 'page_selector', label: 'Liên kết đích' },
        { id: 'style', type: 'select', label: 'Kiểu nút', options: ['primary', 'secondary', 'outline', 'link'] },
        { id: 'size', type: 'select', label: 'Kích thước', options: ['sm', 'md', 'lg', 'full'] },
        { id: 'alignment', type: 'segmented', label: 'Căn lề', options: ['left', 'center', 'right'] }
    ]
};
