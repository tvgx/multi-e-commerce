import React from "react";
import Link from "next/link";
import { LayoutDashboard, Globe, Store, ArrowRight, Settings, Plus } from "lucide-react";

export default function DashboardPage() {
    return (
        <div className="flex flex-col min-h-screen bg-muted/30">
            {/* Dashboard Specific Header / Nav */}
            <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-border bg-background px-4 md:px-6 shadow-sm">
                <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
                    <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
                        <Store className="h-4 w-4" />
                    </div>
                    <span className="text-xl">Platform Dashboard</span>
                </Link>
                <nav className="hidden md:flex items-center gap-6 ml-6 text-sm font-medium">
                    <Link href="/dashboard" className="text-foreground transition-colors hover:text-foreground">
                        Overview
                    </Link>
                    <Link href="/builder" className="text-muted-foreground transition-colors hover:text-foreground">
                        Shop Builder
                    </Link>
                    <Link href="/domain" className="text-muted-foreground transition-colors hover:text-foreground">
                        Domains
                    </Link>
                    <Link href="/payment" className="text-muted-foreground transition-colors hover:text-foreground">
                        Billing
                    </Link>
                </nav>
                <div className="ml-auto flex items-center gap-4">
                    <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground">
                        Sign out
                    </Link>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 lg:p-10 max-w-7xl mx-auto w-full">
                <div className="flex flex-col gap-4 mb-8 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Welcome back, Creator!</h1>
                        <p className="text-muted-foreground mt-1">Manage your e-commerce ecosystem from one central hub.</p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            href="/builder"
                            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
                        >
                            <Plus className="h-4 w-4" /> New Store
                        </Link>
                    </div>
                </div>

                {/* Services Overview */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">

                    {/* Service Card 1: Shop Builder */}
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="h-40 bg-zinc-900 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80"
                                alt="E-commerce Builder"
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Store className="h-16 w-16 text-white opacity-90" />
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-2">
                            <h3 className="text-2xl font-semibold leading-none tracking-tight">E-Commerce Builder</h3>
                            <p className="text-sm text-muted-foreground">
                                Design and manage your online store using our intuitive drag-and-drop builder. Pick a template and customize your entire frontend without any coding.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex items-center pt-4 border-t border-border mt-2">
                            <Link href="/builder" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
                                Open Shop Builder <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Service Card 2: Custom Domain */}
                    <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm hover:shadow-md transition-all overflow-hidden group">
                        <div className="h-40 bg-blue-900 overflow-hidden relative">
                            <img
                                src="https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80"
                                alt="Custom Domain"
                                className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Globe className="h-16 w-16 text-white opacity-90" />
                            </div>
                        </div>
                        <div className="p-6 flex flex-col gap-2">
                            <h3 className="text-2xl font-semibold leading-none tracking-tight">Custom Domain Management</h3>
                            <p className="text-sm text-muted-foreground">
                                Connect your existing custom domain or purchase a new one to give your brand a professional identity on the internet. Setup TLS/SSL automatically.
                            </p>
                        </div>
                        <div className="p-6 pt-0 flex items-center pt-4 border-t border-border mt-2">
                            <Link href="/domain" className="text-sm font-medium text-primary hover:underline flex items-center gap-1 group-hover:gap-2 transition-all">
                                Manage Domains <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
