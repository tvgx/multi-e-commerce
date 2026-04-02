import React from 'react';

export default function CartPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500">
                Your cart is currently empty.
            </div>

            <div className="mt-8 flex justify-end">
                <button className="bg-emerald-500 hover:bg-emerald-600 px-8 py-3 text-white font-medium rounded-xl transition-colors">
                    Proceed to Payment
                </button>
            </div>
        </div>
    );
}
