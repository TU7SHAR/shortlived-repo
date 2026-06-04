import Link from "next/link";
import { ShieldAlert, ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen w-full bg-white text-zinc-900 flex flex-col items-center justify-center font-sans px-4">
      {/* Container */}
      <div className="flex flex-col items-center text-center max-w-2xl">
        {/* Subtle Alert Badge */}
        <div className="inline-flex items-center space-x-2 bg-zinc-50 border border-zinc-200 px-4 py-1.5 rounded-full mb-8">
          <ShieldAlert size={14} className="text-zinc-500" />
          <span className="text-xs font-bold tracking-widest uppercase text-zinc-600">
            System Alert
          </span>
        </div>

        {/* Huge Brutalist Number */}
        <h1 className="text-[8rem] sm:text-[12rem] md:text-[14rem] font-black leading-none tracking-tighter text-zinc-950 mb-2">
          404
        </h1>

        {/* Brutalist Subtitle */}
        <h2 className="text-2xl sm:text-4xl md:text-5xl font-black uppercase italic tracking-tighter mb-6 text-zinc-900">
          Sector Not Found
        </h2>

        {/* Minimal Description */}
        <p className="text-base sm:text-lg text-zinc-500 max-w-lg mb-12 font-medium">
          The neural pathway you requested has collapsed. This access node does
          not exist or has been relocated.
        </p>

        {/* Bold CTA Button */}
        <Link
          href="/"
          className="group inline-flex items-center justify-center bg-zinc-950 text-white px-8 py-4 rounded-xl font-bold hover:bg-zinc-800 transition-all duration-200 shadow-xl hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-2">
            <span>Return to Gateway</span>
            <ArrowRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </span>
        </Link>
      </div>
    </main>
  );
}
