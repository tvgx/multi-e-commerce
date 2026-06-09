"use client";
import React, { useRef } from 'react';

interface SlideBlock {
    id: string;
    componentId: string;
    props: any;
}

interface CarouselProps {
    title?: string;
    backgroundColor?: string;
    textColor?: string;
    blocks?: SlideBlock[];
}

export function Carousel({
    title,
    backgroundColor = '#0f172a',
    textColor = '#ffffff',
    blocks = [],
}: CarouselProps) {
    const trackRef = useRef<HTMLDivElement>(null);
    const slides = blocks.filter(b => b.componentId === 'SlideItem');

    const scroll = (dir: 'prev' | 'next') => (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!trackRef.current) return;
        const itemWidth = trackRef.current.querySelector('div')?.offsetWidth || 0;
        trackRef.current.scrollBy({ left: dir === 'next' ? itemWidth + 16 : -(itemWidth + 16), behavior: 'smooth' });
    };

    const placeholders = [1, 2, 3];

    return (
        <section className="w-full py-16 overflow-hidden" style={{ backgroundColor }}>
            <div className="max-w-7xl mx-auto mb-8 px-4 flex items-center justify-between">
                <h2 className="text-3xl font-bold" style={{ color: textColor }}>
                    {title || 'Visual Stories'}
                </h2>
                <div className="flex gap-2">
                    <button
                        onClick={scroll('prev')}
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                        &#8592;
                    </button>
                    <button
                        onClick={scroll('next')}
                        className="w-10 h-10 rounded-full border border-white/20 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
                    >
                        &#8594;
                    </button>
                </div>
            </div>

            <div
                ref={trackRef}
                className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory pb-4 scrollbar-none"
                style={{ scrollbarWidth: 'none' }}
            >
                {slides.length === 0
                    ? placeholders.map(i => (
                        <div
                            key={i}
                            className="min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] aspect-[3/4] snap-center bg-slate-700/50 rounded-2xl flex-shrink-0"
                        />
                    ))
                    : slides.map(slide => {
                        const p = slide.props || {};
                        return (
                            <div
                                key={slide.id}
                                className="min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] aspect-[3/4] snap-center relative rounded-2xl overflow-hidden flex-shrink-0"
                            >
                                <img
                                    src={p.backgroundImageUrl || 'http://localhost:9000/assets/default-2.png'}
                                    alt={p.title || 'Slide'}
                                    className="w-full h-full object-cover"
                                />
                                {/* Overlay */}
                                <div
                                    className="absolute inset-0"
                                    style={{
                                        backgroundColor: p.overlayColor || '#000',
                                        opacity: p.overlayOpacity ?? 0.4,
                                    }}
                                />
                                {/* Text */}
                                {(p.title || p.ctaText) && (
                                    <div className="absolute bottom-0 left-0 right-0 p-6" style={{ color: p.textColor || '#ffffff' }}>
                                        {p.title && <h3 className="font-bold text-xl mb-1">{p.title}</h3>}
                                        {p.subtitle && <p className="text-sm opacity-80 mb-2">{p.subtitle}</p>}
                                        {p.ctaText && (
                                            <a
                                                href={p.ctaLink || '#'}
                                                onClick={e => e.stopPropagation()}
                                                className="text-sm underline hover:opacity-80 transition-opacity"
                                            >
                                                {p.ctaText}
                                            </a>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })
                }
            </div>
        </section>
    );
}
