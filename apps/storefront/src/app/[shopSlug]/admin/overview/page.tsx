import React from 'react';

export default function ShopOwnerOverviewPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 font-medium mb-2">Total Sales</h3>
                    <p className="text-3xl font-bold">$12,450</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 font-medium mb-2">Active Orders</h3>
                    <p className="text-3xl font-bold text-amber-500">14</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
                    <h3 className="text-slate-400 font-medium mb-2">Total Products</h3>
                    <p className="text-3xl font-bold text-emerald-500">42</p>
                </div>
            </div>
        </div>
    );
}
