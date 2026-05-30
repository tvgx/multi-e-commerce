import React from 'react';

export function Carousel() {
    return (
        <section className="w-full py-16 bg-slate-900 overflow-hidden">
            <div className="max-w-7xl mx-auto text-center mb-10 px-4">
                <h2 className="text-3xl font-bold text-white">Visual Stories</h2>
            </div>

            <div className="flex gap-4 px-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar">
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <div key={i} className="min-w-[80vw] md:min-w-[40vw] lg:min-w-[30vw] aspect-[3/4] snap-center">
                        <img src={`http://localhost:9000/assets/default-2.png`} alt="Story" className="w-full h-full object-cover rounded-2xl" />
                    </div>
                ))}
            </div>
            <div className="flex justify-center gap-2 mt-6">
                <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
                <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
                <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
            </div>
        </section>
    );
}
