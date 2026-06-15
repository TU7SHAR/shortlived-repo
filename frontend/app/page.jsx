"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteConfig } from "./utils/config";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const container = useRef(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useGSAP(
    () => {
      const timer = setTimeout(() => {
        gsap.utils.toArray(".fade-in").forEach((element) => {
          gsap.fromTo(
            element,
            { opacity: 0, y: 30 },
            {
              scrollTrigger: {
                trigger: element,
                start: "top 85%",
              },
              opacity: 1,
              y: 0,
              duration: 0.8,
              ease: "power3.out",
            },
          );
        });

        gsap.fromTo(
          ".chat-mockup",
          { opacity: 0, y: 40 },
          { opacity: 1, y: 0, duration: 1, ease: "power4.out", delay: 0.1 },
        );

        gsap.fromTo(
          ".msg",
          { opacity: 0, y: 10 },
          {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.4,
            ease: "power2.out",
            delay: 0.4,
          },
        );

        gsap.fromTo(
          ".float-badge",
          { opacity: 0, scale: 0.8 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.6,
            stagger: 0.3,
            ease: "back.out(1.5)",
            delay: 1.5,
          },
        );
      }, 100);

      return () => clearTimeout(timer);
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="font-sans text-slate-800 bg-white overflow-x-hidden selection:bg-blue-200 selection:text-blue-900"
    >
      <nav
        className={`fixed top-0 left-0 right-0 z-[100] bg-white/90 backdrop-blur-md border-b border-slate-200/50 transition-all duration-300 ${scrolled ? "shadow-[0_2px_20px_rgba(10,22,40,0.06)]" : ""}`}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 h-[68px]">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-xl font-extrabold text-[#0A1628] tracking-tight"
          >
            <div className="w-[36px] h-[36px] bg-blue-700 rounded-[9px] flex items-center justify-center relative overflow-hidden shrink-0">
              <div className="absolute w-[20px] h-[20px] border-[2.5px] border-white rounded-full top-1/2 left-1/2 -translate-x-1/2 -translate-y-[58%]"></div>
              <div className="absolute w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[7px] border-t-white bottom-[7px] left-1/2 -translate-x-1/2"></div>
            </div>
            <span>
              Sales<span className="text-blue-500">ji</span>
            </span>
          </Link>

          <ul className="hidden md:flex items-center gap-2">
            <li>
              <Link
                href="/"
                className="text-blue-700 font-semibold px-4 py-2 rounded-lg bg-blue-50"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/features"
                className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Features
              </Link>
            </li>
            <li>
              <Link
                href="/pricing"
                className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Pricing
              </Link>
            </li>
            <li>
              <Link
                href="/contact"
                className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Contact
              </Link>
            </li>
          </ul>

          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-slate-600 hover:text-blue-700 hover:bg-blue-50 font-medium px-4 py-2 rounded-lg transition-colors"
              >
                Login
              </Link>
            )}
            <Link
              href="/contact"
              className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-5 py-2.5 rounded-[9px] shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:shadow-[0_6px_20px_rgba(29,78,216,0.35)] hover:-translate-y-[1px] transition-all flex items-center gap-1.5"
            >
              Book a Demo &rarr;
            </Link>
          </div>

          <button
            className="md:hidden flex flex-col gap-[5px] p-1"
            aria-label="Open mobile menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span
              className={`block w-6 h-[2px] bg-[#0A1628] rounded-full transition-transform ${mobileMenuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
            ></span>
            <span
              className={`block w-6 h-[2px] bg-[#0A1628] rounded-full transition-opacity ${mobileMenuOpen ? "opacity-0" : ""}`}
            ></span>
            <span
              className={`block w-6 h-[2px] bg-[#0A1628] rounded-full transition-transform ${mobileMenuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
            ></span>
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[99] bg-white pt-[80px] px-6 pb-8 flex flex-col gap-2 md:hidden">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#0A1628] text-lg font-semibold p-4 rounded-xl hover:bg-blue-50"
          >
            Home
          </Link>
          <Link
            href="/features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#0A1628] text-lg font-semibold p-4 rounded-xl hover:bg-blue-50"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#0A1628] text-lg font-semibold p-4 rounded-xl hover:bg-blue-50"
          >
            Pricing
          </Link>
          <Link
            href="/contact"
            onClick={() => setMobileMenuOpen(false)}
            className="text-[#0A1628] text-lg font-semibold p-4 rounded-xl hover:bg-blue-50"
          >
            Contact
          </Link>
          <div className="mt-4 flex flex-col gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="text-center font-semibold p-4 border border-slate-200 rounded-xl"
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="text-center font-semibold p-4 border border-slate-200 rounded-xl"
              >
                Login
              </Link>
            )}
            <Link
              href="/contact"
              className="text-center font-semibold p-4 bg-blue-700 text-white rounded-xl"
            >
              Book a Demo &rarr;
            </Link>
          </div>
        </div>
      )}

      <main>
        <section className="relative pt-[148px] px-6 pb-[100px] bg-gradient-to-br from-white via-[#EFF6FF] to-[#F0F9FF] overflow-hidden">
          <div className="absolute -top-[200px] -right-[200px] w-[700px] h-[700px] bg-[radial-gradient(circle,rgba(59,130,246,0.12)_0%,transparent_70%)] pointer-events-none"></div>
          <div className="absolute -bottom-[100px] -left-[100px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(6,182,212,0.08)_0%,transparent_70%)] pointer-events-none"></div>

          <div className="max-w-[1200px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-blue-700/5 border border-blue-700/20 text-blue-700 text-xs font-bold px-4 py-1.5 rounded-full mb-6 uppercase tracking-wide">
                <span className="w-1.5 h-1.5 bg-[#06B6D4] rounded-full animate-pulse"></span>
                AI-Powered Sales Enablement
              </div>
              <h1 className="text-[clamp(2.2rem,4vw,3.4rem)] font-extrabold leading-[1.12] tracking-tight text-[#0A1628] mb-5">
                Your Sales Team's
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-[#06B6D4]">
                  Unfair Advantage
                </span>
              </h1>
              <p className="text-lg text-slate-500 leading-relaxed max-w-[480px] mb-9 font-light">
                Equip every salesperson with an AI co-pilot that knows your
                products inside out — answers queries, handles objections, and
                generates personalised scripts. Via WhatsApp, Telegram, or our
                Web App.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/contact"
                  className="bg-blue-700 text-white font-semibold text-base px-8 py-3.5 rounded-xl shadow-[0_4px_16px_rgba(29,78,216,0.3)] hover:bg-blue-800 hover:-translate-y-[1px] transition-all"
                >
                  Book a Demo &rarr;
                </Link>
                <Link
                  href="/features"
                  className="bg-white text-[#0A1628] font-semibold text-base px-7 py-3.5 rounded-xl border-[1.5px] border-slate-300 shadow-sm hover:border-blue-500 hover:shadow-[0_4px_16px_rgba(59,130,246,0.15)] hover:-translate-y-[1px] transition-all"
                >
                  See How It Works
                </Link>
              </div>
              <p className="text-xs text-slate-500 mt-4 flex items-center gap-1.5">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
                No credit card required &nbsp;&middot;&nbsp; Setup in under 30
                minutes &nbsp;&middot;&nbsp; Free pilot available
              </p>
            </div>

            <div className="relative flex justify-center lg:justify-end">
              <div className="chat-mockup bg-white rounded-[20px] shadow-[0_16px_48px_rgba(10,22,40,0.16)] border border-slate-300/50 overflow-hidden w-full max-w-[420px]">
                <div className="bg-[#25D366] px-5 py-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center font-extrabold text-[#25D366] text-sm shrink-0">
                    SJ
                  </div>
                  <div>
                    <div className="text-white font-semibold text-[0.95rem] leading-tight">
                      Salesji Assistant
                    </div>
                    <p className="text-white/80 text-xs">● Online</p>
                  </div>
                </div>
                <div className="bg-[#ECE5DD] p-5 flex flex-col gap-3 min-h-[300px]">
                  <div className="msg bg-white self-start max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-tl-sm shadow-sm text-sm text-slate-800">
                    The customer is asking why our solution costs more than
                    Competitor X?
                    <div className="text-[10px] text-slate-400 text-right mt-1">
                      10:24 AM
                    </div>
                  </div>
                  <div className="msg bg-[#DCF8C6] self-end max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-tr-sm shadow-sm text-sm text-slate-800">
                    Great question! Here's your objection script: Our solution
                    includes enterprise-grade security, 24/7 support and 3x
                    faster implementation — Competitor X charges extra for all
                    three. Total cost of ownership is actually 40% lower over 3
                    years. Shall I pull the ROI comparison doc? 📊
                    <div className="text-[10px] text-slate-500 text-right mt-1">
                      10:24 AM
                    </div>
                  </div>
                  <div className="msg bg-white self-start max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-tl-sm shadow-sm text-sm text-slate-800">
                    Yes, and what's our best case study for this industry?
                    <div className="text-[10px] text-slate-400 text-right mt-1">
                      10:25 AM
                    </div>
                  </div>
                  <div className="msg bg-[#DCF8C6] self-end max-w-[85%] px-3.5 py-2.5 rounded-xl rounded-tr-sm shadow-sm text-sm text-slate-800">
                    Here's the Nexus Corp case study — 62% faster close rate
                    after deployment. I've also attached the tailored pitch deck
                    for manufacturing clients. Want me to personalise the intro
                    slide?
                    <div className="text-[10px] text-slate-500 text-right mt-1">
                      10:25 AM
                    </div>
                  </div>
                </div>
                <div className="bg-white p-3 flex items-center gap-2.5">
                  <div className="flex-1 bg-[#F0F0F0] text-slate-500 text-sm py-2.5 px-4 rounded-full">
                    Ask Salesji anything...
                  </div>
                  <button
                    className="w-[38px] h-[38px] bg-[#25D366] rounded-full flex items-center justify-center shrink-0"
                    aria-label="Send message"
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="white"
                    >
                      <path d="M22 2L11 13" />
                      <path
                        d="M22 2L15 22 11 13 2 9l20-7z"
                        stroke="white"
                        strokeWidth="2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="float-badge absolute -top-4 -right-5 bg-white rounded-xl p-2.5 pr-4 shadow-[0_4px_24px_rgba(10,22,40,0.1)] border border-slate-100 flex items-center gap-2.5 text-[0.82rem] font-medium text-[#0A1628]">
                <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center text-base">
                  🚀
                </div>
                <span>
                  Script generated in <strong>0.8s</strong>
                </span>
              </div>
              <div className="float-badge absolute bottom-16 -left-7 bg-white rounded-xl p-2.5 pr-4 shadow-[0_4px_24px_rgba(10,22,40,0.1)] border border-slate-100 flex items-center gap-2.5 text-[0.82rem] font-medium text-[#0A1628]">
                <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center text-base">
                  📈
                </div>
                <span>
                  <strong>+34%</strong> close rate avg.
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="py-12 px-6 border-b border-slate-100">
          <div className="max-w-[1200px] mx-auto text-center">
            <p className="text-[0.82rem] text-slate-500 tracking-[0.06em] uppercase font-medium mb-7">
              Trusted by sales teams at leading companies
            </p>
            <div className="flex items-center justify-center gap-8 md:gap-12 flex-wrap">
              {[
                "Nexus Corp",
                "Meridian",
                "Vantage Group",
                "Arco Systems",
                "Pinnacle",
                "CoreBridge",
              ].map((logo, i) => (
                <div
                  key={i}
                  className="font-extrabold text-base text-slate-400 hover:text-slate-600 transition-colors tracking-tight"
                >
                  {logo}
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 fade-in">
              <div className="text-[0.78rem] font-bold tracking-[0.1em] uppercase text-blue-700 mb-3.5">
                How Salesji Works
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.15] tracking-tight text-[#0A1628] mb-4">
                Set up once. Close deals forever.
              </h2>
              <p className="text-[1.05rem] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
                Sales managers configure the system with your knowledge base —
                then the entire team benefits instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white rounded-xl p-9 border border-slate-100 relative overflow-hidden group hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-700 to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-5xl font-extrabold text-slate-100 leading-none mb-5">
                  01
                </div>
                <div className="w-[52px] h-[52px] bg-blue-50 rounded-[14px] flex items-center justify-center text-2xl mb-5">
                  🗂️
                </div>
                <h3 className="text-[1.1rem] font-bold text-[#0A1628] mb-2.5">
                  Build Your Knowledge Base
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed">
                  Sales managers upload product collaterals, pricing, case
                  studies, competitor intel and objection playbooks into
                  Salesji's admin portal.
                </p>
              </div>
              <div className="bg-white rounded-xl p-9 border border-slate-100 relative overflow-hidden group hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-700 to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-5xl font-extrabold text-slate-100 leading-none mb-5">
                  02
                </div>
                <div className="w-[52px] h-[52px] bg-blue-50 rounded-[14px] flex items-center justify-center text-2xl mb-5">
                  🤖
                </div>
                <h3 className="text-[1.1rem] font-bold text-[#0A1628] mb-2.5">
                  AI Learns Your Business
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed">
                  Salesji trains on your specific context — your products, your
                  market, your competitors. Every answer is grounded in your own
                  data.
                </p>
              </div>
              <div className="bg-white rounded-xl p-9 border border-slate-100 relative overflow-hidden group hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-700 to-[#06B6D4] opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="text-5xl font-extrabold text-slate-100 leading-none mb-5">
                  03
                </div>
                <div className="w-[52px] h-[52px] bg-blue-50 rounded-[14px] flex items-center justify-center text-2xl mb-5">
                  💬
                </div>
                <h3 className="text-[1.1rem] font-bold text-[#0A1628] mb-2.5">
                  Reps Ask, Salesji Answers
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed">
                  Salespeople interact via WhatsApp or Telegram, mid-call or
                  between meetings. Get instant scripts, objection responses,
                  and collateral links.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="mb-16 fade-in">
              <div className="text-[0.78rem] font-bold tracking-[0.1em] uppercase text-blue-700 mb-3.5">
                Core Features
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.15] tracking-tight text-[#0A1628] mb-4">
                Everything your team
                <br />
                needs to close more.
              </h2>
              <p className="text-[1.05rem] text-slate-500 max-w-[560px] leading-relaxed font-light">
                From live pitch assistance to competitive battlecards — Salesji
                has your reps covered at every stage of the deal.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="lg:col-span-2 bg-gradient-to-br from-[#0A1628] to-[#122040] rounded-[12px] p-8 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center fade-in hover:-translate-y-1 transition-transform shadow-lg">
                <div>
                  <div className="w-12 h-12 rounded-[13px] bg-blue-500/20 flex items-center justify-center text-[1.3rem] mb-5">
                    ✍️
                  </div>
                  <h3 className="text-[1.05rem] font-bold text-white mb-2">
                    Personalised Sales Scripts
                  </h3>
                  <p className="text-[0.9rem] text-white/70 leading-relaxed mb-4">
                    Describe your prospect — their industry, size, pain points,
                    stage in the funnel — and Salesji generates a tailored pitch
                    script in seconds. No more generic talk tracks.
                  </p>
                  <Link
                    href="/features"
                    className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-white/70 hover:text-white transition-all hover:gap-2.5"
                  >
                    Explore script features &rarr;
                  </Link>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <div className="flex flex-col gap-2.5">
                    <div className="bg-white/10 text-white/90 px-3.5 py-2.5 rounded-lg text-[0.82rem] max-w-[90%]">
                      Prospect: CFO, fintech, 500 employees. Objecting to price.
                    </div>
                    <div className="bg-blue-700 text-white px-3.5 py-2.5 rounded-lg text-[0.82rem] max-w-[90%] self-end">
                      Here's your tailored script for a CFO persona in
                      fintech...
                    </div>
                    <div className="bg-white/10 text-white/90 px-3.5 py-2.5 rounded-lg text-[0.82rem] max-w-[90%]">
                      Can you make it shorter for a cold call?
                    </div>
                    <div className="bg-blue-700 text-white px-3.5 py-2.5 rounded-lg text-[0.82rem] max-w-[90%] self-end">
                      Sure — here's a 45-second version with the key ROI hook...
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-8 hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] hover:-translate-y-1 transition-all fade-in">
                <div className="w-12 h-12 rounded-[13px] bg-blue-50 flex items-center justify-center text-[1.3rem] mb-5">
                  🛡️
                </div>
                <h3 className="text-[1.05rem] font-bold text-[#0A1628] mb-2">
                  Objection Handling Engine
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed mb-4">
                  Every common objection — price, competitors, timing, authority
                  — mapped to proven responses from your own playbook.
                </p>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-blue-500 hover:gap-2.5 transition-all"
                >
                  View feature details &rarr;
                </Link>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-8 hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] hover:-translate-y-1 transition-all fade-in">
                <div className="w-12 h-12 rounded-[13px] bg-blue-50 flex items-center justify-center text-[1.3rem] mb-5">
                  🔍
                </div>
                <h3 className="text-[1.05rem] font-bold text-[#0A1628] mb-2">
                  Competitive Intelligence
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed mb-4">
                  Instantly surface battlecards comparing your product against
                  named competitors. Know their weaknesses; win the deal.
                </p>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-blue-500 hover:gap-2.5 transition-all"
                >
                  View feature details &rarr;
                </Link>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-8 hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] hover:-translate-y-1 transition-all fade-in">
                <div className="w-12 h-12 rounded-[13px] bg-blue-50 flex items-center justify-center text-[1.3rem] mb-5">
                  📂
                </div>
                <h3 className="text-[1.05rem] font-bold text-[#0A1628] mb-2">
                  Smart Asset Retrieval
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed mb-4">
                  Ask for a case study, a product sheet, or a demo video —
                  Salesji finds and serves the right collateral instantly.
                </p>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-blue-500 hover:gap-2.5 transition-all"
                >
                  View feature details &rarr;
                </Link>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-[12px] p-8 hover:border-blue-500/30 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] hover:-translate-y-1 transition-all fade-in">
                <div className="w-12 h-12 rounded-[13px] bg-blue-50 flex items-center justify-center text-[1.3rem] mb-5">
                  🎯
                </div>
                <h3 className="text-[1.05rem] font-bold text-[#0A1628] mb-2">
                  Manager Control Centre
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed mb-4">
                  Update product info, pricing, and playbooks centrally. Every
                  rep immediately benefits — no retraining required.
                </p>
                <Link
                  href="/features"
                  className="inline-flex items-center gap-1.5 text-[0.88rem] font-semibold text-blue-500 hover:gap-2.5 transition-all"
                >
                  View feature details &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-24 px-6 bg-slate-50">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 fade-in">
              <div className="text-[0.78rem] font-bold tracking-[0.1em] uppercase text-blue-700 mb-3.5">
                Three Ways to Access Salesji
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.15] tracking-tight text-[#0A1628] mb-4">
                WhatsApp, Telegram,
                <br />
                or our Web App.
              </h2>
              <p className="text-[1.05rem] text-slate-500 max-w-[560px] mx-auto leading-relaxed font-light">
                Use Salesji wherever you work best. All three channels deliver
                the same powerful AI experience — pick the one that fits your
                team's workflow.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl p-10 border border-slate-100 text-center hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="text-5xl mb-5">💬</div>
                <h3 className="text-[1.3rem] font-bold text-[#0A1628] mb-2.5">
                  WhatsApp Bot
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed">
                  Your team accesses Salesji through a dedicated WhatsApp
                  number. Ask questions in plain English, get expert answers
                  instantly — even while on a call with a prospect.
                </p>
                <span className="inline-block mt-4 bg-blue-50 text-blue-700 text-[0.78rem] font-semibold px-3 py-1.5 rounded-full tracking-[0.02em]">
                  Instant Setup
                </span>
              </div>

              <div className="bg-white rounded-xl p-10 border border-slate-100 text-center hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="text-5xl mb-5">✈️</div>
                <h3 className="text-[1.3rem] font-bold text-[#0A1628] mb-2.5">
                  Telegram Bot
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed">
                  For teams that prefer Telegram, Salesji integrates seamlessly.
                  Full feature parity — scripts, objections, assets — all
                  accessible from the same familiar interface.
                </p>
                <span className="inline-block mt-4 bg-blue-50 text-blue-700 text-[0.78rem] font-semibold px-3 py-1.5 rounded-full tracking-[0.02em]">
                  Full Feature Parity
                </span>
              </div>

              <div className="lg:col-span-2 bg-white rounded-xl p-10 border border-slate-100 text-center hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 transition-all fade-in">
                <div className="text-5xl mb-5">🖥️</div>
                <h3 className="text-[1.3rem] font-bold text-[#0A1628] mb-2.5">
                  Web App Chat
                </h3>
                <p className="text-[0.9rem] text-slate-500 leading-relaxed max-w-2xl mx-auto">
                  Prefer a browser-based experience? Salesji's web app gives
                  your reps a clean, dedicated chat interface — accessible from
                  any device, no messaging app required. Perfect for
                  desktop-first teams or those who want a dedicated sales
                  assistant tab open during calls.
                </p>
                <span className="inline-block mt-4 bg-blue-50 text-blue-700 text-[0.78rem] font-semibold px-3 py-1.5 rounded-full tracking-[0.02em]">
                  No App Required
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="bg-gradient-to-br from-[#0A1628] to-[#122040] py-20 px-6">
          <div className="max-w-[1200px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-10 text-center">
            <div className="fade-in">
              <div className="text-[clamp(2.2rem,4vw,3rem)] font-extrabold text-white leading-none tracking-tight">
                34<span className="text-[#06B6D4]">%</span>
              </div>
              <div className="text-[0.88rem] text-white/60 mt-2">
                Average increase in close rate
              </div>
            </div>
            <div className="fade-in">
              <div className="text-[clamp(2.2rem,4vw,3rem)] font-extrabold text-white leading-none tracking-tight">
                0.8<span className="text-[#06B6D4]">s</span>
              </div>
              <div className="text-[0.88rem] text-white/60 mt-2">
                Avg. response time for scripts
              </div>
            </div>
            <div className="fade-in">
              <div className="text-[clamp(2.2rem,4vw,3rem)] font-extrabold text-white leading-none tracking-tight">
                3<span className="text-[#06B6D4]">x</span>
              </div>
              <div className="text-[0.88rem] text-white/60 mt-2">
                Faster rep onboarding
              </div>
            </div>
            <div className="fade-in">
              <div className="text-[clamp(2.2rem,4vw,3rem)] font-extrabold text-white leading-none tracking-tight">
                92<span className="text-[#06B6D4]">%</span>
              </div>
              <div className="text-[0.88rem] text-white/60 mt-2">
                Manager satisfaction rate
              </div>
            </div>
          </div>
        </div>

        <section className="py-24 px-6 bg-white">
          <div className="max-w-[1200px] mx-auto">
            <div className="text-center mb-16 fade-in">
              <div className="text-[0.78rem] font-bold tracking-[0.1em] uppercase text-blue-700 mb-3.5">
                What Teams Say
              </div>
              <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.15] tracking-tight text-[#0A1628] mb-4">
                Loved by sales leaders.
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] transition-shadow fade-in">
                <div className="text-[#F59E0B] text-[0.9rem] mb-4">★★★★★</div>
                <blockquote className="text-[0.93rem] text-slate-700 leading-relaxed italic mb-5">
                  "Salesji transformed how our team handles objections. New reps
                  are pitching like 5-year veterans within their first week. The
                  WhatsApp bot is genius — they use it mid-call without the
                  prospect knowing."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-[#06B6D4] flex items-center justify-center font-bold text-white text-[0.9rem]">
                    RK
                  </div>
                  <div>
                    <div className="font-semibold text-[0.88rem] text-[#0A1628]">
                      Rahul Khanna
                    </div>
                    <div className="text-[0.78rem] text-slate-500">
                      VP Sales, Meridian Technologies
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] transition-shadow fade-in">
                <div className="text-[#F59E0B] text-[0.9rem] mb-4">★★★★★</div>
                <blockquote className="text-[0.93rem] text-slate-700 leading-relaxed italic mb-5">
                  "We updated our pricing and competitive positioning on a
                  Monday morning. By Monday afternoon, all 40 of our reps were
                  pitching the new strategy perfectly. That kind of speed is
                  priceless."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-[#06B6D4] flex items-center justify-center font-bold text-white text-[0.9rem]">
                    SP
                  </div>
                  <div>
                    <div className="font-semibold text-[0.88rem] text-[#0A1628]">
                      Samantha Pierce
                    </div>
                    <div className="text-[0.78rem] text-slate-500">
                      Sales Director, Vantage Group
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-xl p-8 hover:shadow-[0_4px_24px_rgba(10,22,40,0.1)] transition-shadow fade-in">
                <div className="text-[#F59E0B] text-[0.9rem] mb-4">★★★★★</div>
                <blockquote className="text-[0.93rem] text-slate-700 leading-relaxed italic mb-5">
                  "The personalised scripts feature is incredible. Our reps
                  describe the prospect, and Salesji gives them a ready-to-use
                  pitch that actually resonates. Deal size is up 28% this
                  quarter."
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-[#06B6D4] flex items-center justify-center font-bold text-white text-[0.9rem]">
                    AM
                  </div>
                  <div>
                    <div className="font-semibold text-[0.88rem] text-[#0A1628]">
                      Arjun Mehta
                    </div>
                    <div className="text-[0.78rem] text-slate-500">
                      Head of Enterprise Sales, CoreBridge
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-gradient-to-br from-blue-700 via-[#1e40af] to-[#0A1628] py-24 px-6 relative overflow-hidden">
          <div className="absolute -top-[150px] -right-[150px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]"></div>
          <div className="max-w-[720px] mx-auto text-center relative z-10 fade-in">
            <h2 className="text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[1.15] text-white mb-4">
              Ready to give your team
              <br />
              an unfair advantage?
            </h2>
            <p className="text-[1.05rem] text-white/75 mb-9 leading-relaxed">
              Join hundreds of sales teams closing more deals with Salesji. Book
              a personalised demo and see it in action with your own product
              data.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/contact"
                className="bg-white text-blue-700 font-bold text-base px-8 py-3.5 rounded-xl shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] hover:-translate-y-[2px] transition-all"
              >
                Book Your Free Demo &rarr;
              </Link>
              <Link
                href="/pricing"
                className="bg-transparent text-white font-semibold text-base px-7 py-3.5 rounded-xl border-[1.5px] border-white/40 hover:border-white hover:bg-white/10 transition-all"
              >
                View Pricing
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#0A1628] text-white/60 pt-16 px-6 pb-8">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-12">
            <div className="lg:col-span-2">
              <Link
                href="/"
                className="flex items-center gap-2.5 text-xl font-extrabold text-white tracking-tight mb-4"
              >
                <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center text-[0.85rem]">
                  SJ
                </div>
                <span>
                  Sales<span className="text-blue-500">ji</span>
                </span>
              </Link>
              <p className="text-[0.88rem] leading-[1.7] max-w-[260px]">
                AI-powered sales enablement for enterprise and SME teams. Know
                your product, beat your competition, close more deals.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[0.88rem] text-white mb-4 tracking-[0.02em]">
                Product
              </h3>
              <ul className="flex flex-col gap-2.5 text-[0.88rem]">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-white transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Book a Demo
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Integrations
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[0.88rem] text-white mb-4 tracking-[0.02em]">
                Company
              </h3>
              <ul className="flex flex-col gap-2.5 text-[0.88rem]">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    About Us
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-white transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[0.88rem] text-white mb-4 tracking-[0.02em]">
                Legal
              </h3>
              <ul className="flex flex-col gap-2.5 text-[0.88rem]">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    GDPR
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-[0.82rem]">
            <p>
              &copy; {new Date().getFullYear()} {siteConfig?.name || "Salesji"}.
              All rights reserved. &nbsp;&middot;&nbsp; A venture of{" "}
              <a
                href="https://essenn.associates"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                ESS ENN Associates
              </a>
            </p>
            <div className="flex gap-4">
              <Link href="#" className="hover:text-white transition-colors">
                LinkedIn
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Twitter
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                YouTube
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
