import React from "react";
import { Package, Search } from "lucide-react";

export default function OrdersPage() {
    const orders = [
        { id: "#ORD-001", customer: "John Doe", date: "Today, 10:23 AM", total: "$89.98", status: "Fulfilled" },
        { id: "#ORD-002", customer: "Jane Smith", date: "Yesterday, 3:45 PM", total: "$29.99", status: "Unfulfilled" },
    ];

    return (
        <div className="p-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Orders</h1>
                    <p className="text-zinc-500 text-sm mt-1">Manage and track customer shipments.</p>
                </div>
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-zinc-200 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                        <input type="text" placeholder="Search orders..." className="w-full pl-9 pr-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all" />
                    </div>
                </div>

                <table className="w-full text-left text-sm text-zinc-600">
                    <thead className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-medium">
                        <tr>
                            <th className="px-6 py-4">Order</th>
                            <th className="px-6 py-4">Date</th>
                            <th className="px-6 py-4">Customer</th>
                            <th className="px-6 py-4">Total</th>
                            <th className="px-6 py-4 text-right">Fulfillment</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200">
                        {orders.map(order => (
                            <tr key={order.id} className="hover:bg-zinc-50/50 transition-colors cursor-pointer">
                                <td className="px-6 py-4 font-medium text-zinc-900">{order.id}</td>
                                <td className="px-6 py-4 text-zinc-500">{order.date}</td>
                                <td className="px-6 py-4">{order.customer}</td>
                                <td className="px-6 py-4 font-medium text-zinc-700">{order.total}</td>
                                <td className="px-6 py-4 text-right">
                                    <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${order.status === 'Fulfilled' ? "bg-zinc-100 text-zinc-600" : "bg-amber-100 text-amber-700"}`}>
                                        {order.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
