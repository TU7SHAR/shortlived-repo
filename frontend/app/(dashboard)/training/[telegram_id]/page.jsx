"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import { DB } from "@/app/lib/schema_map";
import {
  ArrowLeft,
  Bot,
  User,
  BookOpen,
  MessageSquare,
  Clock,
  Loader2,
} from "lucide-react";
import { siteConfig } from "../../../utils/config";

export default function TrainingDetail() {
  const { telegram_id } = useParams();
  const router = useRouter();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = `Training Detail || ${siteConfig.name}`;
    fetchMessages();
  }, [telegram_id]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from(DB.CHAT.TABLE)
        .select("*")
        .eq(DB.CHAT.TELEGRAM_ID, telegram_id)
        .eq("mode", "training")
        .order(DB.CHAT.CREATED_AT, { ascending: true });

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error("Error retrieving historical transcript streams:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper to split response into Main Text, Coach Note, and Sources
  const renderBotResponse = (text) => {
    if (!text) return null;
    const parts = text.split(/\n\n/);
    return parts.map((part, i) => {
      const trimmed = part.trim();
      if (trimmed.toLowerCase().startsWith("source:")) {
        return (
          <div
            key={i}
            className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center gap-1.5 text-[10px] text-zinc-400 font-semibold uppercase tracking-wider"
          >
            <BookOpen size={12} className="text-zinc-500" /> {trimmed}
          </div>
        );
      }
      if (trimmed.toLowerCase().includes("coach note:")) {
        return (
          <div
            key={i}
            className="mt-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs font-medium italic text-zinc-300 shadow-inner flex items-start gap-2"
          >
            <MessageSquare
              size={13}
              className="text-indigo-400 mt-0.5 shrink-0"
            />
            <span>{trimmed}</span>
          </div>
        );
      }
      return (
        <p
          key={i}
          className="text-sm leading-relaxed font-medium mb-2 last:mb-0 text-zinc-100"
        >
          {trimmed}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96 text-zinc-500 text-sm font-medium">
        <Loader2 className="animate-spin text-zinc-400 mr-2" size={16} />
        Compiling dialogue log arrays...
      </div>
    );
  }

  return (
    // FIX: Replaced tight max-width bounds with 100% layout fluid dashboard width constraints
    <div className="p-6 md:p-8 w-full space-y-6">
      {/* Dynamic Header Interaction Row */}
      <div className="flex justify-between items-center mb-2">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 transition-colors"
        >
          <ArrowLeft size={14} /> <span>Back to Modules</span>
        </button>
      </div>

      {/* Main Conversation Container Panel */}
      <div className="bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden flex flex-col">
        {/* Transcript Panel Context Header */}
        <div className="px-6 py-4 bg-white border-b border-zinc-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-zinc-50 border border-zinc-100 text-zinc-800 rounded-xl">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-900">
                Training Chat Transcript
              </h2>
              <p className="text-xxs font-mono text-zinc-400 mt-0.5">
                Trainee Telegram Identifier Key: {telegram_id}
              </p>
            </div>
          </div>
        </div>

        {/* Core Transcript Dialogue Stream Segment */}
        <div className="flex-1 p-6 space-y-6 bg-zinc-50/20">
          {messages.length === 0 ? (
            <div className="py-16 text-center text-zinc-400 text-xs font-medium">
              No historical interaction metrics discovered under this lesson
              mode segment.
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg[DB.CHAT.ID]} className="space-y-4">
                {/* TRAINEE PROMPT BUBBLE (Left Align) */}
                <div className="flex justify-start w-full">
                  <div className="max-w-[70%] flex flex-col items-start">
                    <div className="bg-white border border-zinc-200 text-zinc-800 px-4 py-3 rounded-2xl rounded-tl-sm shadow-2xs">
                      <div className="flex items-center gap-1.5 mb-1 text-[10px] uppercase font-bold tracking-wider text-zinc-400">
                        <User size={12} /> @
                        {msg[DB.CHAT.USERNAME] || "trainee_user"}
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium select-text text-zinc-800">
                        {msg[DB.CHAT.USER_QUERY]}
                      </p>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 mt-1 ml-1 flex items-center gap-1">
                      <Clock size={10} />{" "}
                      {new Date(msg[DB.CHAT.CREATED_AT]).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                </div>

                {/* BOT / COACH NOTE RESPONSE BUBBLE (Right Align) */}
                <div className="flex justify-end w-full">
                  <div className="max-w-[70%] flex flex-col items-end">
                    <div className="bg-zinc-900 text-white px-4 py-3 rounded-2xl rounded-tr-sm shadow-sm border border-zinc-800">
                      <div className="flex items-center gap-1.5 mb-1.5 text-[10px] uppercase font-bold tracking-wider text-indigo-400 opacity-90">
                        <Bot size={12} /> Salesji AI Coach
                      </div>
                      <div className="select-text">
                        {renderBotResponse(msg[DB.CHAT.BOT_RESPONSE])}
                      </div>
                    </div>
                    <span className="text-[10px] font-medium text-zinc-400 mt-1 mr-1 flex items-center gap-1">
                      <Clock size={10} />{" "}
                      {new Date(msg[DB.CHAT.CREATED_AT]).toLocaleTimeString(
                        [],
                        { hour: "2-digit", minute: "2-digit" },
                      )}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
