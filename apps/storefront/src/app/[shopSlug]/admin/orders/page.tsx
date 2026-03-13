import React from 'react';

export default function ShopOwnerOrdersPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Order Management</h1>

            <div className="flex gap-4 mb-6">
                <button className="px-4 py-2 bg-slate-800 text-white rounded-lg font-medium">All Orders</button>
                <button className="px-4 py-2 bg-transparent text-slate-400 hover:text-white rounded-lg font-medium">Pending <span className="ml-2 bg-amber-500 text-black px-2 py-0.5 rounded-full text-xs">3</span></button>
                <button className="px-4 py-2 bg-transparent text-slate-400 hover:text-white rounded-lg font-medium">Shipped</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kanban-style simple columns */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="font-semibold text-amber-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span> Pending Processing
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-white">#ORD-001</span>
                                <span className="text-slate-400">10 mins ago</span>
                            </div>
                            <p className="text-slate-300 text-sm">2 items • $89.98</p>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="font-semibold text-blue-400 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-400"></span> In Transit
                    </h3>
                    <div className="text-sm text-slate-500 text-center py-8">No orders in transit</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                    <h3 className="font-semibold text-emerald-500 mb-4 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Delivered
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 opacity-60">
                            <div className="flex justify-between text-sm mb-2">
                                <span className="font-bold text-white">#ORD-000</span>
                                <span className="text-slate-400">2 days ago</span>
                            </div>
                            <p className="text-slate-300 text-sm">1 item • $45.00</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
