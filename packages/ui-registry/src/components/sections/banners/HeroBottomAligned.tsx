import React from 'react';
import { ButtonBlock } from '../../blocks/button';
import { HeadingBlock } from '../../blocks/heading';

interface HeroBottomAlignedProps {
    title?: string;
    subtitle?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

export function HeroBottomAligned({ 
    title, 
    subtitle, 
    ctaText, 
    ctaLink, 
    backgroundImageUrl, 
    backgroundColor, 
    textColor,
    fontFamily
}: HeroBottomAlignedProps) {
    const containerStyle = {
        backgroundColor: backgroundColor || '#f1f5f9', // slate-100 default
        color: textColor || '#0f172a', // slate-900 default
        fontFamily: fontFamily || 'inherit',
    };

    return (
        <section className="relative w-full h-[70vh] min-h-[500px] flex flex-col justify-end pb-20 px-8" style={containerStyle}>
            {backgroundImageUrl && (
                <div className="absolute inset-0 z-0">
                    <img
                        src={backgroundImageUrl}
                        alt="Hero Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/20" />
                </div>
            )}
            <div className="relative z-10 max-w-7xl mx-auto w-full">
                <HeadingBlock 
                    content={title || "The New Standard"} 
                    level="h1" 
                    alignment="left"
                    color={textColor}
                    className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter leading-none"
                />
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <p className="text-xl max-w-xl font-medium opacity-80">
                        {subtitle || "Uncompromising quality meets everyday functionality. Explore the latest arrivals."}
                    </p>
                    <ButtonBlock 
                        label={ctaText || "Explore Collection"} 
                        link={ctaLink || "#"} 
                        style="primary"
                        size="lg"
                        className="rounded-none font-bold tracking-widest uppercase hover:bg-emerald-600 transition-colors w-full md:w-auto text-center"
                    />
                </div>
            </div>
        </section>
    );
}

export const heroBottomAlignedSchema = {
    name: 'Banner Hero (Căn dưới)',
    category: 'Banners',
    settings: [
        { id: 'ctaText', type: 'text', label: 'Nút bấm (Text)' },
        { id: 'ctaLink', type: 'page_selector', label: 'Nút bấm (Link)' },
        { id: 'backgroundImageUrl', type: 'resource_picker', label: 'Ảnh nền / Ảnh chính' },
        { id: 'fontFamily', type: 'text', label: 'Font chữ' },
        { id: 'backgroundColor', type: 'color', label: 'Màu nền' },
        { id: 'textColor', type: 'color', label: 'Màu chữ' }
    ]
};
