"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/app/lib/supabase";
import {
  Loader2,
  Search,
  User,
  MessageSquare,
  Bot,
  Clock,
  MessageCircle,
  Activity,
} from "lucide-react";
import { siteConfig } from "@/app/utils/config";

export const dynamic = "force-dynamic";

export default function ConversationsPage() {
  const [usersMap, setUsersMap] = useState({});
  const [userList, setUserList] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("chat");

  useEffect(() => {
    document.title = `Conversations | ${siteConfig.name}`;
    fetchChats();
  }, []);

  const fetchChats = async () => {
    setLoading(true);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      setLoading(false);
      return;
    }

    const { data: chats, error: chatError } = await supabase
      .from("chat_analytics")
      .select("*")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: true });

    if (chatError) {
      setLoading(false);
      return;
    }

    // Fetch display names from onboarding_leads
    const { data: leads } = await supabase
      .from("onboarding_leads")
      .select("telegram_id, full_name")
      .eq("admin_id", user.id);

    const nameMap = {};
    if (leads) {
      leads.forEach((lead) => {
        if (lead.full_name) nameMap[lead.telegram_id] = lead.full_name;
      });
    }

    const groupedUsers = {};
    chats.forEach((msg) => {
      if (!msg.telegram_id) return;

      if (!groupedUsers[msg.telegram_id]) {
        groupedUsers[msg.telegram_id] = {
          username: nameMap[msg.telegram_id] || `User #${msg.telegram_id}`,
          messages: [],
          lastInteraction: msg.created_at,
        };
      }
      groupedUsers[msg.telegram_id].messages.push(msg);
      if (
        new Date(msg.created_at) >
        new Date(groupedUsers[msg.telegram_id].lastInteraction)
      ) {
        groupedUsers[msg.telegram_id].lastInteraction = msg.created_at;
      }
    });

    setUsersMap(groupedUsers);

    const sortedUsers = Object.keys(groupedUsers)
      .map((id) => ({
        id,
        ...groupedUsers[id],
      }))
      .sort(
        (a, b) => new Date(b.lastInteraction) - new Date(a.lastInteraction),
      );

    setUserList(sortedUsers);
    if (sortedUsers.length > 0) {
      setSelectedUserId(sortedUsers[0].id);
    }
    setLoading(false);
  };

  const filteredUsers = useMemo(() => {
    return userList.filter(
      (u) =>
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.includes(searchQuery),
    );
  }, [userList, searchQuery]);

  const activeChatData = selectedUserId ? usersMap[selectedUserId] : null;

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Compiling synchronized dialog structures...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 h-[calc(100vh-68px)] flex flex-col px-6 lg:px-10 xl:px-12 py-6 sm:py-8">
      {/* Page Title Header block */}
      <div className="mb-6 shrink-0">
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
            <MessageSquare size={22} className="text-primary" />
          </div>
          Live Interaction Logs
        </h1>
        <p className="text-[0.95rem] text-grey-500">
          Real-time auditing view of ongoing trainee queries and corresponding
          RAG engine responses.
        </p>
      </div>

      {/* 
        UNIFIED APP SHELL CONTAINER 
        Instead of floating cards, this is a single cohesive window like Slack or Intercom.
      */}
      <div className="flex-1 flex bg-white border border-grey-100 rounded-[16px] shadow-sm overflow-hidden mb-16 lg:mb-0">
        {/* LEFT COLUMN: USER LIST */}
        <div
          className={`w-full lg:w-80 flex-col border-r border-grey-100 bg-white shrink-0 ${
            activeTab === "users" ? "flex" : "hidden lg:flex"
          }`}
        >
          {/* Search Header */}
          <div className="p-4 border-b border-grey-100">
            <div className="relative">
              <Search
                className="absolute left-3.5 top-3 text-grey-400"
                size={16}
              />
              <input
                type="text"
                placeholder="Search user or identifier..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-grey-50 border border-grey-100 rounded-[10px] outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-[0.92rem] font-medium transition-all"
              />
            </div>
          </div>

          {/* User Session Row Item List */}
          <div className="flex-1 overflow-y-auto">
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-grey-400 text-[0.92rem] font-medium">
                No active session fragments found.
              </div>
            ) : (
              <div className="divide-y divide-grey-100">
                {filteredUsers.map((user) => {
                  const isActive = user.id === selectedUserId;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUserId(user.id);
                        setActiveTab("chat");
                      }}
                      className={`w-full text-left p-4 transition-all flex items-start space-x-3.5 relative ${
                        isActive ? "bg-primary-light/30" : "hover:bg-grey-50"
                      }`}
                    >
                      {/* Active Indicator Line */}
                      {isActive && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                      )}

                      <div
                        className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 transition-colors ${
                          isActive
                            ? "bg-primary text-white shadow-sm"
                            : "bg-grey-100 text-grey-500"
                        }`}
                      >
                        <User size={18} />
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex justify-between items-center mb-1">
                          <span
                            className={`text-[0.95rem] font-display truncate block ${
                              isActive
                                ? "font-bold text-navy"
                                : "font-bold text-grey-700"
                            }`}
                          >
                            @{user.username}
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold tracking-wider text-grey-400 block truncate">
                          ID: {user.id}
                        </span>
                        <div className="flex mt-2">
                          <span className="text-[9px] font-bold text-grey-500 uppercase tracking-widest flex items-center gap-1 bg-white border border-grey-100 px-2 py-0.5 rounded-md">
                            <Activity
                              size={10}
                              className={
                                isActive ? "text-primary" : "text-grey-400"
                              }
                            />
                            {user.messages.length} msgs
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: CHAT VIEW */}
        <div
          className={`flex-1 flex-col bg-grey-50/50 relative ${
            activeTab === "chat" ? "flex" : "hidden lg:flex"
          }`}
        >
          {activeChatData ? (
            <>
              {/* Chat Header */}
              <div className="px-6 py-4 bg-white border-b border-grey-100 flex justify-between items-center z-10 shrink-0">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-11 h-11 bg-grey-50 border border-grey-100 text-primary rounded-[12px] flex items-center justify-center shrink-0">
                    <User size={20} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-[1.1rem] font-bold font-display text-navy truncate">
                      @{activeChatData.username}
                    </h2>
                    <p className="text-[10px] font-mono font-bold tracking-widest text-grey-400 mt-0.5 truncate uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16a34a]"></span>
                      Session: {selectedUserId}
                    </p>
                  </div>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
                {activeChatData.messages.map((msg, index) => (
                  <div key={msg.id || index} className="space-y-4">
                    {/* USER QUERY BUBBLE */}
                    {msg.user_query && (
                      <div className="flex justify-end w-full">
                        <div className="max-w-[85%] sm:max-w-[70%] flex flex-col items-end">
                          <div className="bg-navy-mid text-white px-5 py-3.5 rounded-[16px] rounded-tr-[4px] shadow-sm">
                            <div className="flex items-center gap-1.5 mb-1.5 text-[9px] uppercase font-bold tracking-widest text-grey-400">
                              <User size={10} /> Trainee Prompt
                            </div>
                            <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap font-medium select-text">
                              {msg.user_query}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-grey-400 mt-1.5 mr-1 flex items-center gap-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* BOT RESPONSE BUBBLE */}
                    {msg.bot_response && (
                      <div className="flex justify-start w-full">
                        <div className="max-w-[85%] sm:max-w-[75%] flex flex-col items-start">
                          <div className="bg-white border border-grey-100 text-navy px-5 py-4 rounded-[16px] rounded-tl-[4px] shadow-sm">
                            <div className="flex items-center gap-1.5 mb-2 text-[9px] uppercase font-bold tracking-widest text-primary bg-primary-light w-fit px-2 py-0.5 rounded-md">
                              <Bot size={10} /> RAG Response Mode:{" "}
                              {msg.mode || "TRAINING"}
                            </div>
                            <p className="text-[0.95rem] leading-relaxed whitespace-pre-wrap font-medium select-text text-navy">
                              {msg.bot_response}
                            </p>
                          </div>
                          <span className="text-[10px] font-bold tracking-wider text-grey-400 mt-1.5 ml-1 flex items-center gap-1">
                            {new Date(msg.created_at).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-grey-400 p-8">
              <div className="w-16 h-16 bg-white rounded-[16px] border border-grey-100 shadow-sm flex items-center justify-center mb-4">
                <MessageCircle size={28} className="text-grey-300" />
              </div>
              <p className="text-[0.95rem] font-medium text-center text-grey-500 max-w-xs">
                Select a user from the list to view their live conversation
                stream.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM TAB NAVIGATION - Mobile only */}
      <div className="fixed lg:hidden bottom-0 left-0 right-0 bg-white border-t border-grey-100 flex shadow-[0_-4px_24px_rgba(10,22,40,0.04)] z-50">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 text-[0.92rem] font-bold transition-all border-t-2 ${
            activeTab === "chat"
              ? "text-primary border-t-primary bg-primary-light/20"
              : "text-grey-400 border-t-transparent hover:text-grey-600 bg-white"
          }`}
        >
          <MessageCircle size={18} />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`flex-1 py-4 px-4 flex items-center justify-center gap-2 text-[0.92rem] font-bold transition-all border-t-2 ${
            activeTab === "users"
              ? "text-primary border-t-primary bg-primary-light/20"
              : "text-grey-400 border-t-transparent hover:text-grey-600 bg-white"
          }`}
        >
          <User size={18} />
          <span>Users</span>
        </button>
      </div>
    </div>
  );
}
