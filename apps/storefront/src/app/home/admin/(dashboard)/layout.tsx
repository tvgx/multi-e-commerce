import React from "react";
import Link from "next/link";
import { LayoutDashboard, Package, ShoppingCart, Settings, ArrowLeft } from "lucide-react";

export default function AdminDashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex h-screen bg-zinc-50 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-64 bg-zinc-900 text-zinc-300 flex flex-col hidden md:flex">
                <div className="h-16 flex items-center px-6 border-b border-zinc-800 text-white font-bold text-lg">
                    Duck Platform
                </div>
                <nav className="flex-1 px-4 py-6 text-sm font-medium space-y-1">
                    <Link href="/home/admin/dashboard" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                        <LayoutDashboard className="w-5 h-5 text-zinc-400" />
                        Dashboard
                    </Link>
                    <Link href="/home/admin/products" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                        <Package className="w-5 h-5 text-zinc-400" />
                        Products
                    </Link>
                    <Link href="/home/admin/orders" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                        <ShoppingCart className="w-5 h-5 text-zinc-400" />
                        Orders
                    </Link>
                    <Link href="/home/admin/settings" className="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-zinc-800 hover:text-white transition-colors">
                        <Settings className="w-5 h-5 text-zinc-400" />
                        Settings
                    </Link>
                </nav>
                <div className="p-4 border-t border-zinc-800">
                    <Link href="/home/admin" className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Exit to Platform
                    </Link>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 overflow-y-auto bg-zinc-50">
                {children}
            </main>
        </div>
    );
}
