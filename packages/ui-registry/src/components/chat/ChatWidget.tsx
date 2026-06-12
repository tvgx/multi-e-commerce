'use client';

import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface ChatMessage {
  _id: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export function ChatWidget({ shopId, customerId }: { shopId: string; customerId?: string }) {
  const t = useTranslations('shop');
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize socket connection when chat is opened for the first time
  useEffect(() => {
    if (isOpen && !socket && customerId) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/chat', {
        query: { shopId, userId: customerId, role: 'customer' }
      });

      newSocket.on('connect', () => {
        console.log('Chat connected');
        fetchMessages();
      });

      newSocket.on('new_message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [isOpen, customerId]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/api-core/chat/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.data || []);
      }
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket) return;
    
    setLoading(true);
    try {
      socket.emit('send_message', {
        shopId,
        userId: customerId,
        content: input,
        role: 'customer'
      }, (response: any) => {
        // Acknowledgement callback
      });
      setInput('');
    } catch (e) {
      console.error('Failed to send message', e);
    } finally {
      setLoading(false);
    }
  };

  if (!customerId) return null; // Don't show chat if not logged in

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        aria-label={t('chat.openAria')}
        className={`fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-indigo-700 transition-transform ${isOpen ? 'scale-0' : 'scale-100'} z-50`}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col transition-all origin-bottom-right z-50 ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'} h-[500px] max-h-[80vh]`}>
        {/* Header */}
        <div className="bg-indigo-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
              <MessageCircle size={18} />
            </div>
            <div>
              <h3 className="font-bold">{t('chat.title')}</h3>
              <p className="text-xs text-indigo-200">{t('chat.subtitle')}</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} aria-label={t('chat.closeAria')} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
          <div className="text-center text-xs text-slate-400 mb-6">{t('chat.today')}</div>

          <div className="flex items-start gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0 flex items-center justify-center text-slate-500 font-bold text-xs">
              AD
            </div>
            <div className="bg-white border border-slate-100 p-3 rounded-2xl rounded-tl-sm text-sm text-slate-700 shadow-sm">
              {t('chat.greeting')}
            </div>
          </div>

          {messages.map((msg) => {
            const isMe = msg.senderRole === 'customer';
            return (
              <div key={msg._id} className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : ''}`}>
                <div className={`bg-${isMe ? 'indigo-600' : 'white border border-slate-100'} p-3 rounded-2xl ${isMe ? 'rounded-tr-sm text-white' : 'rounded-tl-sm text-slate-700 shadow-sm'} text-sm max-w-[85%]`}>
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-slate-100">
          <form onSubmit={sendMessage} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('chat.inputPlaceholder')}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              aria-label={t('chat.sendAria')}
              className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-1" />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
