import React from 'react';

export function IconsWithText() {
    return (
        <section className="w-full py-16 bg-white border-y border-slate-100">
            <div className="max-w-7xl mx-auto px-4 md:px-12">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 md:gap-12 text-center">
                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-6 text-2xl">
                            🌍
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Worldwide Shipping</h4>
                        <p className="text-slate-500 text-sm">Free international delivery on all orders over $200.</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-6 text-2xl">
                            ♻️
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Sustainable Materials</h4>
                        <p className="text-slate-500 text-sm">Committed to using 100% recycled or organic fabrics.</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-6 text-2xl">
                            🛡️
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Lifetime Warranty</h4>
                        <p className="text-slate-500 text-sm">We stand behind the quality of our craftsmanship.</p>
                    </div>

                    <div className="flex flex-col items-center">
                        <div className="w-16 h-16 rounded-full bg-brand/10 text-brand flex items-center justify-center mb-6 text-2xl">
                            🔙
                        </div>
                        <h4 className="font-bold text-slate-900 mb-2">Easy Returns</h4>
                        <p className="text-slate-500 text-sm">No-questions-asked 30 day return policy for all items.</p>
                    </div>
                </div>
            </div>
        </section>
    );
}
