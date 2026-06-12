"use client";
import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Users,
  BookOpenCheck,
  BookOpen,
  UserMinus,
  MessageSquare,
  Activity,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { supabase } from "@/app/lib/supabase";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../utils/config";

export default function TrainingDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch data from Supabase using schema map variables
  useEffect(() => {
    document.title = `Training Dashboard | ${siteConfig.name}`;
    async function fetchTrainingAndAnalytics() {
      try {
        // 0. Get the active admin
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Users (Scoped to this admin)
        const { data: userData, error: userError } = await supabase
          .from(DB.ONBOARDING.TABLE)
          .select(
            `${DB.ONBOARDING.ID}, ${DB.ONBOARDING.TELEGRAM_ID}, ${DB.ONBOARDING.FULL_NAME}, ${DB.ONBOARDING.ROLE}, ${DB.ONBOARDING.TRAINING_STATUS}`,
          )
          .eq("admin_id", user.id) // <-- Added filter
          .order(DB.ONBOARDING.CREATED_AT, { ascending: false });

        if (userError) {
          console.error("Error fetching user data:", userError);
          return;
        }

        // 2. Fetch Interaction counts group by telegram_id (Scoped to this admin)
        const { data: analyticsData, error: analyticsError } = await supabase
          .from("chat_analytics")
          .select("telegram_id")
          .eq("admin_id", user.id); // <-- Added filter

        // Create a mapping dictionary for individual interaction counts
        const interactionCounts = {};

        if (!analyticsError && analyticsData) {
          analyticsData.forEach((row) => {
            if (row.telegram_id) {
              interactionCounts[row.telegram_id] =
                (interactionCounts[row.telegram_id] || 0) + 1;
            }
          });
        }

        // Combine the user records with their specific interaction counts
        const combinedUsers = (userData || []).map((userRecord) => ({
          ...userRecord,
          interactions:
            interactionCounts[userRecord[DB.ONBOARDING.TELEGRAM_ID]] || 0,
        }));

        setUsers(combinedUsers);
      } catch (err) {
        console.error("Unexpected error:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchTrainingAndAnalytics();
  }, []);

  // Calculate statistics for the cards dynamically to prevent discrepancies
  const stats = useMemo(() => {
    const total = users.length;
    const completed = users.filter(
      (u) => u[DB.ONBOARDING.TRAINING_STATUS] === "completed",
    ).length;
    const partial = users.filter(
      (u) => u[DB.ONBOARDING.TRAINING_STATUS] === "partial",
    ).length;
    const notStarted = total - completed - partial;

    // Sum up interactions strictly from our rendered users
    const interactionsSum = users.reduce(
      (sum, u) => sum + (u.interactions || 0),
      0,
    );

    return { total, completed, partial, notStarted, interactionsSum };
  }, [users]);

  // Helper function for status badges
  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <span className="px-3 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full">
            Completed
          </span>
        );
      case "partial":
        return (
          <span className="px-3 py-1 text-xs font-medium text-yellow-700 bg-yellow-100 rounded-full">
            Partial
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
            Not Started
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex justify-center items-center h-64 text-zinc-500 text-sm font-medium">
        <Loader2 className="animate-spin text-zinc-400 mr-2" size={16} />
        Compiling dashboard indices...
      </div>
    );
  }

  return (
    // FIX: Converted container element wrapper to complete layout fluid grid symmetry bounds
    <div className="p-6 md:p-8 w-full space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">
          Training Modules Overview
        </h1>
        <p className="text-sm text-zinc-500 mt-0.5 py-3">
          Monitor interactive lesson milestones and trainee objection handling
          cycles.
        </p>
      </div>

      {/* Summary Cards Grid Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Users size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Total Users
            </p>
            <p className="text-xl font-bold text-zinc-900">{stats.total}</p>
            <p className="text-xs text-zinc-400 mt-0.5 flex items-center gap-1">
              <Activity size={12} className="text-blue-500" />{" "}
              {stats.interactionsSum} Interactions
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-green-50 text-green-600 rounded-xl">
            <BookOpenCheck size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Trained
            </p>
            <p className="text-xl font-bold text-zinc-900">
              {stats.completed}{" "}
              <span className="text-xs text-zinc-400 font-normal">
                / {stats.total}
              </span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <BookOpen size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Partial Training
            </p>
            <p className="text-xl font-bold text-zinc-900">
              {stats.partial}{" "}
              <span className="text-xs text-zinc-400 font-normal">
                / {stats.total}
              </span>
            </p>
          </div>
        </div>

        <div className="p-4 bg-white rounded-xl shadow-sm border border-zinc-100 flex items-center space-x-4">
          <div className="p-3 bg-zinc-50 border border-zinc-100 text-zinc-500 rounded-xl">
            <UserMinus size={20} />
          </div>
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wider">
              Not Started
            </p>
            <p className="text-xl font-bold text-zinc-900">
              {stats.notStarted}{" "}
              <span className="text-xs text-zinc-400 font-normal">
                / {stats.total}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Tight, Clean Dataset Table */}
      <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-auto">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-xs uppercase tracking-wider text-zinc-500 font-semibold">
                <th className="px-6 py-3.5 w-1/4">User</th>
                <th className="px-6 py-3.5 w-1/5">Role</th>
                <th className="px-6 py-3.5 w-1/5">Training Status</th>
                <th className="px-6 py-3.5 w-1/6 text-center">Interactions</th>
                <th className="px-6 py-3.5 text-right w-1/6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {users.map((user) => (
                <tr
                  key={user[DB.ONBOARDING.ID]}
                  className="hover:bg-zinc-50/50 transition-colors cursor-pointer group"
                  onClick={() =>
                    router.push(`/training/${user[DB.ONBOARDING.TELEGRAM_ID]}`)
                  }
                >
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-semibold text-zinc-900 group-hover:text-indigo-600 transition-colors text-sm">
                        {user[DB.ONBOARDING.FULL_NAME] || "Unknown User"}
                      </span>
                      <span className="text-xs text-zinc-400 font-mono mt-0.5">
                        ID: {user[DB.ONBOARDING.TELEGRAM_ID]}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    <span
                      className={`capitalize text-xs font-medium px-2 py-0.5 rounded ${user[DB.ONBOARDING.ROLE] === "admin" ? "bg-indigo-50 text-indigo-700" : "bg-zinc-50 text-zinc-600"}`}
                    >
                      {user[DB.ONBOARDING.ROLE] || "User"}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap">
                    {getStatusBadge(user[DB.ONBOARDING.TRAINING_STATUS])}
                  </td>
                  <td className="px-6 py-3.5 whitespace-nowrap text-center text-sm font-semibold text-zinc-700">
                    <div className="flex items-center justify-center gap-1.5 text-zinc-600">
                      <MessageCircle
                        size={14}
                        className="text-zinc-400 group-hover:text-indigo-500 transition-colors"
                      />
                      <span>{user.interactions}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-right whitespace-nowrap">
                    <button
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-indigo-600 bg-indigo-50 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/training/${user[DB.ONBOARDING.TELEGRAM_ID]}`,
                        );
                      }}
                    >
                      <MessageSquare size={13} />
                      <span>View Chat</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
