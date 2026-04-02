import React from 'react';

export function SplitShowcase() {
    return (
        <section className="w-full grid grid-cols-1 md:grid-cols-2 min-h-[600px]">
            {/* Left Image Half */}
            <div className="relative h-full min-h-[400px]">
                <img
                    src="https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80"
                    alt="Fashion Model"
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>

            {/* Right Content Half */}
            <div className="bg-emerald-900 text-emerald-50 flex flex-col justify-center p-12 md:p-20">
                <span className="text-emerald-300 font-bold uppercase tracking-widest text-sm mb-6 block">Exclusive Release</span>
                <h2 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">The<br />Emerald<br />Collection.</h2>
                <p className="text-lg text-emerald-200/80 mb-10 max-w-md">
                    Bold, sophisticated, and unapologetically green. Discover the limited edition pieces that define the season.
                </p>
                <button className="self-start border border-emerald-400 text-emerald-50 px-8 py-3 rounded-none font-medium hover:bg-emerald-50 hover:text-emerald-900 transition-colors uppercase tracking-widest">
                    Shop The Look
                </button>
            </div>
        </section>
    );
}
