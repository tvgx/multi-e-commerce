import React from 'react';

export function RichText() {
    return (
        <section className="w-full py-24 bg-white">
            <div className="max-w-3xl mx-auto px-4 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-8 leading-tight">Crafting Modern Staples</h2>
                <div className="prose prose-lg prose-slate mx-auto">
                    <p className="text-xl text-slate-600 mb-6 leading-relaxed">
                        We started this brand with a simple question: Why is it so difficult to find high-quality, unbranded essentials at a fair price?
                    </p>
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        The traditional retail model involves middlemen, high markups, and seasonal trends that encourage waste. We decided to strip all of that away. By working directly with some of the world&apos;s best factories—the same ones producing for major luxury houses—we&apos;re able to offer the same level of craftsmanship without the luxury markup.
                    </p>
                    <p className="text-slate-600 mb-10 leading-relaxed font-medium">
                        Welcome to a smarter way to build your wardrobe.
                    </p>
                </div>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-8 py-3 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest inline-flex items-center gap-2">
                    Read Our Story <span>&rarr;</span>
                </button>
            </div>
        </section>
    );
}
