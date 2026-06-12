"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Loader2,
  BrainCircuit,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  LineChart,
  Award,
  ListChecks,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function AnalyticsPage() {
  document.title = `Analytics | ${siteConfig.name}`;
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tracks expanded state for the primary user test card rows
  const [expandedCardId, setExpandedCardId] = useState(null);

  // Tracks expanded indices for individual nested questions inside the active card
  const [expandedQuestions, setExpandedQuestions] = useState({});

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    const { data: tests } = await supabase
      .from("test_results")
      .select("*")
      .eq("admin_id", user.id)
      .order("created_at", { ascending: false });

    if (tests) setResults(tests);
    setLoading(false);
  };

  // Compute dynamic top-level summary metrics from your analytics dataset
  const stats = useMemo(() => {
    const totalExams = results.length;
    let combinedScorePercent = 0;
    let perfectScores = 0;

    results.forEach((r) => {
      const score = r[DB.TESTS.SCORE] || 0;
      const totalQ = r[DB.TESTS.TOTAL_QUESTIONS] || 1;
      combinedScorePercent += (score / totalQ) * 100;
      if (score === totalQ) perfectScores++;
    });

    const averageScore =
      totalExams > 0 ? Math.round(combinedScorePercent / totalExams) : 0;

    return { totalExams, averageScore, perfectScores };
  }, [results]);

  const toggleCardExpansion = (id) => {
    if (expandedCardId === id) {
      setExpandedCardId(null);
      setExpandedQuestions({}); // Clear question dropdown sub-states on minimize
    } else {
      setExpandedCardId(id);
      setExpandedQuestions({}); // Initialize fresh dropdown dictionary mapping context
    }
  };

  const toggleQuestionDropdown = (idx, e) => {
    e.stopPropagation(); // Stops parent container click handler triggers
    setExpandedQuestions((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-96 text-grey-500 text-sm font-medium">
        <Loader2 className="animate-spin text-primary mr-2" size={16} />
        Compiling comprehensive evaluation indices...
      </div>
    );
  }

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
      {/* Page Header */}
      <div>
        <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
            <LineChart size={22} className="text-primary" />
          </div>
          Test Analytics
        </h1>
        <p className="text-[0.95rem] text-grey-500 mt-1">
          Audit team performance, score ratios, and precise scenario response
          criteria.
        </p>
      </div>

      {/* Balanced Summary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-primary-light text-primary rounded-[12px] shrink-0">
            <ListChecks size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Exams Evaluated
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.totalExams}
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-[#F0FDF4] text-[#16a34a] rounded-[12px] shrink-0">
            <Award size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              Average Performance
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.averageScore}%
            </p>
          </div>
        </div>

        <div className="p-5 bg-white rounded-[16px] shadow-sm border border-grey-100 flex items-center space-x-4 transition-shadow hover:shadow-md">
          <div className="p-3.5 bg-purple-50 text-purple-600 rounded-[12px] shrink-0">
            <BrainCircuit size={22} />
          </div>
          <div>
            <p className="text-xs text-grey-500 font-bold uppercase tracking-wider mb-0.5">
              100% Mastery
            </p>
            <p className="text-[1.7rem] font-bold text-navy font-display leading-none">
              {stats.perfectScores}
            </p>
          </div>
        </div>
      </div>

      {/* Exam Result Entry Accordion Stack */}
      <div className="space-y-4 w-full">
        {results.length === 0 ? (
          <div className="bg-white border border-grey-100 rounded-[16px] p-12 text-center text-grey-400 text-sm font-medium shadow-sm">
            No completed exam records found inside database logs.
          </div>
        ) : (
          results.map((result) => {
            const qaData = result[DB.TESTS.QA_DATA] || {};
            const score = result[DB.TESTS.SCORE] || 0;
            const total = result[DB.TESTS.TOTAL_QUESTIONS] || 1;
            const scorePercent = Math.round((score / total) * 100);
            const isCardExpanded = expandedCardId === result[DB.TESTS.ID];

            return (
              <div
                key={result[DB.TESTS.ID]}
                className={`bg-white border rounded-[16px] overflow-hidden transition-all duration-200 ${
                  isCardExpanded
                    ? "border-primary/30 shadow-[0_8px_30px_rgba(29,78,216,0.08)] ring-1 ring-primary/10"
                    : "border-grey-100 shadow-sm hover:border-grey-300 hover:shadow-md"
                }`}
              >
                {/* PRIMARY ROW CARD HEADER BLOCK */}
                <div
                  onClick={() => toggleCardExpansion(result[DB.TESTS.ID])}
                  className="p-5 sm:p-6 cursor-pointer flex items-center justify-between hover:bg-grey-50/50 select-none transition-colors"
                >
                  <div className="flex items-center space-x-4 min-w-0">
                    <div
                      className={`p-3.5 rounded-[12px] border flex-shrink-0 transition-colors ${
                        isCardExpanded
                          ? "bg-primary border-primary text-white shadow-sm"
                          : "bg-grey-50 border-grey-100 text-grey-500"
                      }`}
                    >
                      <BrainCircuit size={20} />
                    </div>
                    <div className="min-w-0 flex flex-col">
                      <span className="font-bold font-display text-navy text-[1.1rem] truncate">
                        @{result.username || "anonymous_trainee"}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-grey-400 font-medium mt-1">
                        <span className="font-mono bg-grey-50 border border-grey-100 px-2 py-0.5 rounded-md text-[10px] text-grey-500 font-bold uppercase tracking-wider">
                          ID: {result[DB.TESTS.TELEGRAM_ID]}
                        </span>
                        <span className="text-grey-300">•</span>
                        <span>
                          {new Date(
                            result[DB.TESTS.CREATED_AT],
                          ).toLocaleDateString(undefined, {
                            dateStyle: "medium",
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6 flex-shrink-0 ml-4">
                    <div className="text-right">
                      <span
                        className={`text-[1.4rem] font-display font-black block leading-none ${
                          scorePercent >= 80
                            ? "text-[#16a34a]"
                            : scorePercent >= 50
                              ? "text-amber-500"
                              : "text-red-500"
                        }`}
                      >
                        {scorePercent}%
                      </span>
                      <span className="text-[10px] font-bold text-grey-400 uppercase tracking-widest block mt-1">
                        {score}/{total} Correct
                      </span>
                    </div>
                    <div
                      className={`transition-transform duration-200 ${isCardExpanded ? "text-primary" : "text-grey-400"}`}
                    >
                      {isCardExpanded ? (
                        <ChevronUp size={20} />
                      ) : (
                        <ChevronDown size={20} />
                      )}
                    </div>
                  </div>
                </div>

                {/* PRIMARY EXAM CARD EXPANDED SUB-PANE */}
                {isCardExpanded && (
                  <div className="bg-grey-50/50 border-t border-grey-100 p-5 sm:p-6 space-y-3">
                    <div className="text-[0.75rem] uppercase tracking-widest font-bold text-grey-400 mb-3 ml-1">
                      Individual Answer Review Breakdowns
                    </div>

                    {qaData.results?.map((item, idx) => {
                      const isQuestionOpen = !!expandedQuestions[idx];
                      return (
                        <div
                          key={idx}
                          className={`bg-white border rounded-xl overflow-hidden transition-all duration-200 ${
                            isQuestionOpen
                              ? "border-grey-300 shadow-sm"
                              : "border-grey-100 shadow-sm hover:border-grey-300"
                          }`}
                        >
                          {/* NESTED ACCORDION DROPDOWN BUTTON TRIGGER */}
                          <div
                            onClick={(e) => toggleQuestionDropdown(idx, e)}
                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-grey-50 transition-colors select-none"
                          >
                            <div className="flex items-start space-x-3.5 min-w-0 flex-1 pr-4">
                              <div className="mt-0.5 shrink-0">
                                {item.is_correct ? (
                                  <CheckCircle2
                                    size={18}
                                    className="text-[#16a34a]"
                                  />
                                ) : (
                                  <XCircle size={18} className="text-red-500" />
                                )}
                              </div>
                              <span className="font-bold font-display text-navy text-[0.95rem] line-clamp-1 mt-0.5">
                                Q{idx + 1}: {item.question}
                              </span>
                            </div>

                            <div className="flex items-center space-x-4 flex-shrink-0">
                              <span
                                className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md ${
                                  item.is_correct
                                    ? "bg-[#F0FDF4] text-[#16a34a]"
                                    : "bg-red-50 text-red-600"
                                }`}
                              >
                                {item.is_correct ? "Pass" : "Fail"}
                              </span>
                              <div className="text-grey-400">
                                {isQuestionOpen ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* FULL QUESTION DETAILS PANE EXPANSION */}
                          {isQuestionOpen && (
                            <div className="px-5 pb-5 pt-3 border-t border-grey-100 bg-white space-y-4">
                              <div className="text-navy font-medium text-[0.92rem] leading-relaxed max-w-4xl bg-grey-50 p-4 rounded-[12px] border border-grey-100">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-grey-400 block mb-1.5">
                                  Full Question Prompt
                                </span>
                                {item.question}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-grey-50 rounded-[12px] border border-grey-100">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-grey-500 mb-2 flex items-center gap-1.5">
                                    <AlertCircle size={12} /> Trainee Response
                                    Log
                                  </div>
                                  <p className="text-[0.92rem] text-navy font-medium whitespace-pre-wrap leading-relaxed select-text">
                                    {item.user_answer ||
                                      "— Statement block returned empty"}
                                  </p>
                                </div>
                                <div className="p-4 bg-white rounded-[12px] border border-primary/20 shadow-sm ring-1 ring-primary/5">
                                  <div className="text-[10px] font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1.5">
                                    <CheckCircle2 size={12} /> Correct Answer
                                  </div>
                                  <p className="text-[0.92rem] text-navy font-bold whitespace-pre-wrap leading-relaxed select-text">
                                    {item.correct_answer ||
                                      "— Benchmark criteria unmapped"}
                                  </p>
                                </div>
                              </div>

                              {item.explanation && (
                                <div className="p-4 bg-primary-light/50 rounded-[12px] border border-primary/10 text-[0.92rem] text-navy">
                                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary block mb-1.5">
                                    AI Analysis on User Response
                                  </span>
                                  <p className="italic leading-relaxed font-medium select-text">
                                    {item.explanation}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
