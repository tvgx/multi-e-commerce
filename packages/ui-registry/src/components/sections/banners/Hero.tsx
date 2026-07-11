import React from 'react';
import { UIComponentRef } from '@ecommerce/schema';
import { HeadingBlock } from '../../blocks/heading';
import { TextBlock } from '../../blocks/text';
import { ButtonBlock } from '../../blocks/button';
import { MediaBlock } from '../../blocks/media';
import { SmartImage } from '../../blocks/SmartImage';
import { shopHref } from '../../../lib/href';

interface HeroProps {
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    // Simple CTA driven by section props (used by the starter/seeded Hero and the
    // navigation editor, which writes the destination URL into `ctaLink`). Themes
    // that build their CTA from a Button block can leave these empty.
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    /** Base path của shop (vd `/my-shop`) — pageContext truyền xuống để link nội bộ giữ đúng slug. */
    basePath?: string;
    blocks?: UIComponentRef[];
}

export function Hero({
    backgroundImageUrl,
    backgroundColor,
    textColor,
    fontFamily,
    title,
    subtitle,
    ctaText,
    ctaLink,
    basePath,
    blocks = []
}: HeroProps) {
    const containerStyle = {
        backgroundColor: backgroundColor || '#0f172a',
        color: textColor || '#ffffff',
        fontFamily: fontFamily || 'inherit',
    };

    const finalImage = backgroundImageUrl || '';

    return (
        <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden" style={containerStyle}>
            <div className="absolute inset-0 z-0">
                {finalImage ? (
                    <SmartImage
                        src={finalImage}
                        alt="Hero Background"
                        className="w-full h-full object-cover opacity-50"
                        priority
                    />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900" />
                )}
            </div>
            <div className="relative z-10 text-center max-w-3xl px-4">
                {title && <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">{title}</h1>}
                {subtitle && <p className="text-lg opacity-90 mb-6 max-w-2xl mx-auto">{subtitle}</p>}
                {ctaText && (
                    <a
                        href={ctaLink ? shopHref(basePath || '', ctaLink) : '#'}
                        className="inline-flex items-center justify-center rounded-md bg-white text-zinc-900 px-8 h-12 text-base font-medium shadow hover:bg-white/90 transition-colors mb-2"
                    >
                        {ctaText}
                    </a>
                )}
                {blocks.map(block => {
                    if (block.isHidden) return null;
                    const props: any = block.props || {};

                    switch (block.componentId) {
                        case 'Heading':
                            return <HeadingBlock key={block.id} content={props.content || 'Heading Placeholder'} {...props} />;
                        case 'Text':
                            return <TextBlock key={block.id} content={props.content || 'Text Placeholder'} {...props} />;
                        case 'Button':
                            return <ButtonBlock key={block.id} label={props.label || 'Button Placeholder'} {...props} />;
                        case 'Media':
                            return <MediaBlock key={block.id} {...props} />;
                        default:
                            return null;
                    }
                })}
            </div>
        </section>
    );
}

export const heroSchema = {
    name: 'Hero banner',
    category: 'Banners',
    allowedBlocks: ['Heading', 'Text', 'Button', 'Media'],
    settings: [
        { id: 'backgroundImageUrl', type: 'image', label: 'Background image' },
        { id: 'backgroundColor', type: 'color', label: 'Background color' },
        { id: 'textColor', type: 'color', label: 'Text color' },
        { id: 'fontFamily', type: 'font', label: 'Font family' }
    ]
};
