import type { CSSProperties } from 'react';

/**
 * Map các prop tùy chỉnh sâu (paddingY/headingSize/màu) của section sản phẩm
 * sang style/class. Dùng chung để các section hiển thị nhất quán.
 */

const PADDING_Y: Record<string, string> = {
    compact: '2.5rem',
    normal: '5rem',
    spacious: '7rem',
};

export function sectionStyle(opts: {
    paddingY?: string;
    backgroundColor?: string;
    textColor?: string;
}): CSSProperties {
    const pad = PADDING_Y[opts.paddingY || 'normal'] || PADDING_Y.normal;
    return {
        paddingTop: pad,
        paddingBottom: pad,
        ...(opts.backgroundColor ? { backgroundColor: opts.backgroundColor } : {}),
        ...(opts.textColor ? { color: opts.textColor } : {}),
    };
}

const HEADING_SIZE: Record<string, string> = {
    sm: 'text-2xl md:text-3xl',
    md: 'text-4xl',
    lg: 'text-5xl md:text-6xl',
};

export function headingSizeClass(size?: string): string {
    return HEADING_SIZE[size || 'md'] || HEADING_SIZE.md;
}
