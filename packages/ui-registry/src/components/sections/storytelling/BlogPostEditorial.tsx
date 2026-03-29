import React from 'react';

export function BlogPostEditorial() {
    return (
        <section className="w-full py-24 bg-slate-50">
            <div className="max-w-5xl mx-auto px-4 md:px-12">
                <article className="bg-white rounded-[2rem] overflow-hidden shadow-2xl flex flex-col md:flex-row shadow-slate-200">
                    <div className="w-full md:w-1/2 p-12 md:p-16 flex flex-col justify-center order-2 md:order-1">
                        <span className="text-emerald-500 font-bold text-sm tracking-widest uppercase mb-4 text-center md:text-left block">Inside The Atelier</span>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 leading-tight text-center md:text-left">The Art of <br />Leathercraft</h2>
                        <p className="text-slate-600 text-lg mb-8 text-center md:text-left">
                            We take you behind the scenes to see how our master artisans hand-stitch, dye, and polish every single bag that leaves our workshop in Florence.
                        </p>
                        <div className="text-center md:text-left">
                            <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-emerald-600 transition-colors">
                                Read Full Story
                            </button>
                        </div>
                    </div>
                    <div className="w-full md:w-1/2 h-[400px] md:h-auto order-1 md:order-2">
                        <img src="https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&q=80" alt="Leathercraft" className="w-full h-full object-cover" />
                    </div>
                </article>
            </div>
        </section>
    );
}
