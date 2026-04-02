import React from 'react';

export function HeroBottomAligned({ title, subtitle }: { title?: string, subtitle?: string }) {
    return (
        <section className="relative w-full h-[70vh] min-h-[500px] flex flex-col justify-end pb-20 px-8 bg-slate-100 text-slate-900">
            <div className="max-w-7xl mx-auto w-full">
                <h1 className="text-6xl md:text-8xl font-black mb-4 uppercase tracking-tighter leading-none">{title || "The New Standard"}</h1>
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <p className="text-xl max-w-xl text-slate-600 font-medium">
                        {subtitle || "Uncompromising quality meets everyday functionality. Explore the latest arrivals."}
                    </p>
                    <button className="bg-slate-900 text-white px-8 py-4 rounded-none font-bold tracking-widest uppercase hover:bg-emerald-600 transition-colors w-full md:w-auto">
                        Explore Collection
                    </button>
                </div>
            </div>
        </section>
    );
}
