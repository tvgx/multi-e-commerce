import React from 'react';
import { SmartImage } from '../../blocks/SmartImage';

import { DEFAULT_IMG } from '../../../lib/media';

interface EditorialProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    backgroundColor?: string;
    textColor?: string;
}

export function Editorial({
    title,
    subtitle,
    backgroundImageUrl,
    backgroundColor,
    textColor,
}: EditorialProps) {
    return (
        <section className="w-full py-24" style={{ backgroundColor: backgroundColor || '#ffffff' }}>
            <div className="max-w-4xl mx-auto px-4 md:px-12 text-center">
                <span className="text-brand font-bold uppercase tracking-widest text-sm mb-6 block">Our Vision</span>
                <h2 className="text-4xl md:text-5xl font-serif italic mb-10 leading-normal" style={{ color: textColor || '#0f172a' }}>
                    &quot;{title || "We believe that true luxury isn't about labels or logos. It's about how a piece is made, the materials used, and the story it tells."}&quot;
                </h2>
                <div className="w-24 h-1 bg-brand mx-auto mb-10" />
                <p className="text-xl font-serif leading-relaxed" style={{ color: textColor ? `${textColor}99` : '#475569' }}>
                    {subtitle || "Founded in 2012 by two designers who wanted to challenge the status quo of fast fashion. Our mission remains the same: to create products that you'll reach for day after day, year after year."}
                </p>

                <div className="mt-16 flex justify-center">
                    <SmartImage
                        src={backgroundImageUrl || DEFAULT_IMG}
                        alt="Process"
                        className="rounded-2xl shadow-xl max-w-2xl w-full"
                    />
                </div>
            </div>
        </section>
    );
}
