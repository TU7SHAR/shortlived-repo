"use client";

import { useState, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function ForgotPassword() {
  const container = useRef(null);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
      className="min-h-screen bg-zinc-50 flex items-center justify-center p-4"
    >
      <div className="auth-box max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8">
        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl">
              📨
            </div>
            <h2 className="text-2xl font-bold text-black mb-2">
              Check your email
            </h2>
            <p className="text-zinc-500 mb-8">
              We sent a password reset link to{" "}
              <span className="font-medium text-black">{email}</span>.
            </p>
            <Link
              href="/login"
              className="w-full inline-block bg-black hover:bg-zinc-800 text-white font-medium py-3 rounded-lg transition-colors"
            >
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-black tracking-tight">
                Reset Password
              </h1>
              <p className="text-zinc-500 mt-2">
                Enter your email and we'll send you a reset link.
              </p>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg mb-6 text-sm border ${
                  message.type === "error"
                    ? "bg-red-50 border-red-200 text-red-700"
                    : "bg-black text-white"
                }`}
              >
                {message.text}
              </div>
            )}

            <form onSubmit={handleResetRequest} className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-black focus:outline-none transition-all"
                  placeholder="user@example.com"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-black hover:bg-zinc-800 text-white font-medium py-2.5 rounded-lg transition-colors mt-2"
              >
                {loading ? "Sending link..." : "Send Reset Link"}
              </button>
            </form>

            <div className="text-center mt-6">
              <Link
                href="/login"
                className="text-sm text-zinc-500 hover:text-black hover:underline transition-colors font-medium"
              >
                ← Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
