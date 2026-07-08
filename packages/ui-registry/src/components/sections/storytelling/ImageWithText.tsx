import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';

interface ImageWithTextProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    layout?: string;
    backgroundColor?: string;
    textColor?: string;
}

export function ImageWithText({
    title,
    subtitle,
    backgroundImageUrl,
    ctaText,
    ctaLink,
    layout = 'image_first',
    backgroundColor,
    textColor,
}: ImageWithTextProps) {
    const isImageFirst = layout !== 'text_first';

    return (
        <section className="w-full overflow-hidden" style={{ backgroundColor: backgroundColor || '#ffffff' }}>
            <div className={`flex flex-col min-h-[600px] ${isImageFirst ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}>
                {/* Image */}
                <div className="w-full lg:w-1/2 relative h-[400px] lg:h-auto">
                    <SmartImage
                        src={backgroundImageUrl || DEFAULT_IMG}
                        alt={title || 'Image'}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2 flex items-center justify-center p-12 md:p-24" style={{ backgroundColor: backgroundColor || '#f8fafc' }}>
                    <div className="max-w-lg">
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight" style={{ color: textColor || '#0f172a' }}>
                            {title || 'Cozy up for the incoming season.'}
                        </h2>
                        <p className="text-lg mb-8 leading-relaxed opacity-80" style={{ color: textColor || '#0f172a' }}>
                            {subtitle || 'Discover our new range of heavy knits and insulated outerwear. Designed to keep you warm without sacrificing your silhouette.'}
                        </p>
                        <button className="bg-slate-900 hover:bg-brand text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest">
                            {ctaText || 'Shop The Lookbook'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
