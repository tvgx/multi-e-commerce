import React from 'react';

interface SlideshowInsetProps {
    title?: string;
    subtitle?: string;
    backgroundImageUrl?: string;
    ctaText?: string;
    ctaLink?: string;
    backgroundColor?: string;
    fontFamily?: string;
}

export function SlideshowInset({
    title,
    subtitle,
    backgroundImageUrl,
    ctaText,
    ctaLink,
    backgroundColor,
    fontFamily
}: SlideshowInsetProps) {
    return (
        <section className="w-full py-16 px-4 md:px-12" style={{ backgroundColor: backgroundColor || '#ffffff', fontFamily: fontFamily || 'inherit' }}>
            <div className="max-w-7xl mx-auto bg-slate-50 rounded-[2rem] overflow-hidden shadow-2xl relative h-[70vh] min-h-[500px]">
                {/* Images Container */}
                <div className="absolute inset-0 flex">
                    <img
                        src={backgroundImageUrl || "http://localhost:9000/assets/default-1.png"}
                        alt="Product Focus"
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Embedded Content */}
                <div className="absolute bottom-10 left-10 right-10 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-xl max-w-sm">
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">{title || "Nike Air Max"}</h3>
                        <p className="text-slate-600 mb-4">{subtitle || "Ultimate comfort with responsive cushioning for everyday wear."}</p>
                        <p className="font-bold text-xl text-emerald-600">{ctaText || "$129.00"}</p>
                    </div>

                    <div className="flex gap-2">
                        <button className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100">&larr;</button>
                        <button className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-slate-800">&rarr;</button>
                    </div>
                </div>
            </div>
        </section>
    );
}
