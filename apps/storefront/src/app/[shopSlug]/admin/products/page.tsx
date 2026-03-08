import React from 'react';

export default function ShopOwnerProductsPage() {
    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Product Management</h1>
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                    + Add New Product
                </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-800 text-slate-400">
                        <tr>
                            <th className="p-4 font-medium">Product / SKU</th>
                            <th className="p-4 font-medium">Price</th>
                            <th className="p-4 font-medium">Inventory</th>
                            <th className="p-4 font-medium text-center">Status</th>
                            <th className="p-4 font-medium text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                        <tr className="hover:bg-slate-800/50">
                            <td className="p-4">
                                <p className="font-semibold text-white">Signature Canvas T-Shirt</p>
                                <p className="text-xs text-slate-500">SKU: TSHIRT-CANVAS-01</p>
                            </td>
                            <td className="p-4">$29.99</td>
                            <td className="p-4">120 in Stock</td>
                            <td className="p-4 text-center"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs">Active</span></td>
                            <td className="p-4 text-right">
                                <button className="text-blue-400 hover:underline">Edit</button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
