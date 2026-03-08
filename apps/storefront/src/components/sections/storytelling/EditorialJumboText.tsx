import React from 'react';

export default function EditorialJumboText() {
    return (
        <section className="w-full py-32 bg-emerald-500 flex items-center justify-center overflow-hidden relative">
            {/* Massive background text */}
            <div className="absolute whitespace-nowrap text-[30vw] font-black text-emerald-600/30 tracking-tighter select-none z-0">
                SUSTAINABLE
            </div>

            <div className="relative z-10 max-w-4xl mx-auto px-8 text-center text-slate-900">
                <h2 className="text-5xl md:text-7xl font-bold mb-8 uppercase tracking-tighter leading-none">
                    Good for you,<br />Better for the planet.
                </h2>
                <p className="text-2xl font-medium max-w-2xl mx-auto">
                    100% of our packaging is recycled. By 2026, we aim for our entire supply chain to be carbon neutral.
                </p>
                <div className="mt-12">
                    <button className="border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white px-8 py-4 rounded-none font-bold tracking-widest uppercase transition-colors">
                        Our Impact Report
                    </button>
                </div>
            </div>
        </section>
    );
}
