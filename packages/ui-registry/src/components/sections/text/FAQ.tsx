import React from 'react';

export function FAQ() {
    return (
        <section className="w-full py-24 bg-slate-50">
            <div className="max-w-3xl mx-auto px-4 md:px-12">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Frequently Asked Questions</h2>
                    <p className="text-slate-600">Got questions? We&apos;ve got answers.</p>
                </div>

                <div className="space-y-4">
                    {[
                        { q: "What is your return policy?", a: "We offer a 30-day return window for all unworn items in their original packaging. Return shipping is free for all domestic orders." },
                        { q: "Do you ship internationally?", a: "Yes, we ship to over 100 countries worldwide. International shipping rates and times vary depending on the destination." },
                        { q: "How do I care for my leather goods?", a: "We recommend using a specialized leather conditioner every 3-6 months. Avoid prolonged exposure to direct sunlight and water. If your bag gets wet, let it air dry naturally." },
                        { q: "Can I cancel my order?", a: "Orders can be modified or cancelled within 1 hour of placement. Please contact our support team immediately if you need to make changes." },
                    ].map((item, i) => (
                        <details key={i} className="group bg-white rounded-2xl border border-slate-200 overflow-hidden cursor-pointer" open={i === 0}>
                            <summary className="font-bold text-lg text-slate-900 p-6 flex justify-between items-center select-none group-open:bg-slate-50">
                                {item.q}
                                <span className="text-emerald-500 font-normal transition-transform group-open:rotate-180">↓</span>
                            </summary>
                            <div className="px-6 pb-6 pt-2 text-slate-600 border-t border-slate-100 group-open:bg-slate-50">
                                {item.a}
                            </div>
                        </details>
                    ))}
                </div>
            </div>
        </section>
    );
}
