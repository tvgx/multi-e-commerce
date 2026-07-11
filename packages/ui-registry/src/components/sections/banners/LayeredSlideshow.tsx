"use client";
import React, { useState } from 'react';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';
import { shopHref } from '../../../lib/href';

interface LayeredSlideshowProps {
    backgroundColor?: string;
    height?: string;
    basePath?: string;
    blocks?: {
        id: string;
        componentId: string;
        props: any;
    }[];
}

export function LayeredSlideshow({
    backgroundColor = '#f8fafc',
    height = '80vh',
    basePath,
    blocks = []
}: LayeredSlideshowProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const slides = blocks.filter(b => b.componentId === 'SlideItem');

    if (slides.length === 0) {
        return (
            <section className="relative w-full overflow-hidden flex items-center justify-center border-2 border-dashed border-zinc-300 text-zinc-500" style={{ backgroundColor, height }}>
                <p>Chưa có slide nào. Vui lòng thêm &quot;Slide Ảnh&quot; từ Properties Sidebar.</p>
            </section>
        );
    }

    const activeSlide = slides[activeIndex]?.props || {};

    return (
        <section className="relative w-full overflow-hidden flex items-center justify-center" style={{ backgroundColor, height }}>
            {/* Background Image Layer */}
            <div className="absolute top-10 right-10 w-[60%] h-[80%] bg-slate-200 z-0 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500">
                <SmartImage
                    src={activeSlide.backgroundImageUrl || DEFAULT_IMG}
                    fallbackSrc={DEFAULT_IMG}
                    alt="Slide"
                    className="w-full h-full object-cover"
                    sizes="60vw"
                    priority
                />
                <div
                    className="absolute inset-0"
                    style={{ backgroundColor: activeSlide.overlayColor || '#000', opacity: activeSlide.overlayOpacity ?? 0 }}
                />
            </div>

            {/* Foreground Text Layer */}
            <div className="relative z-10 max-w-6xl w-full px-8 flex flex-col justify-center h-full">
                <div
                    className="bg-white/90 backdrop-blur-md p-10 md:p-16 rounded-3xl max-w-xl shadow-2xl border border-white"
                    style={{ color: activeSlide.textColor || '#0f172a' }}
                >
                    <h2 className="text-5xl font-bold mb-6 leading-tight whitespace-pre-line">{activeSlide.title || 'Slide Title'}</h2>
                    <p className="opacity-80 mb-8 text-lg">{activeSlide.subtitle || 'Slide subtitle goes here.'}</p>
                    <a
                        href={activeSlide.ctaLink ? shopHref(basePath || '', activeSlide.ctaLink) : '#'}
                        className="bg-slate-900 text-white px-8 py-4 rounded-full font-medium hover:bg-brand transition-colors shadow-lg shadow-brand/20 inline-block"
                    >
                        {activeSlide.ctaText || 'View Lookbook'}
                    </a>
                </div>

                {/* Dots Navigation */}
                {slides.length > 1 && (
                    <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-2">
                        {slides.map((_, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveIndex(idx)}
                                className={`w-3 h-3 rounded-full transition-all ${idx === activeIndex ? 'bg-indigo-600 scale-125' : 'bg-indigo-600/30'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}
