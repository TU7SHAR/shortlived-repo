import { supabaseAdmin } from "../../../lib/supabaseAdmin";
import {
  ArrowLeft,
  Bot,
  MessageCircle,
  ClipboardCheck,
  UserX,
  Calendar,
} from "lucide-react";
import Link from "next/link";

export default async function DetailedScorePage({ params }) {
  const { testId } = await params;

  const { data: test } = await supabaseAdmin
    .from("test_results")
    .select("*")
    .eq("id", testId)
    .single();

  if (!test)
    return <div className="p-20 text-center font-black">TEST NOT FOUND</div>;

  const { data: onboarding } = await supabaseAdmin
    .from("onboarding_leads")
    .select("*")
    .eq("telegram_id", test.telegram_id)
    .single();

  // Handle potential comma-separated string or object
  const rawData =
    typeof test.qa_data === "string" ? JSON.parse(test.qa_data) : test.qa_data;
  const questions = rawData.questions || [];
  const answers = rawData.user_answers || [];

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8 bg-zinc-50 min-h-screen">
      {/* 1. TOP NAVIGATION */}
      <Link
        href="/admin/scores"
        className="group flex items-center gap-2 text-zinc-400 hover:text-black transition-colors text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        Back to Ledger
      </Link>

      {/* 2. HEADER GRID: ASSESSMENT & IDENTITY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border-2 border-zinc-100 p-8 rounded-[2rem] shadow-sm flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                {test.category} Assessment
              </span>
            </div>
            <h1 className="text-4xl font-black text-black tracking-tighter uppercase leading-none">
              Technical Report
            </h1>
            <div className="flex items-center gap-4 mt-4 text-zinc-400 font-bold text-[10px] uppercase tracking-widest">
              <span className="flex items-center gap-1">
                <ClipboardCheck size={12} /> REF: {test.id}
              </span>
              <span className="flex items-center gap-1">
                <Calendar size={12} />{" "}
                {new Date(test.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-black text-black leading-none tabular-nums">
              {test.score}
              <span className="text-zinc-200">/{test.total_questions}</span>
            </div>
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mt-2">
              Final Result
            </p>
          </div>
        </div>

        <div className="bg-zinc-100 p-8 rounded-[2rem] border border-zinc-200 flex flex-col justify-center">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4">
            User Identity
          </h3>
          {onboarding ? (
            <div className="space-y-1">
              <p className="font-black text-black text-2xl leading-tight">
                {onboarding.full_name}
              </p>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-tight">
                {onboarding.role} • {onboarding.experience_level}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-xl font-bold text-zinc-400 italic leading-tight">
                Nothing here. Ask user to fill it.
              </p>
              <p className="text-[10px] font-black text-zinc-300 uppercase">
                ID: {test.telegram_id}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 3. MAIN CONTENT: Q&A TRACE & SIDEBAR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Q&A CARDS (Takes up 2/3 of space) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 px-4 mb-4">
            <MessageCircle size={16} className="text-zinc-400" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Response Breakdown
            </h2>
          </div>

          {questions.map((q, idx) => (
            <div
              key={idx}
              className="bg-white border border-zinc-200 p-8 rounded-[1.5rem] shadow-sm hover:border-black transition-all group"
            >
              <div className="flex gap-6">
                <span className="text-4xl font-black text-zinc-100 group-hover:text-black transition-colors italic tabular-nums leading-none">
                  {idx + 1 < 10 ? `0${idx + 1}` : idx + 1}
                </span>
                <div className="space-y-6 flex-1">
                  <p className="font-bold text-zinc-900 text-lg leading-snug">
                    {q}
                  </p>
                  <div className="bg-zinc-50 border-l-4 border-black p-5 rounded-r-2xl text-sm font-medium text-zinc-600 leading-relaxed shadow-inner">
                    <span className="text-[10px] font-black text-zinc-300 uppercase block mb-2 tracking-widest">
                      User Answer:
                    </span>
                    {answers[idx] || "No response recorded."}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* STICKY SIDEBAR: AI REMARKS */}
        <div className="lg:sticky lg:top-8 space-y-6">
          <div className="bg-blue-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <Bot size={20} className="text-blue-200" />
                <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-100">
                  AI Evaluator Remarks
                </h3>
              </div>
              <p className="text-base font-bold leading-relaxed italic opacity-95">
                "
                {test.remarks ||
                  "No automated remarks were generated for this session."}
                "
              </p>
            </div>
            {/* Background Robot Icon Decor */}
            <div className="absolute -bottom-8 -right-8 text-white/10 rotate-12 group-hover:rotate-0 transition-transform duration-500">
              <Bot size={160} />
            </div>
          </div>

          <div className="bg-white border border-zinc-200 p-6 rounded-3xl text-center">
            <p className="text-[10px] font-black text-zinc-300 uppercase tracking-widest mb-2">
              Internal Metadata
            </p>
            <p className="font-mono text-[10px] text-zinc-500">
              Assessment Version 1.4.2-PRO
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
