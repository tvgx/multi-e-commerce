import React from 'react';

export function Marquee() {
    return (
        <section className="w-full bg-slate-900 py-6 overflow-hidden flex items-center">
            <div className="inline-block animate-[slider_30s_linear_infinite] whitespace-nowrap">
                {Array(6).fill(null).map((_, i) => (
                    <span key={i} className="text-slate-400 font-bold uppercase tracking-widest text-sm mx-8 flex-inline items-center justify-center">
                        <span className="text-brand mr-8">✦</span>
                        DESIGNED IN NEW YORK. CRAFTED IN ITALY. WORN WORLDWIDE.
                    </span>
                ))}
            </div>
            <style dangerouslySetInnerHTML={{
                __html: `
                @keyframes slider {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
            `}} />
        </section>
    );
}
