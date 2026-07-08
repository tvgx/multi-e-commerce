import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';

interface SplitShowcaseProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

export function SplitShowcase({
    title,
    subtitle,
    backgroundImageUrl,
    ctaText,
    ctaLink,
    backgroundColor,
    textColor,
    fontFamily
}: SplitShowcaseProps) {
    const containerStyle = {
        backgroundColor: backgroundColor || '#064e3b',
        color: textColor || '#ecfdf5',
        fontFamily: fontFamily || 'inherit',
    };

    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[600px]" style={{ fontFamily: containerStyle.fontFamily }}>
            {/* Left Image Half */}
            <div className="relative h-full min-h-[400px]">
                <SmartImage
                    src={backgroundImageUrl || DEFAULT_IMG}
                    fallbackSrc={DEFAULT_IMG}
                    alt="Fashion Model"
                    className="absolute inset-0 w-full h-full object-cover"
                    sizes="(min-width: 768px) 50vw, 100vw"
                    priority
                />
            </div>

            {/* Right Content Half */}
            <div className="flex flex-col justify-center p-12 md:p-20" style={{ backgroundColor: containerStyle.backgroundColor, color: containerStyle.color }}>
                <span className="opacity-80 font-bold uppercase tracking-widest text-sm mb-6 block">Exclusive Release</span>
                <h2 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight whitespace-pre-line">{title || 'The\nEmerald\nCollection.'}</h2>
                <p className="text-lg opacity-90 mb-10 max-w-md">
                    {subtitle || 'Bold, sophisticated, and unapologetically green. Discover the limited edition pieces that define the season.'}
                </p>
                <a
                    href={ctaLink || '#'}
                    className="self-start border px-8 py-3 rounded-none font-medium transition-colors uppercase tracking-widest inline-block"
                    style={{ borderColor: containerStyle.color }}
                >
                    {ctaText || 'Shop The Look'}
                </a>
            </div>
        </section>
    );
}
