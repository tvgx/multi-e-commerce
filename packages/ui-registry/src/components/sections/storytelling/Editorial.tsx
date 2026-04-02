import React from 'react';

export function Editorial() {
    return (
        <section className="w-full py-24 bg-white">
            <div className="max-w-4xl mx-auto px-4 md:px-12 text-center">
                <span className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-6 block">Our Vision</span>
                <h2 className="text-4xl md:text-5xl font-serif italic text-slate-900 mb-10 leading-normal">
                    &quot;We believe that true luxury isn&apos;t about labels or logos. It&apos;s about how a piece is made, the materials used, and the story it tells.&quot;
                </h2>
                <div className="w-24 h-1 bg-emerald-500 mx-auto mb-10"></div>
                <p className="text-xl text-slate-600 font-serif leading-relaxed">
                    Founded in 2012 by two designers who wanted to challenge the status quo of fast fashion. Our mission remains the same: to create products that you&apos;ll reach for day after day, year after year. Every stitch, every seam, and every fabric choice is deliberate.
                </p>

                <div className="mt-16 flex justify-center">
                    <img src="https://images.unsplash.com/photo-1558522194-e0e64396b797?auto=format&fit=crop&q=80" alt="Process" className="rounded-2xl shadow-xl max-w-2xl w-full" />
                </div>
            </div>
        </section>
    );
}
