import React from 'react';

export function FeaturedProducts() {
    return (
        <section className="w-full py-20 px-4 md:px-12 bg-slate-900 text-white">
            <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                <div className="lg:w-1/2 w-full">
                    <div className="aspect-square bg-slate-800 rounded-full overflow-hidden relative shadow-[0_0_50px_rgba(16,185,129,0.2)] p-4">
                        <div className="w-full h-full rounded-full overflow-hidden border border-slate-700">
                            <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80" alt="Featured Product" className="w-full h-full object-cover scale-110" />
                        </div>
                        {/* Floating elements */}
                        <div className="absolute top-1/4 -left-4 bg-white text-slate-900 px-4 py-2 rounded-xl font-bold shadow-xl rotate-[-5deg]">★ Top Rated</div>
                        <div className="absolute bottom-1/4 -right-4 bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-xl rotate-[5deg]">Limited Stock</div>
                    </div>
                </div>

                <div className="lg:w-1/2 w-full space-y-8 text-center lg:text-left">
                    <h2 className="text-5xl md:text-6xl font-black italic tracking-tighter">The Ultimate<br />Everyday Sneaker.</h2>
                    <p className="text-xl text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                        Engineered for all-day comfort with our proprietary cloud-foam tech. This isn&apos;t just a shoe, it&apos;s a statement.
                    </p>

                    <div className="flex items-center justify-center lg:justify-start gap-4">
                        <div className="w-8 h-8 rounded-full bg-red-500 ring-2 ring-white ring-offset-2 ring-offset-slate-900 cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-blue-500 cursor-pointer"></div>
                        <div className="w-8 h-8 rounded-full bg-black border border-slate-600 cursor-pointer"></div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                        <span className="text-4xl font-bold">$149.00</span>
                        <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-slate-900 px-10 py-4 rounded-full font-bold text-lg transition-colors shadow-lg shadow-emerald-500/20">
                            Add To Cart
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
