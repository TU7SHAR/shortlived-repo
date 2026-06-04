// frontend/app/(auth)/login/page.jsx
"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "../../lib/supabase";
import { ensureAdminToken } from "../../lib/db";
import Link from "next/link";
import { trySuperAdminLogin } from "../../actions/adminAuth";
import { Shield } from "lucide-react"; // Imported branding icon
import { siteConfig } from "../../utils/config"; // Imported config for brand name
import SalesJiLogoShader from "@/app/components/landing/SalesjiShader";

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
        window.location.href = "/dashboard"; // Changed to redirect to dashboard
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useGSAP(
    () => {
      gsap.fromTo(
        ".auth-box",
        { opacity: 0, scale: 0.95, y: 20 },
        { opacity: 1, scale: 1, y: 0, duration: 0.6, ease: "power3.out" },
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
    } else {
      console.log("Email login successful, waiting for auth state change...");
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
      className="min-h-screen bg-zinc-50 flex items-center justify-center p-4"
    >
      <div className="auth-box max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {/* Added Branding Logo & Name */}
        <div className="flex flex-col items-center justify-center mb-8">
          <Link
            href="/"
            className="flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shrink-0">
              <Shield size={22} fill="currentColor" />
            </div>
            <span className="text-2xl font-black text-black tracking-tighter">
              {siteConfig?.name || "SalesJi"}
            </span>
          </Link>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-black tracking-tight">
              Welcome Back
            </h1>
            <p className="text-zinc-500 mt-2">Log in to your account</p>
          </div>
        </div>

        {message && (
          <div
            className={`p-3 rounded-lg mb-6 text-sm border ${message.type === "error" ? "bg-zinc-50 border-zinc-300 text-black" : "bg-black text-white"}`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email Address
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all"
              placeholder="admin@company.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black focus:outline-none"
              >
                {/* SVG for visibility toggle */}
                {showPassword ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"
                    />
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="w-5 h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                )}
              </button>
            </div>
            <div className="flex items-center justify-between mb-1 mt-1">
              <label className="block text-sm font-medium text-black"></label>
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-500 hover:text-black hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg transition-colors mt-2 flex items-center justify-center"
          >
            {loading ? "Processing..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center justify-center mb-6">
          <div className="border-t border-zinc-200 w-full"></div>
          <span className="bg-white px-3 text-sm text-zinc-400 absolute">
            OR
          </span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full flex items-center justify-center gap-2 bg-white border border-zinc-300 hover:bg-zinc-50 text-black font-medium py-2.5 rounded-lg transition-colors"
        >
          Continue with Google
        </button>

        <div className="text-center mt-6">
          <p className="text-sm text-zinc-600">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="text-black hover:underline font-semibold"
            >
              Sign up here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
