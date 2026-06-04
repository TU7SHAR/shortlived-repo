"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "../components/landing/Navbar";
import { siteConfig } from "@/app/utils/config";
import LiquidSilkShader from "../components/landing/Dashboard/LiquidSilkShader";
import {
  Shield,
  Target,
  Zap,
  BarChart3,
  BrainCircuit,
  MessageSquare,
  Workflow,
} from "lucide-react";
import Link from "next/link";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function FeaturesPage() {
  const container = useRef(null);

  useEffect(() => {
    document.title = `Features | ${siteConfig.name}`;
  }, []);

  useGSAP(
    () => {
      // Header Animation
      gsap.from(".header-reveal", {
        y: 50,
        opacity: 0,
        stagger: 0.15,
        duration: 1,
        ease: "power4.out",
      });

      // Scroll-triggered feature rows
      const featureRows = gsap.utils.toArray(".feature-row");
      featureRows.forEach((row) => {
        gsap.from(row, {
          scrollTrigger: {
            trigger: row,
            start: "top 85%",
          },
          y: 60,
          opacity: 0,
          duration: 0.8,
          ease: "power3.out",
        });
      });
    },
    { scope: container },
  );

  const features = [
    {
      icon: <BrainCircuit size={48} className="text-blue-500" />,
      title: "AI-Powered Outreach",
      desc: "Stop sending generic templates. Our LLM analyzes your prospect's company data to generate hyper-personalized intro sequences that actually get replies.",
    },
    {
      icon: <Workflow size={48} className="text-amber-500" />,
      title: "Smart Lead Routing",
      desc: "Automatically assign high-intent leads to your best closers based on real-time engagement scoring and historical win-rates.",
    },
    {
      icon: <MessageSquare size={48} className="text-purple-500" />,
      title: "Omnichannel Engagement",
      desc: "Reach them where they live. Seamlessly orchestrate touchpoints across Telegram, Email, and LinkedIn from a single dashboard.",
    },
    {
      icon: <BarChart3 size={48} className="text-emerald-500" />,
      title: "Granular Analytics",
      desc: "Track every open, click, and response. Build custom dashboards to monitor team performance and optimize your sales pipeline in real-time.",
    },
  ];

  return (
    <div
      ref={container}
      className="bg-black text-white min-h-screen selection:bg-white selection:text-black"
    >
      <LiquidSilkShader />
      <Navbar />

      <main className="pt-40 px-6 max-w-7xl mx-auto pb-32">
        {/* --- HEADER --- */}
        <div className="max-w-3xl mb-24">
          <h1 className="header-reveal text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9]">
            The Arsenal.
          </h1>
          <p className="header-reveal text-xl text-zinc-400 font-medium leading-relaxed max-w-2xl">
            Everything you need to automate your top-of-funnel and close deals
            faster. Built for scale, designed for speed.
          </p>
        </div>

        {/* --- FEATURE ROWS --- */}
        <div className="space-y-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className="feature-row bg-zinc-900 border border-white/5 p-10 md:p-16 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center gap-10 group hover:border-white/20 transition-colors duration-500"
            >
              <div className="w-24 h-24 bg-black rounded-3xl border border-white/10 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-105 transition-transform duration-500">
                {feat.icon}
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-4">{feat.title}</h3>
                <p className="text-zinc-400 text-lg leading-relaxed max-w-2xl">
                  {feat.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- BOTTOM CTA --- */}
        <div className="feature-row mt-32 text-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 to-black border border-white/10 p-16 rounded-[3rem]">
          <h2 className="text-4xl md:text-5xl font-black mb-6">
            See it in action.
          </h2>
          <p className="text-zinc-400 text-lg mb-10 max-w-xl mx-auto">
            Stop losing leads to slow response times. Put your outreach on
            autopilot today.
          </p>
          <Link
            href="/login"
            className="inline-block bg-white text-black px-10 py-5 rounded-2xl font-black text-lg hover:bg-zinc-200 transition-transform active:scale-95 shadow-2xl shadow-white/10"
          >
            Start Free Trial
          </Link>
        </div>
      </main>

      {/* --- MINIMAL FOOTER --- */}
      <footer className="py-12 border-t border-white/5 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <Shield size={20} />
            <span className="font-bold tracking-tighter uppercase text-sm">
              © 2026 {siteConfig?.name || "SalesJi"}
            </span>
          </div>
          <div className="flex gap-8 text-zinc-500 text-sm font-medium">
            <Link
              href="/pricing"
              className="hover:text-white transition-colors"
            >
              Pricing
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Login
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
