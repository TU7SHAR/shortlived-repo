// frontend/app/(auth)/forgot-password/page.jsx
"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { Shield, Mail, Send } from "lucide-react";
import { siteConfig } from "../../utils/config";

export default function ForgotPassword() {
  const container = useRef(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

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

  const handleResetRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      setIsSuccess(true);
      setLoading(false);
    }
  };

  return (
    <div
      ref={container}
      className="min-h-screen relative flex items-center justify-center lg:justify-end lg:pr-[12%] p-6 font-sans"
    >
      {/* ── Background Image ── */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/auth/image.png"
          alt="Background"
          fill
          className="object-cover object-center"
          priority
        />
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

          {!isSuccess && (
            <div className="text-center">
              <h1 className="text-3xl font-bold text-slate-900 mb-2">
                Reset Password
              </h1>
              <p className="text-sm text-slate-500">
                Enter your email and we'll send you a reset link.
              </p>
            </div>
          )}
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="text-center pb-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Send size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Check your email
            </h2>
            <p className="text-sm text-slate-500 mb-8 leading-relaxed">
              We sent a password reset link to <br />
              <span className="font-semibold text-slate-900">{email}</span>.
            </p>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors shadow-sm"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            {/* Error Message */}
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
            <form onSubmit={handleResetRequest} className="space-y-5">
              {/* Email Input */}
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
                    placeholder="user@example.com"
                    required
                    className="w-full pl-11 pr-4 py-3 rounded-xl text-sm border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6 shadow-sm"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>

            {/* Back to Login Link */}
            <div className="text-center mt-8">
              <Link
                href="/login"
                className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <span>&larr;</span> Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
