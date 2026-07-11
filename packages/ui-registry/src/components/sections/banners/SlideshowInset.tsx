"use client";
import { DEFAULT_IMG } from '../../../lib/media';
import React, { useState } from 'react';
import { SmartImage } from '../../blocks/SmartImage';
import { shopHref } from '../../../lib/href';

interface SlideBlock {
    id: string;
    componentId: string;
    props: any;
}

interface SlideshowInsetProps {
    backgroundColor?: string;
    basePath?: string;
    blocks?: SlideBlock[];
}

export function SlideshowInset({
    backgroundColor = '#ffffff',
    basePath,
    blocks = [],
}: SlideshowInsetProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = blocks.filter(b => b.componentId === 'SlideItem');

    if (slides.length === 0) {
        return (
            <section className="w-full py-16 px-4 md:px-12" style={{ backgroundColor }}>
                <div className="max-w-7xl mx-auto border-2 border-dashed border-zinc-300 rounded-[2rem] h-[70vh] min-h-[500px] flex items-center justify-center text-zinc-500">
                    <p className="text-sm">Chưa có slide. Thêm &quot;Slide Ảnh&quot; từ panel bên trái.</p>
                </div>
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
        <section className="w-full py-16 px-4 md:px-12" style={{ backgroundColor }}>
            <div className="max-w-7xl mx-auto rounded-[2rem] overflow-hidden shadow-2xl relative h-[70vh] min-h-[500px]">
                {/* Slide image */}
                <div className="absolute inset-0 transition-all duration-700">
                    <SmartImage
                        src={slide.backgroundImageUrl || DEFAULT_IMG}
                        alt="Slide"
                        className="w-full h-full object-cover"
                        priority
                    />
                    <div
                        className="absolute inset-0"
                        style={{
                            backgroundColor: slide.overlayColor || '#000',
                            opacity: slide.overlayOpacity ?? 0,
                        }}
                    />
                </div>

                {/* Content card + nav */}
                <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm">
                        <h3
                            className="text-2xl font-bold mb-2"
                            style={{ color: slide.textColor || '#0f172a' }}
                        >
                            {slide.title || 'Tiêu đề slide'}
                        </h3>
                        {slide.subtitle && (
                            <p className="text-slate-600 mb-3">{slide.subtitle}</p>
                        )}
                        {slide.ctaText && (
                            <a
                                href={slide.ctaLink ? shopHref(basePath || '', slide.ctaLink) : '#'}
                                onClick={e => e.stopPropagation()}
                                className="font-bold text-xl text-brand hover:text-brand transition-colors"
                            >
                                {slide.ctaText}
                            </a>
                        )}
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={prev}
                            className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100 transition-colors"
                        >
                            &#8592;
                        </button>
                        <button
                            onClick={next}
                            className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800 transition-colors"
                        >
                            &#8594;
                        </button>
                    </div>
                </div>

                {/* Dot indicators */}
                {slides.length > 1 && (
                    <div className="absolute top-6 right-6 flex gap-2 z-10">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setActiveIndex(idx); }}
                                className={`w-2 h-2 rounded-full transition-all ${
                                    idx === activeIndex ? 'bg-white scale-125' : 'bg-white/50 hover:bg-white/80'
                                }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
