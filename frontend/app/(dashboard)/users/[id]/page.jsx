"use client";

import { use, useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import {
  Loader2,
  ArrowLeft,
  User,
  Phone,
  Briefcase,
  Target,
  Calendar,
  Shield,
  BrainCircuit,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { DB } from "@/app/lib/schema_map";
import { siteConfig } from "../../../utils/config";

export default function UserProfilePage({ params }) {
  // Unwrap params for Next.js 15 compatibility
  const resolvedParams = use(params);
  const telegramId = resolvedParams.id;

  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState({
    auth: null,
    onboarding: null,
    token: null,
    tests: [],
  });

  useEffect(() => {
    document.title = `User Profile | ${siteConfig.name}`;
    fetchUserDetails();
  }, [telegramId]);

  const fetchUserDetails = async () => {
    setLoading(true);

    try {
      // 0. CRITICAL FIX: Get the currently logged-in Admin
      const {
        data: { user: adminUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !adminUser) {
        console.error("Auth Error: Admin not logged in.");
        setLoading(false);
        return;
      }

      const adminId = adminUser.id;

      // 1. Fetch base authorization data
      const { data: authData, error: err1 } = await supabase
        .from(DB.USERS.TABLE)
        .select("*")
        .eq(DB.USERS.ID, telegramId)
        .maybeSingle();
      if (err1) console.error("Auth Data Error:", err1);

      // 2. Fetch role from invite tokens
      const { data: tokenData, error: err2 } = await supabase
        .from(DB.TOKENS.TABLE)
        .select(DB.TOKENS.TOKEN_TYPE)
        .eq(DB.TOKENS.USED_BY_ID, telegramId)
        .maybeSingle();
      if (err2) console.error("Token Data Error:", err2);

      // 3. Fetch full onboarding profile STRICTLY for this Admin
      const { data: onboardingData, error: err3 } = await supabase
        .from(DB.ONBOARDING.TABLE)
        .select("*")
        .eq(DB.ONBOARDING.TELEGRAM_ID, telegramId)
        .eq("admin_id", adminId) // <--- FIX: Prevents the .maybeSingle() crash
        .maybeSingle();
      if (err3) console.error("Onboarding Data Error:", err3.message);

      // 4. Fetch test history STRICTLY for this Admin
      const { data: testData, error: err4 } = await supabase
        .from(DB.TESTS.TABLE)
        .select("*")
        .eq(DB.TESTS.TELEGRAM_ID, telegramId)
        .eq("admin_id", adminId) // <--- FIX: Prevents data leaks across admins
        .order(DB.TESTS.CREATED_AT, { ascending: false });
      if (err4) console.error("Test Data Error:", err4);

      setUserData({
        auth: authData,
        token: tokenData,
        onboarding: onboardingData,
        tests: testData || [],
      });
    } catch (error) {
      console.error("Error fetching user details:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-zinc-300" size={40} />
      </div>
    );
  }

  const name = userData.onboarding?.[DB.ONBOARDING.FULL_NAME] || "Unknown User";
  const roleType = userData.token?.[DB.TOKENS.TOKEN_TYPE] || "Normal";

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {/* Navigation Header */}
      <div className="mb-8">
        <Link
          href="/analytics"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-black transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to Analytics
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 text-white p-4 rounded-2xl shadow-sm">
            <User size={32} />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-black tracking-tight">
              {name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className="bg-zinc-100 text-zinc-600 px-2.5 py-0.5 rounded-md text-xs font-bold font-mono">
                ID: {telegramId}
              </span>
              <span className="bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide">
                Role: {roleType}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Onboarding Profile Card */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-200 shadow-sm p-6">
          <h2 className="text-lg font-bold text-black mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
            <Briefcase className="text-zinc-400" size={20} />
            Onboarding Profile
          </h2>

          {userData.onboarding ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-8">
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <User size={14} /> Full Name
                </p>
                <p className="text-zinc-800 font-medium">
                  {userData.onboarding[DB.ONBOARDING.FULL_NAME] || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Phone size={14} /> Phone Number
                </p>
                <p className="text-zinc-800 font-medium">
                  {userData.onboarding[DB.ONBOARDING.PHONE_NUMBER] || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Briefcase size={14} /> Current Role
                </p>
                <p className="text-zinc-800 font-medium">
                  {userData.onboarding[DB.ONBOARDING.ROLE] || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Activity size={14} /> Experience
                </p>
                <p className="text-zinc-800 font-medium">
                  {userData.onboarding[DB.ONBOARDING.EXPERIENCE_LEVEL] || "N/A"}
                </p>
              </div>
              <div className="sm:col-span-2 bg-zinc-50 p-4 rounded-xl border border-zinc-100">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Target size={14} /> Passion & Drive
                </p>
                <p className="text-zinc-700 italic">
                  "
                  {userData.onboarding[DB.ONBOARDING.PASSION] ||
                    userData.onboarding[DB.ONBOARDING.GOAL] ||
                    "No details provided."}
                  "
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center py-10">
              <p className="text-zinc-400 font-medium">
                This user has not completed the onboarding flow.
              </p>
            </div>
          )}
        </div>

        {/* Account Details Card */}
        <div className="bg-white rounded-2xl border border-zinc-200 shadow-sm p-6 h-fit">
          <h2 className="text-lg font-bold text-black mb-6 flex items-center gap-2 border-b border-zinc-100 pb-4">
            <Shield className="text-zinc-400" size={20} />
            Account Status
          </h2>
          <div className="flex flex-col gap-5">
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                <Calendar size={14} /> Joined Date
              </p>
              <p className="text-zinc-800 font-medium">
                {userData.auth?.[DB.USERS.CREATED_AT]
                  ? new Date(
                      userData.auth[DB.USERS.CREATED_AT],
                    ).toLocaleDateString()
                  : "Unknown"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Invite Token Used
              </p>
              <p className="text-zinc-600 font-mono text-sm bg-zinc-100 px-2 py-1 rounded w-fit">
                {userData.auth?.[DB.USERS.TOKEN_USED] || "None"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Total Tests Taken
              </p>
              <p className="text-3xl font-black text-black">
                {userData.tests.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
