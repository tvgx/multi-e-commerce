import React from 'react';

export function CollectionListsBento() {
    return (
        <section className="w-full py-20 px-4 md:px-12 bg-slate-50">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-slate-900 mb-4">Shop by Category</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[250px] md:auto-rows-[300px]">
                    {/* Large Featured */}
                    <a href="#" className="relative md:col-span-2 md:row-span-2 rounded-2xl overflow-hidden group">
                        <img src="http://localhost:9000/assets/default-4.png" alt="Women" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                        <div className="absolute bottom-6 left-6 text-white text-3xl font-bold drop-shadow-md">Womenswear</div>
                    </a>

                    {/* Top Right */}
                    <a href="#" className="relative md:col-span-2 rounded-2xl overflow-hidden group">
                        <img src="http://localhost:9000/assets/default-1.png" alt="Accessories" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                        <div className="absolute bottom-6 left-6 text-white text-2xl font-bold drop-shadow-md">Accessories</div>
                    </a>

                    {/* Bottom Right 1 */}
                    <a href="#" className="relative rounded-2xl overflow-hidden group">
                        <img src="http://localhost:9000/assets/default-2.png" alt="Beauty" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                        <div className="absolute bottom-6 left-6 text-white text-xl font-bold drop-shadow-md">Beauty</div>
                    </a>

                    {/* Bottom Right 2 */}
                    <a href="#" className="relative rounded-2xl overflow-hidden group">
                        <img src="http://localhost:9000/assets/default-3.png" alt="Mens" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 transition-colors"></div>
                        <div className="absolute bottom-6 left-6 text-white text-xl font-bold drop-shadow-md">Menswear</div>
                    </a>
                </div>
            </div>
        </section>
    );
}
