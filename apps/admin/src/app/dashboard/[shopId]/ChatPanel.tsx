'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MessageCircle, Send, User } from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useTranslations } from '@ecommerce/i18n/src/react';
import { apiClient } from '@/lib/api-client';

interface ChatSession {
  _id: string;
  customerId: string;
  customerName?: string | null;
  customerEmail?: string | null;
  lastMessage: string;
  lastMessageAt: string;
}

interface ChatMessage {
  _id: string;
  sessionId?: string;
  senderRole: string;
  content: string;
}

/**
 * Panel chat của seller (TODO 18): danh sách phiên + tin nhắn lấy qua API thật
 * (better-auth cookie), gửi qua HTTP; socket /chat chỉ để nhận realtime.
 */
export function ChatPanel({ shopId }: { shopId: string }) {
  const t = useTranslations('admin');
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const activeSessionRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  activeSessionRef.current = activeSession;

  const fetchSessions = useCallback(async () => {
    try {
      const res = await apiClient.get<any>('/api/chat/sessions', { shopId });
      const body: any = res;
      setSessions(body?.data ?? []);
    } catch (e) {
      console.error('Failed to load chat sessions', e);
    }
  }, [shopId]);

  useEffect(() => {
    fetchSessions();

    // Socket nhận realtime — room admin theo shop.
    const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').replace(/\/$/, '');
    const socket = io(`${apiBase}/chat`, {
      query: { shopId, userId: `admin_${shopId}`, role: 'admin' },
    });
    socket.on('new_message', (msg: ChatMessage) => {
      // Tin thuộc phiên đang mở → append (dedupe); mọi tin → refresh session list.
      if (msg.sessionId && msg.sessionId === activeSessionRef.current) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
      }
      fetchSessions();
    });
    socketRef.current = socket;
    return () => {
      socket.disconnect();
    };
  }, [shopId, fetchSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const openSession = async (sessionId: string) => {
    setActiveSession(sessionId);
    setMessages([]);
    try {
      const res = await apiClient.get<any>(`/api/chat/sessions/${sessionId}/messages?limit=50`, { shopId });
      const body: any = res;
      setMessages(body?.data ?? []);
    } catch (e) {
      console.error('Failed to load messages', e);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !activeSession || sending) return;
    setSending(true);
    try {
      const res = await apiClient.post<any>(
        `/api/chat/sessions/${activeSession}/messages`,
        { content: input },
        { shopId },
      );
      const body: any = res;
      if (body?.data) {
        setMessages((prev) => (prev.some((m) => m._id === body.data._id) ? prev : [...prev, body.data]));
      }
      setInput('');
      fetchSessions();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
    }
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
                onClick={() => openSession(session._id)}
                className={`w-full text-left p-3 rounded-lg mb-1 flex items-start gap-3 hover:bg-slate-50 transition-colors ${activeSession === session._id ? 'bg-indigo-50 border border-indigo-100' : ''}`}
              >
                <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-slate-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">
                    {session.customerName || session.customerEmail || `${t('chatPanel.customerPrefix')} ${session.customerId.substring(0, 6)}…`}
                  </div>
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
              {messages.map((msg) => {
                const isAdmin = msg.senderRole === 'admin';
                return (
                  <div key={msg._id} className={`flex items-start gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                    <div className={`p-3 rounded-2xl text-sm max-w-[80%] ${isAdmin ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
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
                <button type="submit" disabled={sending} className="w-10 h-10 bg-indigo-600 text-white rounded-full flex items-center justify-center hover:bg-indigo-700 disabled:opacity-60">
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
