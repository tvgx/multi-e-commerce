import React from 'react';

export function ProductHotspot() {
    return (
        <section className="w-full py-24 bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 text-center mb-16">
                <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">Explore The Setup</h2>
                <p className="text-lg text-slate-600 mx-auto max-w-2xl">Hover over the pulsing markers to discover the individual pieces that make up this curated look.</p>
            </div>

            <div className="max-w-5xl mx-auto relative rounded-3xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1499939667766-4afceb292d05?auto=format&fit=crop&q=80" alt="Room Setup" className="w-full h-auto object-contain" />

                {/* Hotspot 1 */}
                <div className="absolute top-[30%] left-[25%] group">
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center relative cursor-pointer z-10 text-emerald-600">
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                        <span className="relative font-bold text-xs">+</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-white p-3 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-20 origin-bottom">
                        <p className="font-bold text-sm text-slate-900">Minimalist Desk Lamp</p>
                        <p className="text-slate-500 text-xs mb-2">Matte Black Finish</p>
                        <p className="font-bold text-emerald-600 text-sm">$89.00</p>
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                    </div>
                </div>

                {/* Hotspot 2 */}
                <div className="absolute top-[60%] right-[30%] group">
                    <div className="w-6 h-6 bg-white rounded-full shadow-lg flex items-center justify-center relative cursor-pointer z-10 text-emerald-600">
                        <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-75"></div>
                        <span className="relative font-bold text-xs">+</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-3 w-48 bg-white p-3 rounded-lg shadow-xl opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all pointer-events-none z-20 origin-bottom">
                        <p className="font-bold text-sm text-slate-900">Ergonomic Chair</p>
                        <p className="text-slate-500 text-xs mb-2">Breathable Mesh</p>
                        <p className="font-bold text-emerald-600 text-sm">$350.00</p>
                        <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-4 h-4 bg-white rotate-45"></div>
                    </div>
                </div>

            </div>
        </section>
    );
}
