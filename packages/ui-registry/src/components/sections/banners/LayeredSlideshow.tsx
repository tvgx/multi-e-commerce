import React from 'react';

export function LayeredSlideshow() {
    return (
        <section className="relative w-full h-[80vh] bg-slate-100 overflow-hidden flex items-center justify-center">
            {/* Background Image Layer */}
            <div className="absolute top-10 right-10 w-[60%] h-[80%] bg-slate-200 z-0 rounded-2xl overflow-hidden shadow-2xl">
                <img src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?auto=format&fit=crop&q=80" alt="Fashion" className="w-full h-full object-cover" />
            </div>

            {/* Foreground Text Layer */}
            <div className="relative z-10 max-w-6xl w-full px-8 flex flex-col justify-center h-full">
                <div className="bg-white/90 backdrop-blur-md p-10 md:p-16 rounded-3xl max-w-xl shadow-2xl border border-white">
                    <span className="text-emerald-600 font-bold uppercase tracking-widest text-sm mb-4 block">New Season</span>
                    <h2 className="text-5xl font-bold text-slate-900 mb-6 leading-tight">Effortless Layering</h2>
                    <p className="text-slate-600 mb-8 text-lg">Build your perfect wardrobe with versatile pieces designed to transition seamlessly through the seasons.</p>
                    <button className="bg-slate-900 text-white px-8 py-4 rounded-full font-medium hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-500/20">
                        View Lookbook
                    </button>
                </div>
            </div>
        </section>
    );
}
