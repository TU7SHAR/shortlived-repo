// frontend/app/(auth)/update-password/page.jsx
"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Shield, Lock, Eye, EyeOff, CheckCircle } from "lucide-react";
import { siteConfig } from "../../utils/config";

export default function UpdatePassword() {
  const container = useRef(null);
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setMessage(null);

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "Passwords do not match." });
      return;
    }

    if (password.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters.",
      });
      return;
    }

    setLoading(true);

    const { data, error } = await supabase.auth.updateUser({
      password: password,
    });

    if (error) {
      setMessage({ type: "error", text: error.message });
      setLoading(false);
    } else {
      setIsSuccess(true);
      setLoading(false);

      // Send them to the home/dashboard after a short delay
      setTimeout(() => {
        router.push("/");
      }, 1500);
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
          <Link
            href="/"
            className="flex items-center gap-2.5 mb-6 group pointer-events-none"
          >
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
                New Password
              </h1>
              <p className="text-sm text-slate-500">
                Enter your new secure password below.
              </p>
            </div>
          )}
        </div>

        {/* Success State */}
        {isSuccess ? (
          <div className="text-center pb-4 animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Password Updated!
            </h2>
            <p className="text-sm text-slate-500 mb-2 leading-relaxed">
              Your password has been successfully changed.
            </p>
            <p className="text-sm font-medium text-slate-900 animate-pulse">
              Redirecting you...
            </p>
          </div>
        ) : (
          <>
            {/* Error Message */}
            {message && message.type === "error" && (
              <div className="p-3.5 rounded-xl mb-6 text-sm border text-center border-red-200 bg-red-50 text-red-600">
                {message.text}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleUpdatePassword} className="space-y-5">
              {/* New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
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
              </div>

              {/* Confirm New Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2 ml-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={16} className="text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full pl-11 pr-11 py-3 rounded-xl text-sm border border-slate-200 text-slate-900 placeholder-slate-400 bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-6 shadow-sm"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
