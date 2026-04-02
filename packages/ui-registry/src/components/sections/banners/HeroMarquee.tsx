import React from 'react';

export function HeroMarquee({ text }: { text?: string }) {
    const marqueeText = text || "SALE IS ON • UP TO 50% OFF • FREE SHIPPING OVER $100 • NEW SUMMER COLLECTION • ";

    return (
        <section className="w-full bg-emerald-500 py-3 overflow-hidden whitespace-nowrap border-y border-emerald-600">
            <div className="inline-block animate-[slider_20s_linear_infinite] group-hover:animate-none">
                <span className="text-slate-900 font-bold uppercase tracking-widest mx-4">{marqueeText}</span>
                <span className="text-slate-900 font-bold uppercase tracking-widest mx-4">{marqueeText}</span>
                <span className="text-slate-900 font-bold uppercase tracking-widest mx-4">{marqueeText}</span>
                <span className="text-slate-900 font-bold uppercase tracking-widest mx-4">{marqueeText}</span>
            </div>
            {/* Tailwind safe-list for slider if not in tailwind.config: You might need to add plugin or custom animation */}
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
