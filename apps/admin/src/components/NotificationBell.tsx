'use client';

import React, { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function NotificationBell({ shopId }: { shopId: string }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<{ id: string, message: string, date: string }[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    // Use admin token if needed, or just rely on backend auth setup
    // For simplicity, we just connect to the notifications namespace
    const socketInstance = io(`${SOCKET_URL}/notifications`, {
      reconnection: true,
    });

    socketInstance.on('connect', () => {
      socketInstance.emit('join', { shopId });
    });

    socketInstance.on('ORDER_CREATED', (data: any) => {
      setUnreadCount(prev => prev + 1);
      setNotifications(prev => [{
        id: Math.random().toString(),
        message: data.message || 'New order received!',
        date: new Date().toLocaleTimeString()
      }, ...prev].slice(0, 10)); // Keep last 10
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [shopId]);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setUnreadCount(0);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={toggleOpen}
        className="w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-all relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full animate-pulse"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden text-sm">
          <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
            <h3 className="font-bold text-white">Notifications</h3>
            {unreadCount > 0 && (
              <span className="text-xs bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded-md">{unreadCount} New</span>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500">
                No recent notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-800/50">
                {notifications.map(notif => (
                  <div key={notif.id} className="p-4 hover:bg-white/5 transition-colors">
                    <p className="text-slate-200">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-1">{notif.date}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
