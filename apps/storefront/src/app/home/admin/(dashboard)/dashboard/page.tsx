import React from "react";
import Link from "next/link";
import { Plus, Store, Edit, Trash2, ExternalLink } from "lucide-react";

export default function AdminDashboard() {
    // Mock user's shops
    const myShops = [
        {
            id: "shop_1",
            name: "Duck's Apparel",
            domain: "ducks-apparel.platform.com",
            status: "Published",
            lastEdited: "2 hours ago",
            views: 1250,
            orders: 45
        },
        {
            id: "shop_2",
            name: "Quack Accessories",
            domain: "quack-accs.platform.com",
            status: "Draft",
            lastEdited: "1 day ago",
            views: 0,
            orders: 0
        }
    ];

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">My Shops</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage and edit your e-commerce storefronts.</p>
                </div>
                <button className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm">
                    <Plus className="w-4 h-4" /> Create New Shop
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {myShops.map(shop => (
                    <div key={shop.id} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow group">
                        <div className="h-32 bg-zinc-100 flex items-center justify-center border-b border-zinc-100 relative">
                            <Store className="w-12 h-12 text-zinc-300" />
                            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase shadow-sm border border-zinc-100">
                                {shop.status}
                            </div>
                        </div>
                        <div className="p-5">
                            <h3 className="font-semibold text-lg text-zinc-900">{shop.name}</h3>
                            <div className="flex items-center gap-1 mt-1 text-zinc-500 text-sm">
                                <ExternalLink className="w-3.5 h-3.5" />
                                <a href={`https://${shop.domain}`} className="hover:text-emerald-500 hover:underline">{shop.domain}</a>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-zinc-100">
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium">Monthly Views</p>
                                    <p className="font-semibold text-zinc-700">{shop.views}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-zinc-400 font-medium">Total Orders</p>
                                    <p className="font-semibold text-zinc-700">{shop.orders}</p>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <Link
                                    href="/home/admin/builder"
                                    className="flex-1 bg-zinc-900 hover:bg-zinc-800 text-white text-center py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    <Edit className="w-4 h-4" /> Edit Shop
                                </Link>
                                <button className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-zinc-200 hover:border-red-200">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
