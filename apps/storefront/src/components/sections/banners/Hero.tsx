import React from 'react';

export default function Hero({ title, subtitle, imageUrl }: { title?: string, subtitle?: string, imageUrl?: string }) {
    return (
        <section className="relative w-full h-[600px] flex items-center justify-center bg-slate-900 text-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <img
                    src={imageUrl || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80"}
                    alt="Hero Background"
                    className="w-full h-full object-cover opacity-50"
                />
            </div>
            <div className="relative z-10 text-center max-w-3xl px-4">
                <h1 className="text-5xl md:text-7xl font-bold mb-6 tracking-tight">{title || "Discover Our Collection"}</h1>
                <p className="text-xl md:text-2xl mb-10 text-slate-200">{subtitle || "Elevate your everyday style with our premium, carefully curated products."}</p>
                <button className="bg-white text-slate-900 px-8 py-4 rounded-full font-semibold hover:bg-emerald-500 hover:text-white transition-all transform hover:scale-105 active:scale-95 shadow-lg">
                    Shop Now
                </button>
            </div>
        </section>
    );
}
