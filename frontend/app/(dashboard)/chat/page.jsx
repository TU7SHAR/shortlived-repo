"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";
import { clearUserCookies } from "@/app/actions/logout";
import {
  Send,
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
  KeyRound,
} from "lucide-react";

const MODES = [
  { id: "assistant", label: "Use Assistant", icon: MessagesSquare },
  { id: "onboarding", label: "Start Onboarding", icon: UserPlus },
  { id: "training", label: "Start Training", icon: GraduationCap },
  { id: "testing", label: "Take Test", icon: ClipboardCheck },
];

export default function ChatPage() {
  const [user, setUser] = useState(null);
  const [authId, setAuthId] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [ready, setReady] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mode, setMode] = useState("assistant");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ new: "", confirm: "" });
  const [passwordMsg, setPasswordMsg] = useState(null);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { setReady(true); return; }
      setUser(authUser);
      setAuthId(authUser.id);
      const res = await fetch(`/api/chat/user?authId=${authUser.id}`);
      const data = await res.json();
      if (data.adminId) setAdminId(data.adminId);
      if (data.userId) setAuthId(data.userId);
      setReady(true);
    };
    getUser();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const switchMode = (newMode) => {
    setMode(newMode);
    setMessages([]);
    setSidebarOpen(false);
    // Auto-send a kickoff message for flows
    if (newMode === "onboarding") doSend("Start onboarding", newMode);
    else if (newMode === "training") doSend("Ready", newMode);
    else if (newMode === "testing") doSend("Start the test", newMode);
  };

  const signOut = async () => {
    try { await supabase.auth.signOut(); await clearUserCookies(); } catch (e) {}
    window.location.href = "/login";
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    if (passwordForm.new.length < 6) { setPasswordMsg({ type: "error", text: "Min 6 characters." }); return; }
    if (passwordForm.new !== passwordForm.confirm) { setPasswordMsg({ type: "error", text: "Passwords don't match." }); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({ password: passwordForm.new });
    if (error) setPasswordMsg({ type: "error", text: error.message });
    else { setPasswordMsg({ type: "success", text: "Password updated!" }); setPasswordForm({ new: "", confirm: "" }); setTimeout(() => setShowPasswordModal(false), 1500); }
    setPasswordLoading(false);
  };

  const doSend = async (text, overrideMode) => {
    if (!text.trim() || loading) return;
    const activeMode = overrideMode || mode;
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text, id: Date.now() }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, authId, mode: activeMode }),
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
      {sidebarOpen && <div className="fixed inset-0 bg-slate-900/30 z-40 md:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar — minimal, Telegram-style */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-200 md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="h-16 flex items-center gap-2.5 px-5 border-b border-slate-100 shrink-0">
          <div className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center shadow-sm">
            <Bot size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight text-slate-900">Sales<span className="text-blue-600">ji</span></span>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden ml-auto text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>

        {/* Mode buttons — like Telegram's inline menu */}
        <div className="flex-1 px-3 pt-5 space-y-2">
          {MODES.map((m) => {
            const Icon = m.icon;
            const active = m.id === mode;
            return (
              <button
                key={m.id}
                onClick={() => switchMode(m.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  active ? "bg-blue-600 text-white shadow-md" : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                {m.label}
              </button>
            );
          })}
        </div>

        {/* User + actions */}
        <div className="p-3 border-t border-slate-100 shrink-0 space-y-2">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><User size={14} className="text-blue-600" /></div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-slate-700 truncate">{user?.email || "User"}</p>
              <p className="text-[10px] text-slate-400">Sales Rep</p>
            </div>
          </div>
          <button onClick={() => { setShowPasswordModal(true); setPasswordMsg(null); }} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-medium py-2 px-4 rounded-lg transition-colors text-sm">
            <KeyRound size={14} /> Change Password
          </button>
          <button onClick={signOut} className="w-full flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium py-2.5 px-4 rounded-lg transition-colors text-sm">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-16 border-b border-slate-200 flex items-center px-4 shrink-0 bg-white">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1.5 -ml-1 mr-3 text-slate-500 hover:text-slate-800"><Menu size={20} /></button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center"><Bot size={15} className="text-blue-600" /></div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">Salesji AI</h2>
              <p className="text-[10px] text-slate-400">{loading ? "Thinking..." : "Online"}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-8 lg:px-16 xl:px-24 py-6 space-y-5 bg-slate-50/50">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4"><Sparkles size={28} className="text-blue-500" /></div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">Salesji AI Assistant</h2>
              <p className="text-slate-500 text-sm max-w-md mb-6">Select a mode from the menu, or just type a question below.</p>
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0 mt-0.5"><Bot size={14} className="text-blue-600" /></div>}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.role === "user" ? "bg-blue-600 text-white rounded-tr-sm" : "bg-white border border-slate-200 text-slate-800 rounded-tl-sm shadow-sm"}`}>{msg.content}</div>
              {msg.role === "user" && <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center shrink-0 mt-0.5"><User size={14} className="text-white" /></div>}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Bot size={14} className="text-blue-600" /></div>
              <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
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
            <textarea ref={inputRef} value={input} onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = Math.min(e.target.scrollHeight, 150) + "px"; }} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(e); } }} placeholder="Type a message..." rows={1} disabled={loading || !authId} className="w-full flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all disabled:opacity-50" />
            <button type="submit" disabled={loading || !input.trim() || !authId} className="p-3 rounded-xl bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0">
              {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowPasswordModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl border border-slate-200">
            <button onClick={() => setShowPasswordModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700"><X size={18} /></button>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center"><KeyRound size={18} className="text-blue-600" /></div>
              <div><h3 className="text-lg font-bold text-slate-800">Change Password</h3><p className="text-xs text-slate-400">Set a new password</p></div>
            </div>
            {passwordMsg && <div className={`mb-4 px-3 py-2 rounded-lg text-sm ${passwordMsg.type === "error" ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600"}`}>{passwordMsg.text}</div>}
            <form onSubmit={handleChangePassword} className="space-y-3">
              <div><label className="text-xs font-medium text-slate-500 block mb-1">New Password</label><input type="password" value={passwordForm.new} onChange={(e) => setPasswordForm({ ...passwordForm, new: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              <div><label className="text-xs font-medium text-slate-500 block mb-1">Confirm</label><input type="password" value={passwordForm.confirm} onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })} required className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30" /></div>
              <button type="submit" disabled={passwordLoading} className="w-full py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 mt-2">{passwordLoading ? "Updating..." : "Update Password"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
