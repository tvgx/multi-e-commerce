import React from 'react';

export function CollectionListsEditorial() {
    return (
        <section className="w-full py-24 px-4 md:px-12 bg-emerald-950 text-emerald-50">
            <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                <div className="order-2 lg:order-1">
                    <div className="flex flex-col gap-12">
                        <div className="flex flex-col border-b border-emerald-800 pb-12 group">
                            <span className="text-emerald-500 font-mono mb-2">01</span>
                            <a href="#" className="text-4xl md:text-5xl font-bold hover:text-emerald-400 transition-colors mb-4">Summer Essentials</a>
                            <p className="text-emerald-200/80 max-w-sm mb-6">Lightweight fabrics and vibrant patterns for the warmer days ahead.</p>
                            <a href="#" className="text-sm font-bold uppercase tracking-widest text-emerald-400 hover:text-white">Shop Now &rarr;</a>
                        </div>
                        <div className="flex flex-col border-b border-emerald-800 pb-12 group">
                            <span className="text-emerald-500 font-mono mb-2">02</span>
                            <a href="#" className="text-4xl md:text-5xl font-bold hover:text-emerald-400 transition-colors mb-4">Evening Wear</a>
                            <p className="text-emerald-200/80 max-w-sm mb-6">Elegant silhouettes and premium materials for your special occasions.</p>
                            <a href="#" className="text-sm font-bold uppercase tracking-widest text-emerald-400 hover:text-white">Shop Now &rarr;</a>
                        </div>
                    </div>
                </div>

                <div className="order-1 lg:order-2">
                    <div className="w-full aspect-[4/5] overflow-hidden rounded-t-full relative">
                        <img src="https://images.unsplash.com/photo-1509319117193-57bab727e09d?auto=format&fit=crop&q=80" alt="Editorial" className="absolute inset-0 w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </section>
    );
}
