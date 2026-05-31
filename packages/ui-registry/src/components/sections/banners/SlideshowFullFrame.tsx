import React from 'react';

interface SlideshowFullFrameProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    fontFamily?: string;
}

export function SlideshowFullFrame({
    title,
    subtitle,
    backgroundImageUrl,
    ctaText,
    ctaLink,
    fontFamily
}: SlideshowFullFrameProps) {
    return (
        <section className="relative w-full h-screen min-h-[600px] flex items-center" style={{ fontFamily: fontFamily || 'inherit' }}>
            <div className="absolute inset-0 z-0">
                <img
                    src={backgroundImageUrl || "http://localhost:9000/assets/default-4.png"}
                    alt="Full Frame Slideshow"
                    className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20"></div>
            </div>

            <div className="relative z-10 container mx-auto px-4 flex justify-between items-center">
                <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors border border-white/30 hidden md:flex">
                    &larr;
                </button>

                <div className="text-center text-white px-8 mx-auto">
                    <h2 className="text-6xl md:text-8xl font-bold mb-4 whitespace-pre-line">{title || "Spring Bloom"}</h2>
                    <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{subtitle || "Vibrant colors and lightweight fabrics for the new season."}</p>
                    <a 
                        href={ctaLink || "#"} 
                        className="border-2 border-white text-white hover:bg-white hover:text-slate-900 px-10 py-3 rounded-full font-bold uppercase tracking-widest transition-colors inline-block"
                    >
                        {ctaText || "Discover"}
                    </a>
                </div>

                <button className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors border border-white/30 hidden md:flex">
                    &rarr;
                </button>
            </div>

            {/* Indicators */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-10">
                <div className="w-12 h-1 bg-white rounded-full"></div>
                <div className="w-12 h-1 bg-white/40 rounded-full cursor-pointer hover:bg-white/70"></div>
                <div className="w-12 h-1 bg-white/40 rounded-full cursor-pointer hover:bg-white/70"></div>
            </div>
        </section>
    );
}
