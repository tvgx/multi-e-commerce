'use client';

import React from 'react';
import Link from 'next/link';
import { Search, User, ShoppingCart, Menu } from 'lucide-react';

export interface HeaderProps {
    logo?: {
        url?: string;
        text?: string;
    };
    navigation?: {
        label: string;
        href: string;
    }[];
}

export const Header: React.FC<HeaderProps> = ({
    logo = { text: 'STOREFRONT' },
    navigation = [
        { label: 'Home', href: '/' },
        { label: 'Catalog', href: '/catalog' },
        { label: 'Contact', href: '/contact' }
    ]
}) => {
    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center">
                        {/* Mobile menu */}
                        <button className="mr-4 lg:hidden p-2 text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Open menu</span>
                            <Menu className="h-6 w-6" />
                        </button>
                        <Link href="/" className="flex items-center space-x-2">
                            <span className="font-bold text-xl tracking-tighter">
                                {logo.text}
                            </span>
                        </Link>
                        <nav className="hidden lg:flex lg:ml-10 space-x-8">
                            {navigation.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className="text-sm font-medium transition-colors hover:text-primary text-muted-foreground hover:text-foreground"
                                >
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button className="p-2 text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Search</span>
                            <Search className="h-5 w-5" />
                        </button>
                        <Link href="/profile" className="p-2 text-muted-foreground hover:text-foreground">
                            <span className="sr-only">Account</span>
                            <User className="h-5 w-5" />
                        </Link>
                        <Link href="/cart" className="p-2 text-muted-foreground hover:text-foreground relative">
                            <span className="sr-only">Cart</span>
                            <ShoppingCart className="h-5 w-5" />
                            {/* Optional Cart Badge */}
                            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
                        </Link>
                    </div>
                </div>
            </div>
        </header>
    );
};
