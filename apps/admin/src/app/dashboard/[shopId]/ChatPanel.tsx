'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useTranslations } from '@ecommerce/i18n/src/react';

interface ChatSession {
  _id: string;
  customerId: string;
  lastMessage: string;
  lastMessageAt: string;
}

interface ChatMessage {
  _id: string;
  senderRole: string;
  content: string;
}

export function ChatPanel({ shopId }: { shopId: string }) {
  const t = useTranslations('admin');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);

  // Use dummy userId for admin for now
  const adminId = 'admin-user-id';

  useEffect(() => {
    if (!socket) {
      const newSocket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/chat', {
        query: { shopId, userId: adminId, role: 'admin' }
      });

      newSocket.on('connect', () => {
        fetchSessions();
      });

      newSocket.on('new_message', (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });

      setSocket(newSocket);

      return () => {
        newSocket.disconnect();
      };
    }
  }, [shopId]);

  const fetchSessions = async () => {
    // Implement fetch sessions when Admin API is ready
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !activeSession) return;
    
    socket.emit('send_message', {
      shopId,
      userId: adminId,
      conversationId: activeSession,
      content: input,
      role: 'admin'
    });
    setInput('');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex h-[600px] animate-in fade-in duration-700">
      {/* Sessions list */}
      <div className="w-1/3 border-r border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-600" />
            {t('chatPanel.title')}
          </h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="text-center text-slate-500 mt-10 text-sm">{t('chatPanel.empty')}</div>
          ) : (
            sessions.map(session => (
              <button 
                key={session._id} 
                onClick={() => setActiveSession(session._id)}
                className={`w-full text-left p-3 rounded-lg mb-1 flex items-start gap-3 hover:bg-slate-50 transition-colors ${activeSession === session._id ? 'bg-indigo-50 border border-indigo-100' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{t('chatPanel.customerPrefix')} {session.customerId.substring(0, 6)}...</div>
                  <div className="text-xs text-slate-500 truncate">{session.lastMessage}</div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-slate-50">
        {activeSession ? (
          <>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, i) => {
                const isAdmin = msg.senderRole === 'admin';
                return (
                  <div key={i} className={`flex items-start gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${isAdmin ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-4 bg-white border-t border-slate-200">
              <form onSubmit={sendMessage} className="flex gap-2">
                <input 
                  type="text" 
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={t('chatPanel.inputPlaceholder')}
                  className="flex-1 border border-slate-300 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                <button type="submit" className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700">
                  <Send className="w-4 h-4 ml-1" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400 flex-col gap-3">
            <MessageCircle className="w-12 h-12 text-slate-300" />
            <p>{t('chatPanel.selectConversation')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
