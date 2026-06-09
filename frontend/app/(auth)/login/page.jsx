// frontend/app/(auth)/login/page.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "../../lib/supabase";
import { ensureAdminToken } from "../../lib/db";
import Link from "next/link";
import Image from "next/image";
import { trySuperAdminLogin } from "../../actions/adminAuth";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { siteConfig } from "../../utils/config";

export default function Login() {
  const container = useRef(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        setLoading(true);
        await ensureAdminToken(session.user.id);
        document.cookie =
          "sb-access-auth-token=true; path=/; max-age=604800; SameSite=Lax";
        window.location.href = "/dashboard";
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        ".auth-card",
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.2 },
      );
    },
    { scope: container },
  );

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const adminCheck = await trySuperAdminLogin(email, password);

    if (adminCheck.isAdmin) {
      window.location.href = "/admin";
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });
    if (error) setMessage({ type: "error", text: error.message });
  };

  return (
    <div
      ref={container}
      className="min-h-screen relative flex items-center justify-center lg:justify-end lg:pr-[12%] p-6 font-sans"
    >
      {/* ── Background Image ── */}
      {/* Ensure the src points to the full background image (the laptop + desk scene).
        This fills the entire screen behind the white card.
      */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth/image.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Optional: Adds a very subtle tint to ensure the card pops */}
        <div className="absolute inset-0 bg-slate-900/10 mix-blend-multiply" />
      </div>

      {/* ── Foreground Card ── */}
      <div className="auth-card relative z-10 w-full max-w-[460px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] p-8 sm:p-10 border border-slate-100">
        {/* Header & Logo (Centered) */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link href="/" className="flex items-center gap-2.5 mb-6 group">
            <div className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center shadow-md">
              <Shield size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold tracking-wide text-slate-900 uppercase">
              {siteConfig?.name || "Salesji"}
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500">Log in to your account</p>
        </div>

        {/* Status Message */}
        {message && (
          <div
            className={`p-3.5 rounded-xl mb-6 text-sm border text-center ${
              message.type === "error"
                ? "border-red-200 bg-red-50 text-red-600"
                : "border-green-200 bg-green-50 text-green-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleEmailLogin} className="space-y-5">
          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail size={16} className="text-slate-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@company.com"
                required
                className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={16} className="text-slate-400" />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••"
                required
                className="w-full pl-11 pr-11 py-3 rounded-xl text-sm border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <div className="flex justify-end mt-2">
              <Link
                href="/forgot-password"
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-7">
          <div className="w-full h-px bg-slate-200" />
          <span className="absolute px-3 text-xs font-medium text-slate-400 bg-white">
            OR
          </span>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-slate-200 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none transition-colors"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </button>

        {/* Sign up link */}
        <p className="text-center text-sm text-slate-500 mt-8">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            Sign up here
          </Link>
        </p>
      </div>
    </div>
  );
}
