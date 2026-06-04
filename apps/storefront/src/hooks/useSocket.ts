'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface SocketOptions {
  shopId: string;
  customerId?: string;
  token?: string;
}

export function useSocket({ shopId, customerId, token }: SocketOptions) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!shopId) return;

    const socketInstance = io(`${SOCKET_URL}/notifications`, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      // Join shop-specific and customer-specific rooms
      socketInstance.emit('join', { shopId, customerId });
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [shopId, customerId, token]);

  return { socket, connected };
}
