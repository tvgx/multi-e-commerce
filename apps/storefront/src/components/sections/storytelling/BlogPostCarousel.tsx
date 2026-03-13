import React from 'react';

export default function BlogPostCarousel() {
    return (
        <section className="w-full py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex justify-between items-end mb-12">
                <div>
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">The Journal</h2>
                    <p className="text-slate-600">Stories, style guides, and behind the scenes.</p>
                </div>
                <div className="flex gap-2 shrink-0 hidden md:flex">
                    <button className="w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">&larr;</button>
                    <button className="w-12 h-12 bg-white shadow-sm border border-slate-200 rounded-full flex items-center justify-center hover:bg-slate-50 transition-colors">&rarr;</button>
                </div>
            </div>

            <div className="flex gap-8 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                    <a href="#" key={i} className="min-w-[85vw] md:min-w-[500px] snap-center group">
                        <div className="w-full aspect-video bg-slate-100 rounded-2xl overflow-hidden mb-6 relative">
                            <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 4000}?auto=format&fit=crop&q=80`} alt="Blog Post" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                        <div className="flex gap-4 items-center mb-3">
                            <span className="text-emerald-600 font-bold uppercase tracking-widest text-xs">Style Guide</span>
                            <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                            <span className="text-slate-500 text-xs font-medium">May 12, 2024</span>
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors mb-3 leading-tight">10 Ways to Style the Essential White Sneaker This Season</h3>
                        <p className="text-slate-600 line-clamp-2">Discover how a simple pair of white sneakers can transform your entire wardrobe, taking you from casual weekends to smart-casual office days with ease.</p>
                    </a>
                ))}
            </div>
        </section>
    );
}
