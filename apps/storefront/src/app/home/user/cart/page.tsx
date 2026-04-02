import React from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';

export default function Cart() {
    const cartItems = [
        {
            id: "1",
            title: "Classic White Tee",
            price: 29.99,
            quantity: 2,
            imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=60"
        },
        {
            id: "2",
            title: "Denim Jacket",
            price: 89.99,
            quantity: 1,
            imageUrl: "https://images.unsplash.com/photo-1551537482-f209bfc4487b?auto=format&fit=crop&w=200&q=60"
        }
    ];

    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);

    return (
        <div className="container mx-auto px-4 py-12 max-w-6xl">
            <h1 className="text-3xl font-bold tracking-tight mb-8">Shopping Cart</h1>

            <div className="lg:grid lg:grid-cols-12 lg:gap-x-12 lg:items-start">
                {/* Cart Items */}
                <div className="lg:col-span-8">
                    <ul role="list" className="border-t border-b divide-y">
                        {cartItems.map((item) => (
                            <li key={item.id} className="py-6 flex sm:py-10">
                                <div className="flex-shrink-0 w-24 h-24 sm:w-32 sm:h-32 rounded-md overflow-hidden bg-muted">
                                    <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover object-center" />
                                </div>

                                <div className="ml-4 flex-1 flex flex-col justify-between sm:ml-6">
                                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                                        <div>
                                            <h3 className="text-lg font-medium text-foreground">
                                                <Link href={`/products/${item.id}`}>{item.title}</Link>
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">${item.price}</p>
                                        </div>

                                        <div className="mt-4 sm:mt-0 sm:pr-9 flex items-center justify-between">
                                            <select
                                                defaultValue={item.quantity}
                                                className="max-w-full rounded-md border border-border bg-background py-1.5 px-3 text-base leading-5 font-medium text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                                            >
                                                {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                                    <option key={n} value={n}>{n}</option>
                                                ))}
                                            </select>

                                            <button type="button" className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                                                <span className="sr-only">Remove</span>
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Order Summary */}
                <section className="mt-16 bg-muted/50 rounded-lg px-4 py-6 sm:p-6 lg:p-8 lg:mt-0 lg:col-span-4 lg:sticky lg:top-24">
                    <h2 className="text-lg font-medium text-foreground">Order summary</h2>

                    <dl className="mt-6 space-y-4 text-sm text-muted-foreground">
                        <div className="flex items-center justify-between">
                            <dt>Subtotal</dt>
                            <dd className="font-medium text-foreground">${subtotal.toFixed(2)}</dd>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <dt>Shipping estimate</dt>
                            <dd className="font-medium text-foreground">$5.00</dd>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4">
                            <dt>Tax estimate</dt>
                            <dd className="font-medium text-foreground">${(subtotal * 0.08).toFixed(2)}</dd>
                        </div>
                        <div className="flex items-center justify-between border-t pt-4 text-base font-medium text-foreground">
                            <dt>Order total</dt>
                            <dd>${(subtotal + 5 + subtotal * 0.08).toFixed(2)}</dd>
                        </div>
                    </dl>

                    <div className="mt-6">
                        <Link
                            href="/payment"
                            className="w-full bg-primary border border-transparent rounded-md shadow-sm py-3 px-4 text-base font-medium text-primary-foreground hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-primary flex justify-center transition-colors"
                        >
                            Checkout
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
