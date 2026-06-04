'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { useParams } from 'next/navigation';

export function NotificationToast({ customerId, token }: { customerId?: string, token?: string }) {
    const params = useParams();
    const shopSlug = params?.shopSlug as string;
    
    // In a real app, shopSlug might need to be resolved to shopId for socket connection,
    // or the backend allows joining by shopSlug. Assuming backend accepts shopSlug or we get shopId somewhere.
    // For now, passing shopSlug as shopId.
    const { socket } = useSocket({ shopId: shopSlug, customerId, token });
    
    const [notifications, setNotifications] = useState<{ id: string, message: string, type: string }[]>([]);

    useEffect(() => {
        if (!socket) return;

        const handleNotification = (data: any) => {
            const id = Math.random().toString(36).substring(7);
            setNotifications(prev => [...prev, { id, message: data.message || 'New notification', type: data.type || 'info' }]);
            
            // Auto remove after 5 seconds
            setTimeout(() => {
                setNotifications(prev => prev.filter(n => n.id !== id));
            }, 5000);
        };

        socket.on('PAYMENT_CONFIRMED', handleNotification);
        socket.on('ORDER_STATUS_CHANGED', handleNotification);

        return () => {
            socket.off('PAYMENT_CONFIRMED', handleNotification);
            socket.off('ORDER_STATUS_CHANGED', handleNotification);
        };
    }, [socket]);

    if (notifications.length === 0) return null;

    return (
        <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
            {notifications.map(notif => (
                <div 
                    key={notif.id} 
                    className="bg-slate-900 text-white px-6 py-4 rounded-xl shadow-xl flex items-center justify-between min-w-[300px] animate-in slide-in-from-right-4 fade-in duration-300"
                >
                    <div>
                        <p className="font-bold text-sm">Update</p>
                        <p className="text-sm text-slate-300">{notif.message}</p>
                    </div>
                    <button 
                        onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                        className="text-slate-400 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
