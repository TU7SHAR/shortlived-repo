"use client";

import { useEffect } from "react";
import { supabase } from "./lib/supabase";

export default function RootPage() {
  useEffect(() => {
    const redirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        window.location.href = "/dashboard";
      } else {
        window.location.href = "/login";
      }
    };
    redirect();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 font-medium">Redirecting...</p>
      </div>
    </div>
  );
}
