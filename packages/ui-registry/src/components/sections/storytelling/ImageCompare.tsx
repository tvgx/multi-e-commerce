import React from 'react';

export function ImageCompare() {
    return (
        <section className="w-full py-24 bg-slate-950 text-slate-50">
            <div className="max-w-7xl mx-auto px-4 md:px-12 flex flex-col items-center text-center">
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-4">The Difference</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-12">Before & After</h2>

                {/* Simulated Image Compare Slider */}
                <div className="w-full max-w-4xl aspect-[16/9] bg-slate-800 rounded-2xl overflow-hidden relative cursor-col-resize group shadow-2xl shadow-emerald-900/20">
                    <img src="http://localhost:9000/assets/default-2.png" alt="After" className="absolute inset-0 w-full h-full object-cover" />

                    <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden border-r-4 border-white">
                        <img src="http://localhost:9000/assets/default-3.png" alt="Before" className="absolute inset-y-0 left-0 w-[200%] max-w-none h-full object-cover" />
                    </div>

                    {/* Slider Handle */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center text-slate-900 group-hover:scale-110 transition-transform">
                        <span className="font-bold tracking-tighter text-lg">&lt;&gt;</span>
                    </div>

                    {/* Labels */}
                    <div className="absolute top-6 left-6 bg-black/50 text-white px-4 py-1.5 rounded-full text-sm font-bold backdrop-blur">Standard</div>
                    <div className="absolute top-6 right-6 bg-emerald-500 text-white px-4 py-1.5 rounded-full text-sm font-bold shadow-lg">Our Quality</div>
                </div>
            </div>
        </section>
    );
}
