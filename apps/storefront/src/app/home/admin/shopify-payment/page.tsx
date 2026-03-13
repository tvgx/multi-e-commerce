import React from "react";
import Link from "next/link";
import { CreditCard, CheckCircle2, ShieldCheck, ArrowLeft } from "lucide-react";

export default function PaymentPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] py-8 bg-muted/20">
            <div className="container px-4 md:px-6 mx-auto max-w-6xl">
                <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-6">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Checkout Form */}
                    <div className="md:col-span-2 space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
                            <p className="text-muted-foreground mt-1">Complete your purchase to unlock premium features.</p>
                        </div>

                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
                            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" /> Payment Method
                            </h2>
                            <form className="space-y-4">
                                <div className="space-y-2">
                                    <label htmlFor="card-name" className="text-sm font-medium leading-none">Name on card</label>
                                    <input
                                        id="card-name"
                                        placeholder="John Doe"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label htmlFor="card-number" className="text-sm font-medium leading-none">Card number</label>
                                    <input
                                        id="card-number"
                                        placeholder="0000 0000 0000 0000"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label htmlFor="card-expiry" className="text-sm font-medium leading-none">Expiry date</label>
                                        <input
                                            id="card-expiry"
                                            placeholder="MM/YY"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label htmlFor="card-cvc" className="text-sm font-medium leading-none">CVC</label>
                                        <input
                                            id="card-cvc"
                                            placeholder="123"
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-sm sticky top-24">
                            <h2 className="text-xl font-semibold mb-4 text-foreground">Order Summary</h2>

                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex flex-col">
                                        <span className="font-medium text-foreground">Pro Shop Plan</span>
                                        <span>Billed Monthly</span>
                                    </span>
                                    <span className="font-medium">$29.00</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground flex flex-col">
                                        <span className="font-medium text-foreground">Custom Domain Registration</span>
                                        <span>.com ending (1 year)</span>
                                    </span>
                                    <span className="font-medium">$12.00</span>
                                </div>

                                <div className="border-t border-border pt-4 mt-4">
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>Total due today</span>
                                        <span>$41.00</span>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 space-y-4">
                                <button className="w-full inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8">
                                    Pay $41.00
                                </button>
                                <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1">
                                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> Secure 256-bit SSL encryption
                                </p>
                            </div>

                            {/* Guarantees */}
                            <div className="mt-8 space-y-3">
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium">14-Day Money Back Guarantee</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Cancel anytime within 14 days for a full refund.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <h4 className="text-sm font-medium">Instant Access</h4>
                                        <p className="text-xs text-muted-foreground mt-0.5">Start building your shop instantly after payment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
