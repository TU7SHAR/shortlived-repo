"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import {
  Send,
  Plus,
  MessageSquare,
  Trash2,
  Bot,
  User,
  Loader2,
  Menu,
  X,
  Sparkles,
} from "lucide-react";

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [authId, setAuthId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [ready, setReady] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auth
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setReady(true);
        return;
      }
      setUser(authUser);
      setAuthId(authUser.id);
      const res = await fetch(`/api/chat/user?authId=${authUser.id}`);
      const data = await res.json();
      if (data.adminId) setAdminId(data.adminId);
      setReady(true);
    };
    getUser();
  }, []);

  // Load conversations
  useEffect(() => {
    if (!authId) return;
    loadConversations();
  }, [authId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = async () => {
    const res = await fetch(`/api/chat/conversations?userId=${authId}`);
    const data = await res.json();
    setConversations(data.conversations || []);
  };

  const loadMessages = async (conversationId) => {
    const res = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
    const data = await res.json();
    setMessages(data.messages || []);
  };

  const selectConversation = async (conv) => {
    setActiveConversation(conv);
    await loadMessages(conv.id);
    setSidebarOpen(false);
  };

  const createNewChat = async () => {
    const res = await fetch("/api/chat/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: authId, adminId, title: "New Chat" }),
    });
    const data = await res.json();
    if (data.conversation) {
      setConversations((prev) => [data.conversation, ...prev]);
      setActiveConversation(data.conversation);
      setMessages([]);
      setSidebarOpen(false);
    }
  };

  const deleteConversation = async (e, convId) => {
    e.stopPropagation();
    await fetch(`/api/chat/conversations?id=${convId}`, { method: "DELETE" });
    setConversations((prev) => prev.filter((c) => c.id !== convId));
    if (activeConversation?.id === convId) {
      setActiveConversation(null);
      setMessages([]);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setLoading(true);

    const userMsg = { role: "user", content: userMessage, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    // Auto-create conversation if none active
    let convId = activeConversation?.id;
    if (!convId) {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: authId, adminId, title: userMessage.slice(0, 50) }),
      });
      const data = await res.json();
      if (data.conversation) {
        convId = data.conversation.id;
        setActiveConversation(data.conversation);
        setConversations((prev) => [data.conversation, ...prev]);
      }
    }

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, conversationId: convId, authId }),
      });
      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", content: data.response || data.error || "Something went wrong.", id: Date.now() + 1 }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: "assistant", content: "Network error. Please try again.", id: Date.now() + 1 }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  if (ready && !user) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-zinc-50">
        <div className="text-center p-8 max-w-md">
          <Sparkles size={48} className="text-zinc-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-zinc-800 mb-2">Please log in</h2>
          <p className="text-zinc-500 text-sm">You need to be signed in to use the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {sidebarOpen && <div className="fixed inset-0 bg-black/30 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-zinc-900 border-r border-zinc-800 flex flex-col transform transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-3 border-b border-zinc-800">
          <button onClick={createNewChat} className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-200 text-sm font-medium hover:bg-zinc-800 transition-colors">
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {conversations.map((conv) => (
            <div key={conv.id} onClick={() => selectConversation(conv)} className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${activeConversation?.id === conv.id ? "bg-zinc-700 text-white" : "text-zinc-400 hover:bg-zinc-800 hover:text-white"}`}>
              <MessageSquare size={14} className="shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title || "New Chat"}</span>
              <button onClick={(e) => deleteConversation(e, conv.id)} className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-400 transition-all"><Trash2 size={12} /></button>
            </div>
          ))}
          {conversations.length === 0 && <p className="text-zinc-600 text-xs text-center py-8">No conversations yet</p>}
        </div>
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-3 right-3 text-zinc-500 hover:text-white"><X size={18} /></button>
      </aside>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-14 border-b border-zinc-200 flex items-center px-4 shrink-0 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1 mr-3 text-zinc-500 hover:text-zinc-800"><Menu size={20} /></button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center"><Bot size={14} className="text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-800">Salesji AI</h2>
              <p className="text-[10px] text-zinc-400">{loading ? "Thinking..." : "Online"}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-32 py-6 space-y-6">
          {messages.length === 0 && !activeConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><Sparkles size={28} className="text-blue-500" /></div>
              <h2 className="text-xl font-bold text-zinc-800 mb-2">Salesji AI Assistant</h2>
              <p className="text-zinc-500 text-sm max-w-md mb-6">Ask me anything about your products, competitors, pricing, or sales strategies.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {["What products do we offer?", "Compare us vs competitors", "What's our pricing strategy?", "Help me handle a price objection"].map((s) => (
                  <button key={s} onClick={() => { setInput(s); inputRef.current?.focus(); }} className="px-4 py-2.5 rounded-xl border border-zinc-200 text-sm text-zinc-600 hover:bg-zinc-50 hover:border-zinc-300 transition-colors text-left">{s}</button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id || msg.created_at} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"><Bot size={14} className="text-blue-600" /></div>}
              <div className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-zinc-100 text-zinc-800 rounded-tl-sm"}`}>{msg.content}</div>
              {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5"><User size={14} className="text-white" /></div>}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Bot size={14} className="text-blue-600" /></div>
              <div className="bg-zinc-100 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-zinc-200 p-4 bg-white">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} placeholder="Ask Salesji anything..." rows={1} disabled={loading || !authId} className="w-full flex-1 resize-none rounded-xl border border-zinc-300 px-4 py-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50" />
            <button type="submit" disabled={loading || !input.trim() || !authId} className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-center text-[10px] text-zinc-400 mt-2">Salesji only answers from your company&apos;s knowledge base.</p>
        </div>
      </div>
    </div>
  );
}
