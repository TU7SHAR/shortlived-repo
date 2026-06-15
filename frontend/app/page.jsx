"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/landing/Navbar";
import { siteConfig } from "./utils/config";
import {
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Shield,
  MessageCircle,
  Send,
  Laptop,
  CheckCircle2,
  Star,
  FolderSearch,
  BrainCircuit,
  Users,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import ScrollMarquee from "./components/landing/ScrollMarquee";
import ScrollToTop from "./components/landing/ScrollToTop";
import Footer from "./components/landing/Footer";

// Dynamically import heavy WebGL components to prevent main-thread blocking
const ShutterIntro = dynamic(
  () => import("./components/landing/ShutterIntro"),
  { ssr: false },
);

const RibbonShader = dynamic(
  () => import("./components/landing/Dashboard/RibbonShader"),
  { ssr: false },
);

const PortalShader = dynamic(
  () => import("./components/landing/Dashboard/PortalShader"),
  { ssr: false },
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const container = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".hero-badge", {
        y: 20,
        opacity: 0,
        duration: 0.6,
        ease: "power3.out",
        delay: 2.8,
      })
        .from(
          ".hero-title",
          {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: "power4.out",
          },
          "-=0.4",
        )
        .from(
          ".hero-sub",
          {
            y: 30,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.6",
        )
        .from(
          ".hero-btn",
          {
            scale: 0.9,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
          "-=0.4",
        );

      // Animate all glass cards on scroll
      gsap.utils.toArray(".glass-card").forEach((card) => {
        gsap.from(card, {
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          ease: "power2.out",
        });
      });
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="bg-black text-white min-h-screen selection:bg-white selection:text-black relative"
    >
      <ShutterIntro />
      <RibbonShader />

      <div className="relative z-10">
        <Navbar />

        <main>
          {/* --- HERO SECTION --- */}
          <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden pt-28 pb-16 md:pt-20 md:pb-0">
            <div className="relative z-10 w-full max-w-5xl mx-auto">
              <div className="hero-badge inline-flex items-center gap-2 border border-white/10 bg-white/5 backdrop-blur-md rounded-full px-4 py-2 text-sm text-zinc-300 mb-8 uppercase tracking-widest font-semibold">
                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                AI-Powered Sales Enablement
              </div>

              <h1 className="hero-title text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 uppercase">
                Your Sales Team's <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 italic">
                  Unfair Advantage
                </span>
              </h1>

              <p className="hero-sub text-base sm:text-lg md:text-xl text-zinc-400 font-medium max-w-3xl mx-auto mb-10 px-2 leading-relaxed">
                Equip every salesperson with an AI co-pilot that knows your
                products inside out. Answer queries, handle objections, and
                generate personalised scripts via WhatsApp, Telegram, or Web.
              </p>

              <div className="hero-btn flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none mx-auto mb-8">
                <Link
                  href="/login"
                  className="w-full sm:w-auto group bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_40px_rgba(255,255,255,0.3)]"
                >
                  Book a Demo
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <Link
                  href="/features"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border border-white/10 bg-black/50 hover:bg-white/10 transition-all backdrop-blur-md flex items-center justify-center gap-2"
                >
                  See How It Works
                </Link>
              </div>

              <div className="hero-btn flex items-center justify-center gap-4 text-xs sm:text-sm text-zinc-500 font-medium">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-zinc-400" /> No credit
                  card required
                </span>
                <span className="hidden sm:inline">•</span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-zinc-400" /> Setup in
                  under 30 mins
                </span>
              </div>
            </div>
          </section>

          <ScrollMarquee />

          {/* --- HOW IT WORKS --- */}
          <section className="py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
            <div className="text-center mb-16 md:mb-24">
              <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">
                How Salesji Works
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6">
                Set up once. Close deals forever.
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Sales managers configure the system with your knowledge base —
                then the entire team benefits instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl relative overflow-hidden group hover:border-white/30 transition-all duration-500">
                <div className="text-5xl font-black text-white/5 mb-6">01</div>
                <FolderSearch className="text-blue-400 mb-6" size={36} />
                <h3 className="text-2xl font-bold mb-4">
                  Build Your Knowledge Base
                </h3>
                <p className="text-zinc-400">
                  Upload product collaterals, pricing, case studies, and
                  objection playbooks into Salesji's secure admin portal.
                </p>
              </div>
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl relative overflow-hidden group hover:border-white/30 transition-all duration-500">
                <div className="text-5xl font-black text-white/5 mb-6">02</div>
                <BrainCircuit className="text-purple-400 mb-6" size={36} />
                <h3 className="text-2xl font-bold mb-4">
                  AI Learns Your Business
                </h3>
                <p className="text-zinc-400">
                  Salesji trains on your specific context. Every generated
                  script and answer is grounded exclusively in your own data.
                </p>
              </div>
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl relative overflow-hidden group hover:border-white/30 transition-all duration-500">
                <div className="text-5xl font-black text-white/5 mb-6">03</div>
                <Users className="text-cyan-400 mb-6" size={36} />
                <h3 className="text-2xl font-bold mb-4">
                  Reps Ask, Salesji Answers
                </h3>
                <p className="text-zinc-400">
                  Salespeople interact mid-call via WhatsApp or Telegram to get
                  instant scripts, objection responses, and collateral links.
                </p>
              </div>
            </div>
          </section>

          {/* --- CORE FEATURES --- */}
          <section className="py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
            <div className="mb-12 md:mb-20">
              <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">
                Core Features
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tight mb-6">
                Everything your team
                <br />
                needs to close more.
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl">
                From live pitch assistance to competitive battlecards — Salesji
                has your reps covered at every stage of the deal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              {/* Featured Large Card */}
              <div className="glass-card md:col-span-2 bg-gradient-to-br from-zinc-900 to-black backdrop-blur-xl border border-white/10 p-8 md:p-12 rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-colors duration-500 flex flex-col md:flex-row items-center gap-10">
                <div className="flex-1 z-10">
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/20 flex items-center justify-center mb-6">
                    <Target className="text-blue-400" size={28} />
                  </div>
                  <h3 className="text-3xl font-bold mb-4">
                    Personalised Sales Scripts
                  </h3>
                  <p className="text-zinc-400 text-lg mb-8 max-w-md">
                    Describe your prospect — their industry, size, pain points —
                    and Salesji generates a tailored pitch script in seconds. No
                    more generic talk tracks.
                  </p>
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-2 font-bold text-white hover:text-blue-400 transition-colors"
                  >
                    Explore feature <ChevronRight size={18} />
                  </Link>
                </div>
                {/* Visual Chat Mockup inside Feature Card */}
                <div className="flex-1 w-full bg-white/5 border border-white/10 rounded-3xl p-6 relative z-10">
                  <div className="flex flex-col gap-4">
                    <div className="bg-white/10 text-white p-4 rounded-2xl rounded-tl-sm text-sm w-[85%]">
                      Prospect: CFO, fintech, 500 employees. Objecting to price.
                    </div>
                    <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm text-sm w-[85%] self-end">
                      Here's your tailored script: "While competitors appear
                      cheaper upfront, our enterprise-grade security saves
                      fintechs like yours 40% in compliance costs..."
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 bottom-0 w-96 h-96 bg-blue-500/10 blur-[120px] group-hover:bg-blue-500/20 transition-all duration-700" />
              </div>

              {/* Standard Cards */}
              <div className="glass-card bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl group hover:border-white/20 transition-colors duration-500">
                <Shield className="text-white mb-6" size={32} />
                <h3 className="text-2xl font-bold mb-4">Objection Handling</h3>
                <p className="text-zinc-400 mb-6">
                  Every common objection mapped to proven responses from your
                  playbook.
                </p>
                <Link
                  href="/features"
                  className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1"
                >
                  Learn more <ChevronRight size={14} />
                </Link>
              </div>

              <div className="glass-card bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-8 md:p-10 rounded-3xl group hover:border-white/20 transition-colors duration-500">
                <BarChart3 className="text-white mb-6" size={32} />
                <h3 className="text-2xl font-bold mb-4">Competitive Intel</h3>
                <p className="text-zinc-400 mb-6">
                  Instantly surface battlecards comparing your product against
                  named competitors.
                </p>
                <Link
                  href="/features"
                  className="text-sm font-bold text-zinc-300 group-hover:text-white transition-colors flex items-center gap-1"
                >
                  Learn more <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </section>

          {/* --- CHANNELS --- */}
          <section className="py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10 border-t border-white/5">
            <div className="text-center mb-16 md:mb-24">
              <span className="text-blue-400 font-bold tracking-widest uppercase text-sm mb-4 block">
                Deploy Anywhere
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
                WhatsApp, Telegram, or Web.
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                Use Salesji wherever you work best. All channels deliver the
                exact same powerful AI experience.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
              <div className="glass-card bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl hover:border-green-500/50 transition-colors group">
                <MessageCircle
                  size={48}
                  className="mx-auto mb-6 text-zinc-500 group-hover:text-green-500 transition-colors"
                />
                <h3 className="text-2xl font-bold mb-4">WhatsApp Bot</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Ask questions mid-call in plain English and get expert answers
                  instantly right on your phone.
                </p>
                <span className="bg-green-500/10 text-green-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Instant Setup
                </span>
              </div>
              <div className="glass-card bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl hover:border-blue-500/50 transition-colors group">
                <Send
                  size={48}
                  className="mx-auto mb-6 text-zinc-500 group-hover:text-blue-500 transition-colors"
                />
                <h3 className="text-2xl font-bold mb-4">Telegram Bot</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Seamless integration for Telegram-first teams. Full feature
                  parity with ultra-fast response times.
                </p>
                <span className="bg-blue-500/10 text-blue-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Secure
                </span>
              </div>
              <div className="glass-card bg-zinc-900/40 backdrop-blur-xl border border-white/10 p-10 rounded-3xl hover:border-purple-500/50 transition-colors group">
                <Laptop
                  size={48}
                  className="mx-auto mb-6 text-zinc-500 group-hover:text-purple-500 transition-colors"
                />
                <h3 className="text-2xl font-bold mb-4">Web App Chat</h3>
                <p className="text-zinc-400 text-sm mb-6">
                  A clean, browser-based interface perfect for desktop-first
                  teams making calls from their computers.
                </p>
                <span className="bg-purple-500/10 text-purple-400 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  No App Needed
                </span>
              </div>
            </div>
          </section>

          {/* --- STATS --- */}
          <section className="py-20 border-y border-white/10 bg-white/5 backdrop-blur-md relative z-10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center">
                <div className="glass-card">
                  <div className="text-4xl md:text-6xl font-black mb-2">
                    34<span className="text-blue-500">%</span>
                  </div>
                  <div className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
                    Higher Close Rate
                  </div>
                </div>
                <div className="glass-card">
                  <div className="text-4xl md:text-6xl font-black mb-2">
                    0.8<span className="text-blue-500">s</span>
                  </div>
                  <div className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
                    Avg Response Time
                  </div>
                </div>
                <div className="glass-card">
                  <div className="text-4xl md:text-6xl font-black mb-2">
                    3<span className="text-blue-500">x</span>
                  </div>
                  <div className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
                    Faster Onboarding
                  </div>
                </div>
                <div className="glass-card">
                  <div className="text-4xl md:text-6xl font-black mb-2">
                    92<span className="text-blue-500">%</span>
                  </div>
                  <div className="text-zinc-400 text-sm font-semibold uppercase tracking-widest">
                    Manager Satisfaction
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- TESTIMONIALS --- */}
          <section className="py-24 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-16 md:mb-24">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6">
                Loved by sales leaders.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col">
                <div className="flex gap-1 text-yellow-500 mb-6">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-zinc-300 italic mb-8 flex-1">
                  "Salesji transformed how our team handles objections. New reps
                  are pitching like 5-year veterans within their first week. The
                  WhatsApp bot is genius — they use it mid-call without the
                  prospect knowing."
                </p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center font-bold text-sm">
                    RK
                  </div>
                  <div>
                    <div className="font-bold">Rahul Khanna</div>
                    <div className="text-xs text-zinc-500">
                      VP Sales, Meridian Tech
                    </div>
                  </div>
                </div>
              </div>
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col">
                <div className="flex gap-1 text-yellow-500 mb-6">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-zinc-300 italic mb-8 flex-1">
                  "We updated our pricing on a Monday morning. By afternoon, all
                  40 of our reps were pitching the new strategy perfectly. That
                  kind of speed is priceless."
                </p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold text-sm">
                    SP
                  </div>
                  <div>
                    <div className="font-bold">Samantha Pierce</div>
                    <div className="text-xs text-zinc-500">
                      Sales Director, Vantage Group
                    </div>
                  </div>
                </div>
              </div>
              <div className="glass-card bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-3xl flex flex-col">
                <div className="flex gap-1 text-yellow-500 mb-6">
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                  <Star size={16} fill="currentColor" />
                </div>
                <p className="text-zinc-300 italic mb-8 flex-1">
                  "The personalised scripts feature is incredible. Our reps
                  describe the prospect, and Salesji gives them a ready-to-use
                  pitch that actually resonates. Deal size is up 28% this
                  quarter."
                </p>
                <div className="flex items-center gap-4 border-t border-white/10 pt-6">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center font-bold text-sm">
                    AM
                  </div>
                  <div>
                    <div className="font-bold">Arjun Mehta</div>
                    <div className="text-xs text-zinc-500">
                      Head of Enterprise Sales
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* --- CTA BANNER --- */}
          <section className="py-24 md:py-32 px-4 sm:px-6 relative z-10">
            <div className="glass-card max-w-5xl mx-auto bg-gradient-to-br from-blue-900/40 to-black backdrop-blur-2xl border border-blue-500/20 p-10 md:p-20 rounded-[3rem] text-center relative overflow-hidden">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-blue-500/10 blur-[100px] pointer-events-none" />
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight mb-6 relative z-10 uppercase italic">
                Ready to scale?
              </h2>
              <p className="text-zinc-300 text-lg max-w-2xl mx-auto mb-10 relative z-10">
                Join hundreds of sales teams closing more deals with Salesji.
                Book a personalised demo and see it in action with your own
                product data.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                <Link
                  href="/login"
                  className="w-full sm:w-auto bg-white text-black px-8 py-4 rounded-2xl font-bold text-lg hover:bg-zinc-200 transition-all"
                >
                  Start Free Trial
                </Link>
                <Link
                  href="/pricing"
                  className="w-full sm:w-auto px-8 py-4 rounded-2xl font-bold text-lg border border-white/20 hover:bg-white/10 transition-all"
                >
                  View Pricing
                </Link>
              </div>
            </div>
          </section>

          <ScrollToTop />
        </main>

        <Footer siteConfig={{ name: "SalesJi", version: "1.0.0" }} />
      </div>
    </div>
  );
}
