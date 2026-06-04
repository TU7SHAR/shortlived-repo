"use client";

import {
  X,
  User,
  ClipboardList,
  Zap,
  MessageSquare,
  Phone,
  Target,
} from "lucide-react";

export default function UserDetailModal({ isOpen, onClose, userData }) {
  if (!isOpen || !userData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="h-[90vh] sm:h-full w-full max-w-2xl bg-white sm:rounded-2xl shadow-2xl animate-in slide-in-from-bottom sm:slide-in-from-right duration-300 overflow-y-auto rounded-t-2xl">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-zinc-200 p-4 sm:p-6 flex justify-between items-center z-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-black tracking-tight">
              User Dossier
            </h2>
            <p className="text-zinc-500 font-mono text-[10px] sm:text-xs mt-0.5">
              ID: {userData.telegram_id}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-zinc-100 rounded-full transition-colors"
          >
            <X size={20} className="sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-8 sm:space-y-10">
          {/* Section 1: Onboarding Data */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-400">
              <User size={16} /> Onboarding Profile
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <DataPoint
                label="Full Name"
                value={userData.onboarding?.full_name}
              />
              <DataPoint
                label="Phone"
                value={userData.onboarding?.phone_number}
                icon={<Phone size={12} />}
              />
              <DataPoint
                label="Current Role"
                value={userData.onboarding?.role}
              />
              <DataPoint
                label="Exp. Level"
                value={userData.onboarding?.experience_level}
              />
            </div>
            <div className="bg-zinc-50 p-4 rounded-xl border border-zinc-100 italic text-zinc-600 text-xs sm:text-sm">
              <span className="font-bold text-black block not-italic mb-1">
                Stated Goal:
              </span>
              "{userData.onboarding?.goal || "No goal captured."}"
            </div>
          </section>

          {/* Section 2: Test & Assessment Results */}
          <section className="space-y-4">
            <h3 className="flex items-center gap-2 text-xs sm:text-sm font-black uppercase tracking-widest text-zinc-400">
              <ClipboardList size={16} /> Assessment History
            </h3>
            {userData.tests?.length > 0 ? (
              userData.tests.map((test, i) => (
                <div
                  key={i}
                  className="border border-zinc-200 rounded-2xl overflow-hidden"
                >
                  <div className="bg-zinc-50 px-3 py-3 sm:px-4 border-b border-zinc-200 flex flex-wrap justify-between items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm">
                      {test.category} Test
                    </span>
                    <span className="bg-black text-white px-2 py-0.5 rounded text-[10px] font-bold">
                      SCORE: {test.score}/{test.total_questions}
                    </span>
                  </div>
                  <div className="p-3 sm:p-4 space-y-4">
                    {/* Render Pretty Q&A */}
                    {test.qa_data &&
                      Object.entries(test.qa_data).map(([q, a], idx) => (
                        <div key={idx} className="space-y-1">
                          <p className="text-[11px] sm:text-xs font-bold text-zinc-500">
                            Q: {q}
                          </p>
                          <p className="text-xs sm:text-sm font-medium text-black bg-zinc-50 p-2 sm:p-3 rounded-lg">
                            A: {a}
                          </p>
                        </div>
                      ))}
                    {test.remarks && (
                      <div className="mt-2 text-[11px] sm:text-xs text-blue-600 bg-blue-50 p-2 sm:p-3 rounded-lg border border-blue-100">
                        <strong>AI Remarks:</strong> {test.remarks}
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <p className="text-zinc-400 text-xs sm:text-sm italic">
                No test data found for this user.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

function DataPoint({ label, value, icon }) {
  return (
    <div className="space-y-1">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight flex items-center gap-1">
        {icon} {label}
      </span>
      <div className="text-xs sm:text-sm font-bold text-black break-words">
        {value || "—"}
      </div>
    </div>
  );
}
