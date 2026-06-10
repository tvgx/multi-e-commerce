import React from 'react';
import { UIComponentRef } from '@ecommerce/schema';
import { HeadingBlock } from '../../blocks/heading';
import { TextBlock } from '../../blocks/text';
import { ButtonBlock } from '../../blocks/button';
import { MediaBlock } from '../../blocks/media';
import { SmartImage } from '../../blocks/SmartImage';

interface HeroProps {
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
    blocks?: UIComponentRef[];
}

export function Hero({
    backgroundImageUrl,
    backgroundColor,
    textColor,
    fontFamily,
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
