import React from 'react';

export default function CollectionLinksText() {
    return (
        <section className="w-full py-24 bg-slate-900 text-slate-100 text-center">
            <div className="max-w-4xl mx-auto px-4">
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-6 block">Quick Links</span>
                <div className="flex flex-wrap justify-center gap-x-8 gap-y-6 md:gap-x-12 md:gap-y-10">
                    <a href="#" className="text-3xl md:text-5xl font-bold hover:text-emerald-400 hover:underline decoration-4 underline-offset-8 transition-all">New Arrivals</a>
                    <a href="#" className="text-3xl md:text-5xl font-bold hover:text-emerald-400 hover:underline decoration-4 underline-offset-8 transition-all">Best Sellers</a>
                    <a href="#" className="text-3xl md:text-5xl font-bold hover:text-emerald-400 hover:underline decoration-4 underline-offset-8 transition-all">Sale & Clearance</a>
                    <a href="#" className="text-3xl md:text-5xl font-bold hover:text-emerald-400 hover:underline decoration-4 underline-offset-8 transition-all">Gifts</a>
                </div>
            </div>
        </section>
    );
}
