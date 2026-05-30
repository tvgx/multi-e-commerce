import React from 'react';

export function ImageWithText() {
    return (
        <section className="w-full bg-white overflow-hidden">
            <div className="flex flex-col lg:flex-row min-h-[600px]">
                {/* Image */}
                <div className="w-full lg:w-1/2 relative h-[400px] lg:h-auto">
                    <img src="http://localhost:9000/assets/default-4.png" alt="Autumn Style" className="absolute inset-0 w-full h-full object-cover" />
                </div>

                {/* Text Content */}
                <div className="w-full lg:w-1/2 flex items-center bg-slate-50 justify-center p-12 md:p-24">
                    <div className="max-w-lg">
                        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">Cozy up for the incoming season.</h2>
                        <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                            Discover our new range of heavy knits and insulated outerwear. Designed to keep you warm without sacrificing your silhouette. Layering has never looked this good.
                        </p>
                        <ul className="space-y-4 mb-10 text-slate-700 font-medium">
                            <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> Cashmere Blends</li>
                            <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> Recycled Down Insulation</li>
                            <li className="flex items-center gap-3"><span className="text-emerald-500">✓</span> Weather-resistant Finishes</li>
                        </ul>
                        <button className="bg-slate-900 hover:bg-emerald-600 text-white px-8 py-4 rounded-full font-bold transition-all shadow-lg text-sm uppercase tracking-widest">
                            Shop The Lookbook
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
