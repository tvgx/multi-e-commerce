import React from 'react';

export default function Multicolumn() {
    return (
        <section className="w-full py-24 bg-white">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="mb-16 max-w-2xl">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">The Pillars of Our Design</h2>
                    <p className="text-lg text-slate-600">Everything we create is built upon three core principles that dictate every sketch, stitch, and final product.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                    <div className="border-t-2 border-slate-900 pt-8 mt-8">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wider">01. Utility</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Form must always follow function. We design garments that serve a purpose, featuring intuitive pockets, durable reinforcements, and weather-appropriate fabrics.
                        </p>
                    </div>

                    <div className="border-t-2 border-emerald-500 pt-8 mt-8 md:mt-16">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wider">02. Longevity</h3>
                        <p className="text-slate-600 leading-relaxed">
                            We reject the concept of planned obsolescence. Our materials are chosen for their ability to age gracefully, developing character rather than falling apart.
                        </p>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-8 mt-8 md:mt-32">
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 uppercase tracking-wider">03. Aesthetics</h3>
                        <p className="text-slate-600 leading-relaxed">
                            Minimalism isn't about removing features; it's about perfect proportions. We spend months refining the cut and drape of a single shirt until it's perfect.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}
