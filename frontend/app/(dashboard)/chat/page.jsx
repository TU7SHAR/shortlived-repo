"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { clearUserCookies } from "@/app/actions/logout";
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
  LogOut,
  GraduationCap,
  ClipboardCheck,
  UserPlus,
  MessagesSquare,
} from "lucide-react";

const MODES = [
  {
    id: "assistant",
    label: "Use Assistant",
    icon: MessagesSquare,
    blurb: "Ask anything about your products, competitors, pricing, or sales strategy.",
    suggestions: [
      "What products do we offer?",
      "Compare us vs competitors",
      "What's our pricing strategy?",
      "Help me handle a price objection",
    ],
    kickoff: null,
  },
  {
    id: "onboarding",
    label: "Onboarding",
    icon: UserPlus,
    blurb: "Get set up. I'll capture your profile to personalize your training.",
    suggestions: ["I'm ready to start onboarding"],
    kickoff: "I'm ready to start onboarding.",
  },
  {
    id: "training",
    label: "Training",
    icon: GraduationCap,
    blurb: "Interactive product & competitor training with live roleplay.",
    suggestions: ["Start my training session"],
    kickoff: "Start my training session.",
  },
  {
    id: "testing",
    label: "Test",
    icon: ClipboardCheck,
    blurb: "Quiz yourself on the company knowledge base.",
    suggestions: ["Start the test"],
    kickoff: "Start the test.",
  },
];

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
  const [mode, setMode] = useState("assistant");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const activeMode = MODES.find((m) => m.id === mode) || MODES[0];

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
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

  useEffect(() => {
    if (!authId) return;
    loadConversations();
  }, [authId]);

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
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
    inputRef.current?.focus();
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    setActiveConversation(null);
    setMessages([]);
    setSidebarOpen(false);
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

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      await clearUserCookies();
    } catch (e) {}
    window.location.href = "/login";
  };

  const doSend = async (text) => {
    if (!text.trim() || loading) return;
    setLoading(true);
    const userMsg = { role: "user", content: text, id: Date.now() };
    setMessages((prev) => [...prev, userMsg]);

    let convId = activeConversation?.id;
    if (!convId) {
      const res = await fetch("/api/chat/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: authId,
          adminId,
          title: `${activeMode.label}: ${text.slice(0, 40)}`,
        }),
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
        body: JSON.stringify({
          message: text,
          conversationId: convId,
          authId,
          mode,
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.response || data.error || "Something went wrong.",
          id: Date.now() + 1,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Network error. Please try again.", id: Date.now() + 1 },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const sendMessage = (e) => {
    e.preventDefault();
    const text = input.trim();
    setInput("");
    doSend(text);
  };

  if (ready && !user) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="text-center p-8 max-w-md">
          <Sparkles size={48} className="text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Please log in</h2>
          <p className="text-slate-500 text-sm">You need to be signed in to use the chat.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — light, dashboard-style */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 md:relative md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand */}
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Sales<span className="text-blue-600">ji</span>
          </span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden ml-auto text-slate-400 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mode nav */}
        <div className="px-3 pt-4">
          <p className="px-3 mb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Modes
          </p>
          <div className="space-y-1">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = m.id === mode;
              return (
                <button
                  key={m.id}
                  onClick={() => switchMode(m.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                  {m.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* New chat + conversations */}
        <div className="px-3 pt-5">
          <button
            onClick={createNewChat}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            <Plus size={16} /> New Chat
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-0.5">
          <p className="px-3 mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            History
          </p>
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => selectConversation(conv)}
              className={`group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                activeConversation?.id === conv.id
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
              }`}
            >
              <MessageSquare size={14} className="shrink-0" />
              <span className="text-sm truncate flex-1">{conv.title || "New Chat"}</span>
              <button
                onClick={(e) => deleteConversation(e, conv.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="text-slate-400 text-xs text-center py-6">No conversations yet</p>
          )}
        </div>

        {/* User + sign out */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-1">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <User size={14} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">
                {user?.email || "User"}
              </p>
              <p className="text-[10px] text-slate-400">Sales Rep</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-4 shrink-0 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden p-1.5 -ml-1 mr-3 text-slate-500 hover:text-slate-800"
          >
            <Menu size={20} />
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <activeMode.icon size={15} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">{activeMode.label}</h2>
              <p className="text-[10px] text-slate-400">
                {loading ? "Thinking..." : "Salesji AI · Online"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-32 py-6 space-y-6 bg-slate-50/50">
          {messages.length === 0 && !activeConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                <activeMode.icon size={28} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">{activeMode.label}</h2>
              <p className="text-slate-500 text-sm max-w-md mb-6">{activeMode.blurb}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {activeMode.suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => doSend(s)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 hover:bg-white hover:border-slate-300 transition-colors text-left"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id || msg.created_at}
              className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-blue-600" />
                </div>
              )}
              <div
                className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white rounded-tr-sm"
                    : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-white" />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-blue-600" />
              </div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-slate-200 p-4 bg-white">
          <form onSubmit={sendMessage} className="max-w-3xl mx-auto flex items-end gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(e);
                }
              }}
              placeholder={`Message ${activeMode.label}...`}
              rows={1}
              disabled={loading || !authId}
              className="w-full flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim() || !authId}
              className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
          <p className="text-center text-[10px] text-slate-400 mt-2">
            Salesji answers from your company's knowledge base.
          </p>
        </div>
      </div>
    </div>
  );
}
