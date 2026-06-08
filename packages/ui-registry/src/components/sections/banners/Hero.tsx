import React from 'react';
import Image from 'next/image';
import { UIComponentRef } from '@ecommerce/schema';
import { HeadingBlock } from '../../blocks/heading';
import { TextBlock } from '../../blocks/text';
import { ButtonBlock } from '../../blocks/button';
import { MediaBlock } from '../../blocks/media';

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

    const finalImage = backgroundImageUrl || "http://localhost:9000/assets/default-2.png";

    return (
        <section className="relative w-full h-[600px] flex items-center justify-center overflow-hidden" style={containerStyle}>
            <div className="absolute inset-0 z-0">
                <Image
                    src={finalImage}
                    alt="Hero Background"
                    fill
                    className="object-cover opacity-50"
                    priority
                />
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
        { id: 'desktopLayout', type: 'segmented', label: 'Desktop layout', options: ['Full width', 'Container'] },
        { id: 'backgroundImageUrl', type: 'resource_picker', label: 'Background image' },
        { id: 'backgroundColor', type: 'color', label: 'Background color' },
        { id: 'textColor', type: 'color', label: 'Text color' }
    ]
};
