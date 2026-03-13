import React from 'react';

export default function RecommendedProducts() {
    return (
        <section className="w-full py-16 border-t border-slate-200 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <h2 className="text-2xl font-bold text-slate-900 mb-8 border-b border-slate-200 pb-4">You May Also Like</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <a href="#" key={i} className="group block">
                            <div className="aspect-[4/5] bg-slate-100 rounded-xl overflow-hidden mb-3">
                                <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 3000}?auto=format&fit=crop&q=80`} alt="Recommended" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                            </div>
                            <h3 className="font-medium text-slate-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors">Perfect Match Item {i}</h3>
                            <p className="font-bold text-slate-900 text-sm">${45 + i * 3}.00</p>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
