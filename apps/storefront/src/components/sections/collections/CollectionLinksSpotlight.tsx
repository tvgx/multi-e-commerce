import React from 'react';

export default function CollectionLinksSpotlight() {
    return (
        <section className="w-full py-20 px-4 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
                <div className="flex-1 space-y-8">
                    <h2 className="text-4xl md:text-5xl font-bold text-slate-900 leading-tight">Curated <br />Collections</h2>
                    <p className="text-slate-600 text-lg">Discover pieces that speak to your style. Handpicked by our experts for the season ahead.</p>

                    <div className="flex flex-col space-y-4">
                        <a href="#" className="text-2xl font-bold text-slate-800 hover:text-emerald-500 hover:translate-x-2 transition-transform flex items-center justify-between border-b border-slate-200 pb-4">
                            Womenswear <span className="text-emerald-500 opacity-0 group-hover:opacity-100">&rarr;</span>
                        </a>
                        <a href="#" className="text-2xl font-bold text-slate-800 hover:text-emerald-500 hover:translate-x-2 transition-transform flex items-center justify-between border-b border-slate-200 pb-4">
                            Menswear <span className="text-emerald-500 opacity-0 group-hover:opacity-100">&rarr;</span>
                        </a>
                        <a href="#" className="text-2xl font-bold text-slate-800 hover:text-emerald-500 hover:translate-x-2 transition-transform flex items-center justify-between border-b border-slate-200 pb-4">
                            Accessories <span className="text-emerald-500 opacity-0 group-hover:opacity-100">&rarr;</span>
                        </a>
                    </div>
                </div>

                <div className="flex-1 w-full h-[600px] rounded-[2rem] overflow-hidden relative group">
                    <img
                        src="https://images.unsplash.com/photo-1490114538077-0a7f8cb49891?auto=format&fit=crop&q=80"
                        alt="Spotlight Collection"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-10">
                        <div className="text-white">
                            <span className="bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3 inline-block">Featured</span>
                            <h3 className="text-3xl font-bold">The Autumn Edit</h3>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
