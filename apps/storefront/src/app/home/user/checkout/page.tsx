import React from "react";
import { CreditCard, Truck, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-4xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Checkout</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                <div className="lg:col-span-7 space-y-8">
                    {/* Shipping Address */}
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                            <Truck className="w-5 h-5 text-zinc-600" />
                            <h2 className="text-xl font-semibold text-zinc-900">Shipping Address</h2>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">First Name</label>
                                <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Last Name</label>
                                <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Address</label>
                                <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">City</label>
                                <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="block text-sm font-medium text-zinc-700 mb-1">ZIP / Postal Code</label>
                                <input type="text" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white p-6 rounded-xl border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-6 border-b border-zinc-100 pb-4">
                            <CreditCard className="w-5 h-5 text-zinc-600" />
                            <h2 className="text-xl font-semibold text-zinc-900">Payment Details</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-zinc-700 mb-1">Card Number</label>
                                <input type="text" placeholder="0000 0000 0000 0000" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">Expiration Date</label>
                                    <input type="text" placeholder="MM/YY" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                                </div>
                                <div className="col-span-1">
                                    <label className="block text-sm font-medium text-zinc-700 mb-1">CVC</label>
                                    <input type="text" placeholder="123" className="w-full px-3 py-2 border border-zinc-200 rounded-md focus:ring-2 focus:ring-zinc-900" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-5 mt-8 lg:mt-0">
                    <div className="bg-zinc-50 p-6 rounded-xl border border-zinc-200">
                        <h2 className="text-xl font-semibold text-zinc-900 mb-6 border-b border-zinc-200 pb-4">Order Summary</h2>

                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">Subtotal</span>
                                <span className="font-medium text-zinc-900">$119.98</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">Shipping</span>
                                <span className="font-medium text-zinc-900">$5.00</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-zinc-600">Taxes</span>
                                <span className="font-medium text-zinc-900">$9.60</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg pt-4 border-t border-zinc-200">
                                <span>Total</span>
                                <span>$134.58</span>
                            </div>
                        </div>

                        <button className="w-full bg-zinc-900 text-white font-medium py-3 px-4 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2">
                            <CheckCircle className="w-5 h-5" /> Confirm Order
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
