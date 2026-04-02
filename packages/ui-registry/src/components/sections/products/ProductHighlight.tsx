import React from 'react';

export function ProductHighlight() {
    return (
        <section className="w-full py-24 bg-white overflow-hidden">
            <div className="max-w-7xl mx-auto px-4 md:px-12 relative">
                <div className="absolute top-0 right-0 text-[10rem] md:text-[15rem] font-black text-slate-50 leading-none select-none z-0 -translate-y-16 translate-x-12">
                    FOCUS
                </div>

                <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    <div className="order-2 lg:order-1 space-y-8">
                        <span className="text-emerald-500 font-bold tracking-widest uppercase">Spotlight</span>
                        <h2 className="text-4xl md:text-6xl font-bold text-slate-900 leading-tight">Artisan Crafted<br />Leather Tote.</h2>
                        <ul className="space-y-6">
                            <li className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">✦</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Full-Grain Italian Leather</h4>
                                    <p className="text-slate-600">Sourced from sustainable tanneries, develops a unique patina over time.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">✦</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Solid Brass Hardware</h4>
                                    <p className="text-slate-600">Custom cast hardware that won&apos;t rust, bend, or break under pressure.</p>
                                </div>
                            </li>
                            <li className="flex gap-4">
                                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">✦</div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-lg">Lifetime Guarantee</h4>
                                    <p className="text-slate-600">We stand by our craftsmanship. Repairs are on us, forever.</p>
                                </div>
                            </li>
                        </ul>
                        <div className="pt-6">
                            <button className="bg-slate-900 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-xl">
                                Discover Details - $285
                            </button>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 relative">
                        <div className="aspect-[4/5] bg-slate-100 rounded-3xl overflow-hidden shadow-2xl z-10 relative">
                            <img src="https://images.unsplash.com/photo-1591561954557-26941169b49e?auto=format&fit=crop&q=80" alt="Leather Tote" className="w-full h-full object-cover" />
                        </div>
                        {/* Decorative background element */}
                        <div className="absolute -bottom-8 -right-8 w-full h-full border-2 border-emerald-500 rounded-3xl z-0"></div>
                    </div>
                </div>
            </div>
        </section>
    );
}
