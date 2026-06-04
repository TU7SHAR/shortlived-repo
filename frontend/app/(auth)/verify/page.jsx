// frontend/app/(auth)/verify/page.jsx
"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();

  // Supabase automatically appends 'error' and 'error_description' to the URL if verification fails
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // If there is no error in the URL, the verification was successful!
  const isSuccess = !error;

  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-zinc-200 p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        {isSuccess ? (
          <>
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2 tracking-tight">
              Email Verified!
            </h1>
            <p className="text-zinc-500 mb-8">
              Your account has been successfully activated. You can now access
              your dashboard and start using the bot.
            </p>
            <Link
              href="/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white font-medium py-3 rounded-lg transition-all active:scale-95"
            >
              Go to Dashboard <ArrowRight size={18} />
            </Link>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle size={32} strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-black mb-2 tracking-tight">
              Verification Failed
            </h1>
            <p className="text-zinc-500 mb-8">
              {errorDescription ||
                "The verification link is invalid, has already been used, or has expired. Please try logging in to request a new link."}
            </p>
            <Link
              href="/login"
              className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-zinc-800 text-white font-medium py-3 rounded-lg transition-all active:scale-95"
            >
              Back to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

// We wrap the content in Suspense because useSearchParams() causes Next.js to de-opt to client-side rendering
export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-50 flex items-center justify-center text-sm text-zinc-500 font-medium animate-pulse">
          Verifying your account...
        </div>
      }
    >
      <VerifyContent />
    </Suspense>
  );
}
