import React from 'react';

export default function ShopOwnerSalesPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-6">Financial Analytics</h1>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 flex items-center justify-center h-96">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading Revenue Charts...</p>
                    <p className="text-slate-500 text-sm mt-2">(Placeholder for Recharts / Chart.js Integration)</p>
                </div>
            </div>
        </div>
    );
}
