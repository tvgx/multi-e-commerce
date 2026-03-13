import React from 'react';

export default function CollectionListsCarousel() {
    return (
        <section className="w-full py-20 bg-white overflow-hidden">
            <div className="px-4 md:px-12 mb-10 flex justify-between items-end">
                <h2 className="text-3xl font-bold text-slate-900">Trending Collections</h2>
                <div className="flex gap-2">
                    <button className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50">&larr;</button>
                    <button className="w-10 h-10 border border-slate-300 rounded-full flex items-center justify-center hover:bg-slate-50">&rarr;</button>
                </div>
            </div>

            <div className="flex gap-6 px-4 md:px-12 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-8">
                {[1, 2, 3, 4, 5].map((i) => (
                    <a href="#" key={i} className="min-w-[280px] md:min-w-[350px] snap-center group">
                        <div className="w-full h-[400px] rounded-2xl overflow-hidden mb-4 relative">
                            <img src={`https://images.unsplash.com/photo-${1500000000000 + i}?auto=format&fit=crop&q=80`} alt="Collection" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">Collection {i}</h3>
                        <p className="text-slate-500">Explore Items &rarr;</p>
                    </a>
                ))}
            </div>
        </section>
    );
}
