"use client";

import { useRef, useState, useMemo, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "../components/landing/Navbar";
import { siteConfig } from "@/app/utils/config";
import { Shield, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import RibbonShader from "../components/landing/Dashboard/RibbonShader";

// 1. Import your Subscription Context here (adjust path as needed)
import { useSubscription } from "../context/SubscriptionContext";

const FALLBACK_PLANS = [
  {
    name: "Starter",
    desc: "Perfect for trying out the AI capabilities.",
    monthly: 0,
    annual: 0,
    features: [
      "1 Team Member",
      "1,000 API Queries / mo",
      "Basic Models (LLaMA 3)",
      "Community Support",
    ],
    isPopular: false,
  },
  {
    name: "Professional",
    desc: "For scaling sales teams and managers.",
    monthly: 59,
    annual: 49,
    features: [
      "Up to 50 Team Members",
      "50,000 API Queries / mo",
      "Premium Models (Gemini 1.5)",
      "Priority Email Support",
    ],
    isPopular: true,
  },
  {
    name: "Enterprise",
    desc: "Custom limits and dedicated infrastructure.",
    monthly: 249,
    annual: 199,
    features: [
      "Unlimited Team Members",
      "Unlimited API Queries",
      "Custom Fine-Tuned Models",
      "24/7 Dedicated SLA",
    ],
    isPopular: false,
  },
];

export default function PricingPage() {
  const container = useRef(null);
  const [isAnnual, setIsAnnual] = useState(true);

  const { user, plans: contextPlans } = useSubscription() || {};

  useEffect(() => {
    document.title = `Pricing | ${siteConfig.name}`;
  }, []);

  const activePlans = useMemo(() => {
    if (user && contextPlans && contextPlans.length > 0) {
      return contextPlans;
    }
    return siteConfig?.pricingPlans || FALLBACK_PLANS;
  }, [user, contextPlans]);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      // 4. THE GSAP FIX: Using fromTo() prevents the React 18 Strict Mode vanishing bug
      tl.fromTo(
        ".price-header",
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, stagger: 0.1, duration: 0.8, ease: "power3.out" },
      ).fromTo(
        ".price-card",
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          duration: 0.8,
          ease: "back.out(1.5)",
        },
        "-=0.4",
      );
    },
    { scope: container, dependencies: [] }, // Empty array means it runs once smoothly on mount
  );

  return (
    <div
      ref={container}
      className="bg-black text-white min-h-screen selection:bg-white selection:text-black"
    >
      <RibbonShader />
      <Navbar />

      <main className="pt-40 px-6 max-w-7xl mx-auto pb-32">
        {/* --- HEADER --- */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h1 className="price-header text-6xl md:text-8xl font-black tracking-tighter mb-6 leading-[0.9]">
            Simple pricing.
          </h1>
          <p className="price-header text-xl text-zinc-400 font-medium leading-relaxed mb-10">
            No hidden fees. No surprise overages. Choose the plan that scales
            with your ambition.
          </p>

          {/* Billing Toggle */}
          <div className="price-header inline-flex items-center gap-4 bg-zinc-900 p-2 rounded-full border border-white/10">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
                !isAnnual
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${
                isAnnual
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              Annually{" "}
              <span
                className={`${
                  isAnnual
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-zinc-800 text-emerald-400"
                } px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-colors`}
              >
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* --- PRICING CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 5. Map over activePlans instead of the hardcoded list */}
          {activePlans.map((plan, idx) => (
            <div
              key={idx}
              className={`price-card relative bg-zinc-900 p-10 rounded-[2.5rem] flex flex-col transition-all duration-300 hover:-translate-y-2 ${
                plan.isPopular
                  ? "border-2 border-white shadow-2xl shadow-white/10 scale-105 z-10"
                  : "border border-white/5 hover:border-white/20"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-black px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  Most Popular
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
              <p className="text-zinc-400 text-sm mb-8 h-10">{plan.desc}</p>

              <div className="flex items-baseline gap-1 mb-8">
                {/* Hydration-safe explicit white text */}
                <span className="text-6xl font-extrabold text-white tracking-tighter">
                  <span className="mr-1">$</span>
                  {isAnnual ? plan.annual : plan.monthly}
                </span>
                <span className="text-zinc-500 font-medium">/mo</span>
              </div>

              <Link
                href={user ? "/billing" : "/login"} // Route dynamically based on auth
                className={`w-full block py-4 rounded-xl font-bold text-center transition-transform active:scale-95 mb-10 ${
                  plan.isPopular
                    ? "bg-white text-black hover:bg-zinc-200"
                    : "bg-zinc-800 text-white hover:bg-zinc-700"
                }`}
              >
                {user ? "Upgrade Plan" : "Get Started"}
              </Link>

              <div className="space-y-4 flex-1">
                <p className="text-xs font-bold uppercase text-zinc-500 tracking-widest mb-4">
                  What's included
                </p>
                {plan.features?.map((feat, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <span className="text-zinc-300 text-sm font-medium">
                      {feat}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

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
              href="/features"
              className="hover:text-white transition-colors"
            >
              Features
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
