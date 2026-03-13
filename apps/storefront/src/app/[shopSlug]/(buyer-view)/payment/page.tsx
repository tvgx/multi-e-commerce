import React from 'react';

export default function PaymentPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <h1 className="text-3xl font-bold mb-8 text-center">Checkout & Payment</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="p-6 bg-white border border-slate-200 rounded-xl">
                        <h2 className="text-lg font-semibold mb-4">Shipping Information</h2>
                        <input className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm mb-3" placeholder="Full Name" />
                        <textarea className="w-full bg-slate-50 border border-slate-200 p-3 rounded-lg text-sm" placeholder="Address" rows={3}></textarea>
                    </div>

                    <div className="p-6 bg-white border border-slate-200 rounded-xl">
                        <h2 className="text-lg font-semibold mb-4">Payment Method</h2>
                        <div className="space-y-3">
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                                <input type="radio" name="payment" defaultChecked className="accent-emerald-500" /> Credit/Debit Card
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:border-emerald-500">
                                <input type="radio" name="payment" className="accent-emerald-500" /> Cash on Delivery (COD)
                            </label>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl h-fit">
                    <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
                    <div className="space-y-3 text-sm border-b border-slate-200 pb-4 mb-4">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>$0.00</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Shipping</span>
                            <span>Calculated at next step</span>
                        </div>
                    </div>
                    <div className="flex justify-between font-bold text-lg mb-6">
                        <span>Total</span>
                        <span>$0.00</span>
                    </div>
                    <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-3 rounded-xl transition-colors">
                        Confirm & Pay
                    </button>
                </div>
            </div>
        </div>
    );
}
