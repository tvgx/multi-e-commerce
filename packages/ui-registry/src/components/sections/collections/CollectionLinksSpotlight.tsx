import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

const DEFAULT_IMG = 'http://localhost:9000/assets/default-component.png';

interface CollectionLinksSpotlightProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    textColor?: string;
    fontFamily?: string;
}

export function CollectionLinksSpotlight({
    title,
    subtitle,
    backgroundImageUrl,
    ctaText,
    ctaLink,
    backgroundColor,
    textColor,
    fontFamily,
}: CollectionLinksSpotlightProps) {
    return (
        <section className="w-full py-20 px-4 md:px-12" style={{ backgroundColor: backgroundColor || '#ffffff', color: textColor || '#0f172a', fontFamily: fontFamily || 'inherit' }}>
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold leading-tight">{title || 'Curated Collections'}</h2>
                    <p className="text-lg opacity-80">{subtitle || 'Discover pieces that speak to your style. Handpicked by our experts for the season ahead.'}</p>

                    <div className="flex flex-col space-y-4">
                        <a href="#" className="text-2xl font-bold hover:text-brand hover:translate-x-2 transition-transform flex items-center justify-between border-b border-current/20 pb-4">
                            Womenswear
                        </a>
                        <a href="#" className="text-2xl font-bold hover:text-brand hover:translate-x-2 transition-transform flex items-center justify-between border-b border-current/20 pb-4">
                            Menswear
                        </a>
                        <a href="#" className="text-2xl font-bold hover:text-brand hover:translate-x-2 transition-transform flex items-center justify-between border-b border-current/20 pb-4">
                            Accessories
                        </a>
                    </div>
                </div>

                <div className="flex-1 w-full h-[600px] rounded-[2rem] overflow-hidden relative group">
                    <SmartImage
                        src={backgroundImageUrl || DEFAULT_IMG}
                        alt="Spotlight Collection"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                        <div className="text-white">
                            <span className="bg-brand text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Featured</span>
                            <h3 className="text-3xl font-bold">{ctaText || 'The Autumn Edit'}</h3>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
