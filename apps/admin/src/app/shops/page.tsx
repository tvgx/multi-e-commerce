import React from 'react';
import { Store, Settings, ExternalLink, Download } from 'lucide-react';

export default function ShopsManagementPage() {
    // This would fetch from NestJS (GET /api/system/shops)
    const mockShops = [
        { id: '111-222', name: 'Duck Store', domain: 'duckstore.com', status: 'ACTIVE' },
        { id: '333-444', name: 'Tech Gear', domain: 'tech.vercel.app', status: 'DRAFT' }
    ];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 text-slate-100 bg-slate-950 min-h-screen">
            <h1 className="text-3xl font-bold flex items-center gap-2">
                <Store className="text-emerald-500" /> Tenant Management
            </h1>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden mt-8">
                <table className="w-full text-left">
                    <thead className="bg-slate-800 text-slate-400">
                        <tr>
                            <th className="p-4 font-medium">Shop Name</th>
                            <th className="p-4 font-medium">Domain</th>
                            <th className="p-4 font-medium">Status</th>
                            <th className="p-4 font-medium">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                        {mockShops.map((shop) => (
                            <tr key={shop.id} className="hover:bg-slate-800/50">
                                <td className="p-4 font-semibold text-white">{shop.name}</td>
                                <td className="p-4 text-emerald-400 font-mono text-sm">{shop.domain}</td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${shop.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-500'}`}>
                                        {shop.status}
                                    </span>
                                </td>
                                <td className="p-4 opacity-0 hover:opacity-100 transition-opacity">
                                    <div className="flex items-center gap-3">
                                        <button className="text-xs flex items-center gap-1 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md text-white">
                                            <ExternalLink className="w-3 h-3" /> Debug Shop
                                        </button>
                                        <button className="text-xs flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-1.5 rounded-md text-amber-500">
                                            <Download className="w-3 h-3" /> Eject Codebase
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-900/20 border border-blue-500/20 p-4 rounded-xl text-blue-300 text-sm">
                <strong>Super Admin Notice:</strong> Clicking "Debug Shop" will generate a temporary JWT and redirect you to the localized Storefront UI (`http://[shop].vercel.app/admin`) acting as the Owner. Clicking "Eject Codebase" will provide you the CLI command (`python main.py eject -id [shopId]`) to run locally.
            </div>
        </div>
    );
}
