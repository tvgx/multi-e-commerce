import React from "react";
import Link from "next/link";
import { Globe, Plus, AlertCircle, ArrowLeft } from "lucide-react";

export default function DomainPage() {
    return (
        <div className="flex flex-col min-h-[calc(100vh-theme(spacing.16))] py-8">
            <div className="container px-4 md:px-6 mx-auto max-w-5xl">
                <div className="mb-8">
                    <Link href="/dashboard" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground mb-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
                                <Globe className="h-8 w-8 text-primary" /> Domains
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Manage your custom domains to give your brand a professional home on the web.
                            </p>
                        </div>
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2">
                            <Plus className="h-4 w-4" /> Connect Existing Domain
                        </button>
                    </div>
                </div>

                <div className="rounded-xl border border-dashed border-border bg-card/50 p-12 text-center animate-pulse">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-muted">
                        <AlertCircle className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h2 className="mt-6 text-xl font-semibold">Coming Soon</h2>
                    <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                        The domain registry service is currently under construction. You will soon be able to purchase new domains or connect existing ones directly from this dashboard.
                    </p>
                    <div className="mt-8 flex justify-center gap-4">
                        <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2">
                            Learn about custom domains
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
