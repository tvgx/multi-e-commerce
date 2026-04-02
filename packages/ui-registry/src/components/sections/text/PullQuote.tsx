import React from 'react';

export function PullQuote() {
    return (
        <section className="w-full py-24 md:py-32 bg-slate-50 flex justify-center items-center px-4">
            <blockquote className="max-w-4xl text-center relative">
                <span className="absolute -top-16 -left-8 text-[120px] text-emerald-200/50 font-serif leading-none select-none z-0">&quot;</span>
                <p className="relative z-10 text-3xl md:text-5xl lg:text-6xl font-serif italic text-slate-900 leading-tight mb-8">
                    The detailing on these tailored trousers is simply unmatched. It&apos;s the kind of piece you buy once and wear for a decade.
                </p>
                <footer className="text-sm font-bold uppercase tracking-widest text-emerald-600">
                    — The Style Quarterly
                </footer>
            </blockquote>
        </section>
    );
}
