"use client";
import React, { useState } from 'react';
import { SmartImage } from '../../blocks/SmartImage';

interface SlideBlock {
    id: string;
    componentId: string;
    props: any;
}

interface SlideshowFullFrameProps {
    backgroundColor?: string;
    height?: string;
    blocks?: SlideBlock[];
}

export function SlideshowFullFrame({
    backgroundColor = '#000000',
    height = '100vh',
    blocks = [],
}: SlideshowFullFrameProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = blocks.filter(b => b.componentId === 'SlideItem');

    if (slides.length === 0) {
        return (
            <section
                className="relative w-full flex items-center justify-center border-2 border-dashed border-zinc-300 text-zinc-500 min-h-[400px]"
                style={{ backgroundColor, height }}
            >
                <p className="text-sm">Chưa có slide. Thêm &quot;Slide Ảnh&quot; từ panel bên trái.</p>
            </section>
        );
    }

    const slide = slides[activeIndex]?.props || {};
    const prev = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex(i => (i - 1 + slides.length) % slides.length);
    };
    const next = (e: React.MouseEvent) => {
        e.stopPropagation();
        setActiveIndex(i => (i + 1) % slides.length);
    };

    return (
        <section className="relative w-full overflow-hidden" style={{ height, minHeight: 400 }}>
            {/* Background image */}
            <div className="absolute inset-0 z-0 transition-all duration-700">
                <SmartImage
                    src={slide.backgroundImageUrl || 'http://localhost:9000/assets/default-component.png'}
                    alt="Slide"
                    className="w-full h-full object-cover"
                    priority
                />
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundColor: slide.overlayColor || '#000',
                        opacity: slide.overlayOpacity ?? 0.3,
                    }}
                />
            </div>

            {/* Content */}
            <div className="relative z-10 w-full h-full flex justify-between items-center px-6 md:px-12">
                <button
                    onClick={prev}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors border border-white/30 shrink-0"
                >
                    &#8592;
                </button>

                <div className="text-center px-8 flex-1" style={{ color: slide.textColor || '#ffffff' }}>
                    <h2 className="text-5xl md:text-7xl font-bold mb-4 whitespace-pre-line">
                        {slide.title || 'Tiêu đề slide'}
                    </h2>
                    {slide.subtitle && (
                        <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">{slide.subtitle}</p>
                    )}
                    {slide.ctaText && (
                        <a
                            href={slide.ctaLink || '#'}
                            onClick={e => e.stopPropagation()}
                            className="border-2 border-current px-10 py-3 rounded-full font-bold uppercase tracking-widest hover:bg-white/20 transition-colors inline-block"
                        >
                            {slide.ctaText}
                        </a>
                    )}
                </div>

                <button
                    onClick={next}
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white hover:text-slate-900 transition-colors border border-white/30 shrink-0"
                >
                    &#8594;
                </button>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-3 z-10">
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                        className={`h-1 rounded-full transition-all duration-300 ${
                            idx === activeIndex ? 'w-12 bg-white' : 'w-12 bg-white/40 hover:bg-white/70'
                        }`}
                    />
                ))}
            </div>
        </section>
    );
}
