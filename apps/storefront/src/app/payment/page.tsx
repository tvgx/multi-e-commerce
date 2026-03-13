import React from 'react';
import Link from 'next/link';
import { Lock } from 'lucide-react';

export default function Payment() {
    return (
        <div className="container mx-auto px-4 py-12 max-w-3xl">
            <div className="text-center mb-10">
                <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                <p className="text-muted-foreground mt-2 flex items-center justify-center">
                    <Lock className="w-4 h-4 mr-2" /> Secure Payment
                </p>
            </div>

            <div className="bg-card border rounded-lg shadow-sm">
                <div className="p-6 md:p-8 space-y-8">

                    {/* Shipping Address */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input type="text" placeholder="First Name" className="w-full px-4 py-2 border rounded-md" />
                            <input type="text" placeholder="Last Name" className="w-full px-4 py-2 border rounded-md" />
                            <input type="text" placeholder="Address" className="w-full px-4 py-2 border rounded-md md:col-span-2" />
                            <input type="text" placeholder="City" className="w-full px-4 py-2 border rounded-md" />
                            <div className="grid grid-cols-2 gap-4">
                                <input type="text" placeholder="State" className="w-full px-4 py-2 border rounded-md" />
                                <input type="text" placeholder="ZIP" className="w-full px-4 py-2 border rounded-md" />
                            </div>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Payment Method */}
                    <div>
                        <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                        <div className="space-y-4">
                            <div className="p-4 border rounded-md flex items-center bg-muted/30">
                                <input type="radio" id="credit" name="payment" defaultChecked className="w-4 h-4 text-primary" />
                                <label htmlFor="credit" className="ml-3 font-medium">Credit / Debit Card</label>
                            </div>

                            <div className="grid grid-cols-1 gap-4 pl-7 pr-4">
                                <input type="text" placeholder="Card Number" className="w-full px-4 py-2 border rounded-md" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="text" placeholder="MM/YY" className="w-full px-4 py-2 border rounded-md" />
                                    <input type="text" placeholder="CVC" className="w-full px-4 py-2 border rounded-md" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-border" />

                    {/* Action */}
                    <div className="pt-4">
                        <button className="w-full bg-primary text-primary-foreground py-4 rounded-md font-bold text-lg hover:bg-primary/90 transition-colors shadow-sm">
                            Pay $161.98
                        </button>
                        <p className="text-center text-xs text-muted-foreground mt-4">
                            By placing your order, you agree to our Terms of Use and Privacy Policy.
                        </p>
                    </div>

                </div>
            </div>
        </div>
    );
}
