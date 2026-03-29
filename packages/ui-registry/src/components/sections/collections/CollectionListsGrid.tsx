import React from 'react';

export function CollectionListsGrid() {
    return (
        <section className="w-full py-20 px-4 md:px-12 bg-white">
            <div className="max-w-7xl mx-auto">
                <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Explore Categories</h2>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
                    {[
                        { title: 'Tops', img: '1515886657613-9f3515b0c78f' },
                        { title: 'Bottoms', img: '1540221652366-fae368625244' },
                        { title: 'Outerwear', img: '1551028719-0c1d3a1fa507' },
                        { title: 'Footwear', img: '1542291026-7eec264c27ff' },
                        { title: 'Accessories', img: '1490578474895-699bc4e3f444' },
                        { title: 'Active', img: '1518310383802-640c2de311b2' },
                        { title: 'Sleepwear', img: '1515347619362-e67c83f6068d' },
                        { title: 'Swim', img: '1506422744084-566b6e4e0828' },
                    ].map((item, i) => (
                        <a href="#" key={i} className="flex flex-col items-center group">
                            <div className="w-full aspect-square rounded-full overflow-hidden mb-4 bg-slate-100 p-2 border-2 border-transparent group-hover:border-emerald-500 transition-colors">
                                <div className="w-full h-full rounded-full overflow-hidden bg-slate-200">
                                    <img src={`https://images.unsplash.com/photo-${item.img}?auto=format&fit=crop&q=80`} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                </div>
                            </div>
                            <h3 className="font-semibold text-slate-900 group-hover:text-emerald-600 transition-colors text-center">{item.title}</h3>
                        </a>
                    ))}
                </div>
            </div>
        </section>
    );
}
