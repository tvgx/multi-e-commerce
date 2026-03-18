"use client";
import React, { useState, useEffect } from "react";
import { Search, Loader2 } from "lucide-react";

export default function OrdersPage() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const shopId = "shop-1"; // Default mockup tenant ID

    const columns = [
        { id: "confirm", label: "New / Confirmed" },
        { id: "processing", label: "Processing" },
        { id: "shipped", label: "Shipped" },
        { id: "completed", label: "Delivered" } // For completed orders
    ];

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${getApiUrl()}/api/orders/shop/${shopId}`);
            const data = await res.json();
            if (data.data) {
                setOrders(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleDragStart = (e: React.DragEvent, orderId: string) => {
        e.dataTransfer.setData("orderId", orderId);
    };

    const handleDrop = async (e: React.DragEvent, stateId: string) => {
        e.preventDefault();
        const orderId = e.dataTransfer.getData("orderId");
        if (!orderId) return;

        // Optimistic UI update
        const previousOrders = [...orders];
        setOrders(orders.map(o => o.id === orderId ? { ...o, state: stateId } : o));

        try {
            const getApiUrl = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const res = await fetch(`${getApiUrl()}/api/orders/${orderId}/state`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ state: stateId })
            });
            if (!res.ok) throw new Error("API Failed");
        } catch(err) {
            console.error("Reverting optimistic update", err);
            setOrders(previousOrders);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    return (
        <div className="p-8 h-screen flex flex-col">
            <div className="flex items-center justify-between mb-8 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600">Order Fulfillment</h1>
                    <p className="text-zinc-500 text-sm mt-1">Drag and drop orders to update their shipment status.</p>
                </div>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
                </div>
            ) : (
                <div className="flex gap-6 overflow-x-auto pb-8 flex-1">
                    {columns.map(col => (
                        <div 
                            key={col.id}
                            onDrop={(e) => handleDrop(e, col.id)}
                            onDragOver={handleDragOver}
                            className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col gap-4 min-w-[300px] shrink-0"
                        >
                            <h3 className="font-bold text-sm text-zinc-600 flex justify-between">
                                {col.label}
                                <span className="bg-zinc-200 text-zinc-500 px-2 py-0.5 rounded-full text-xs">
                                    {orders.filter(o => o.state === col.id).length}
                                </span>
                            </h3>

                            <div className="flex flex-col gap-3 min-h-[500px]">
                                {orders.filter(o => o.state === col.id).map(order => (
                                    <div 
                                        key={order.id}
                                        draggable
                                        onDragStart={(e) => handleDragStart(e, order.id)}
                                        className="bg-white p-4 border border-zinc-200 rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow relative"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-emerald-600">{order.number}</span>
                                            <span className="text-xs text-zinc-400">{new Date(order.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="font-medium text-zinc-900 text-sm mb-1">{order.customer?.name || order.customer?.email}</p>
                                        <p className="text-zinc-500 text-xs mb-3">{order.lineItems?.length} items</p>
                                        <div className="flex justify-between items-center border-t border-zinc-100 pt-3">
                                            <span className="font-bold text-sm text-zinc-900">{order.totalAmount.toLocaleString('vi-VN')}đ</span>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-sm uppercase tracking-wider ${order.paymentState === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                                {order.paymentState || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
