"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import Navbar from "../components/landing/Navbar";
import Footer from "../components/landing/Footer";
import { siteConfig } from "@/app/utils/config";

export default function FeaturesPage() {
  const observerRef = useRef(null);

  useEffect(() => {
    document.title = `Features — ${siteConfig.name} AI Sales Assistant`;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
            observerRef.current.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => {
      observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <Navbar />


      {/* PAGE HERO */}
      <section className="pt-[140px] pb-20 bg-gradient-to-br from-[#EFF6FF] via-[#F0F9FF] to-white text-center px-6">
        <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#1D4ED8] mb-3.5">Platform Features</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-[#0A1628] mb-4">
          Built for every stage<br />of the{" "}
          <span className="bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] bg-clip-text text-transparent">sales conversation.</span>
        </h1>
        <p className="text-lg text-[#64748B] max-w-[580px] mx-auto mb-9 leading-relaxed font-light">
          From the first pitch to the final objection — Salesji equips your reps with exactly the right words, at exactly the right moment.
        </p>
        <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-8 py-3.5 rounded-[11px] text-base font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(29,78,216,0.35)] transition-all">
          Book a Demo →
        </Link>
      </section>


      {/* FEATURE ROWS */}
      <section className="py-24 px-6">
        <div className="max-w-[1200px] mx-auto">

          {/* Feature 1: Personalised Scripts */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-[72px] items-center py-[72px] border-b border-[#F1F5F9]">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#06B6D4] mb-3">Personalised Scripts</p>
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold text-[#0A1628] mb-4 leading-tight">A perfect pitch,<br />every time.</h2>
              <p className="text-[0.95rem] text-[#64748B] leading-relaxed mb-6">Describe your prospect in plain English — their role, company size, industry, pain points — and Salesji generates a tailored, conversion-optimised script in under a second.</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Scripts personalised by prospect persona, industry and deal stage</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Opening lines, discovery questions and closing statements included</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Adjust length, tone and formality instantly</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Built on your own product messaging and positioning</li>
              </ul>
              <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[9px] text-sm font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 transition-all">Get Personalised Scripts →</Link>
            </div>
            <div className="bg-[#F8FAFC] rounded-[20px] p-8 border border-[#F1F5F9] min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="absolute top-[-80px] right-[-80px] w-60 h-60 bg-[radial-gradient(circle,rgba(59,130,246,0.07)_0%,transparent_70%)]" />
              <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(10,22,40,0.10)] p-6 w-full max-w-[360px] relative z-10">
                <span className="inline-block bg-[#EFF6FF] text-[#1D4ED8] text-[0.72rem] font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4">Script Generated</span>
                <div className="bg-[#F8FAFC] rounded-lg p-3 mb-4">
                  <p className="text-[0.78rem] text-[#64748B] mb-1">Prospect Profile</p>
                  <strong className="text-[0.85rem] text-[#0A1628]">CFO · Fintech · 500 employees · Price-sensitive</strong>
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex gap-2"><span className="text-[0.7rem] text-[#CBD5E1] w-4 shrink-0 mt-0.5">1</span><span className="text-[0.8rem] text-[#334155] leading-relaxed">&quot;Hi [Name], I know your time is valuable — most CFOs in fintech tell me their biggest pain is <em className="text-[#1D4ED8] not-italic font-semibold">sales team efficiency</em>...&quot;</span></div>
                  <div className="flex gap-2"><span className="text-[0.7rem] text-[#CBD5E1] w-4 shrink-0 mt-0.5">2</span><span className="text-[0.8rem] text-[#334155] leading-relaxed">&quot;Our clients see an average <em className="text-[#1D4ED8] not-italic font-semibold">34% improvement in close rate</em> within 90 days...&quot;</span></div>
                  <div className="flex gap-2"><span className="text-[0.7rem] text-[#CBD5E1] w-4 shrink-0 mt-0.5">3</span><span className="text-[0.8rem] text-[#334155] leading-relaxed">&quot;Would it be worth 20 minutes to see how [Company] could achieve the same?&quot;</span></div>
                </div>
              </div>
            </div>
          </div>


          {/* Feature 2: Objection Handling */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-[72px] items-center py-[72px] border-b border-[#F1F5F9] md:[direction:rtl]">
            <div className="md:[direction:ltr]">
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#06B6D4] mb-3">Objection Handling</p>
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold text-[#0A1628] mb-4 leading-tight">Never be caught<br />off guard again.</h2>
              <p className="text-[0.95rem] text-[#64748B] leading-relaxed mb-6">Your sales manager&apos;s best objection responses — captured, structured and made instantly accessible. When a prospect pushes back, your rep asks Salesji and gets the proven response immediately.</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Covers price, timing, competitor and authority objections</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Responses drawn directly from your proven playbooks</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Works mid-call — answer received in under a second</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Managers can continuously refine and update responses</li>
              </ul>
              <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[9px] text-sm font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 transition-all">Handle Every Objection →</Link>
            </div>
            <div className="bg-[#F8FAFC] rounded-[20px] p-8 border border-[#F1F5F9] min-h-[300px] flex items-center justify-center relative overflow-hidden md:[direction:ltr]">
              <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(10,22,40,0.10)] p-5 w-full max-w-[340px] relative z-10">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-[#F1F5F9]">
                  <div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" />
                  <span className="text-[0.82rem] font-semibold text-[#0A1628]">Salesji — Live Objection Support</span>
                </div>
                <div className="flex gap-2.5 mb-2.5">
                  <div className="py-2 px-3 rounded-[10px] text-[0.8rem] leading-relaxed max-w-[85%] bg-[#F1F5F9] text-[#334155]">&quot;Your price is 40% more than Competitor X.&quot;</div>
                </div>
                <div className="flex gap-2.5 flex-row-reverse">
                  <div className="py-2 px-3 rounded-[10px] text-[0.8rem] leading-relaxed max-w-[85%] bg-[#1D4ED8] text-white">
                    Great — here&apos;s your response:<br /><br />
                    &quot;That&apos;s fair to raise. Competitor X doesn&apos;t include enterprise security or 24/7 support. Over 3 years, our TCO is actually 40% lower. Can I show you the breakdown?&quot;
                    <span className="inline-block bg-[#F0FDF4] text-[#16A34A] text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full mt-1.5">✓ From your playbook</span>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Feature 3: Competitive Intelligence */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-[72px] items-center py-[72px] border-b border-[#F1F5F9]">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#06B6D4] mb-3">Competitive Intelligence</p>
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold text-[#0A1628] mb-4 leading-tight">Win every<br />head-to-head comparison.</h2>
              <p className="text-[0.95rem] text-[#64748B] leading-relaxed mb-6">Salesji stores and surfaces your competitive battlecards instantly. Your reps always know the key differentiators, competitor weaknesses, and the exact language to win.</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Battlecards for each named competitor in your market</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Key differentiators, pricing comparisons, feature gaps</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Kept up-to-date by your managers centrally</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Accessible in seconds via a simple message</li>
              </ul>
              <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[9px] text-sm font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 transition-all">See Competitive Intel →</Link>
            </div>
            <div className="bg-[#F8FAFC] rounded-[20px] p-8 border border-[#F1F5F9] min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(10,22,40,0.10)] p-5 w-full max-w-[360px] relative z-10">
                <h4 className="font-display text-sm font-bold text-[#0A1628] mb-3.5 flex items-center gap-2">⚔️ Salesji vs. Competitor X</h4>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <div className="text-[0.7rem] font-bold tracking-wider uppercase text-[#1D4ED8] mb-1.5">Salesji ✓</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />WhatsApp & Telegram native</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />Manager-configured AI</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />Personalised scripts</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#22C55E] shrink-0" />Enterprise security</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-[0.7rem] font-bold tracking-wider uppercase text-[#64748B] mb-1.5">Competitor X ✗</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />Web app only</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />Generic AI responses</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 mb-1.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />Static templates only</div>
                    <div className="text-[0.78rem] bg-[#F8FAFC] rounded-md p-1.5 px-2.5 text-[#334155] flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] shrink-0" />Add-on cost</div>
                  </div>
                </div>
              </div>
            </div>
          </div>


          {/* Feature 4: Smart Asset Retrieval */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-[72px] items-center py-[72px] border-b border-[#F1F5F9] md:[direction:rtl]">
            <div className="md:[direction:ltr]">
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#06B6D4] mb-3">Smart Asset Retrieval</p>
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold text-[#0A1628] mb-4 leading-tight">The right collateral,<br />right now.</h2>
              <p className="text-[0.95rem] text-[#64748B] leading-relaxed mb-6">Every case study, product sheet, demo video and proposal template is indexed and retrievable in plain English. Your rep simply asks and gets the link — no folders, no searching.</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Natural language search across all uploaded assets</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Industry-specific and persona-specific filtering</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Shareable links returned instantly to the rep</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Managers control which assets are active and visible</li>
              </ul>
              <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[9px] text-sm font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 transition-all">Explore Asset Management →</Link>
            </div>
            <div className="bg-[#F8FAFC] rounded-[20px] p-8 border border-[#F1F5F9] min-h-[300px] flex items-center justify-center relative overflow-hidden md:[direction:ltr]">
              <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(10,22,40,0.10)] p-5 w-full max-w-[340px] relative z-10">
                <div className="flex items-center gap-2.5 mb-3.5"><div className="w-2 h-2 rounded-full bg-[#06B6D4] animate-pulse" /><span className="text-[0.82rem] font-semibold text-[#0A1628]">Assets for &quot;manufacturing client&quot;</span></div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#EFF6FF] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-[#FEF2F2] flex items-center justify-center text-base">📄</div>
                  <div className="flex-1"><strong className="text-[0.82rem] text-[#0A1628] block">Nexus Corp Case Study</strong><span className="text-[0.72rem] text-[#64748B]">PDF · Manufacturing · 2024</span></div>
                  <span className="text-[#CBD5E1] text-sm">→</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#EFF6FF] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-[#FFF7ED] flex items-center justify-center text-base">📊</div>
                  <div className="flex-1"><strong className="text-[0.82rem] text-[#0A1628] block">Manufacturing Pitch Deck</strong><span className="text-[0.72rem] text-[#64748B]">PPT · 18 slides</span></div>
                  <span className="text-[#CBD5E1] text-sm">→</span>
                </div>
                <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#EFF6FF] transition-colors cursor-pointer">
                  <div className="w-9 h-9 rounded-lg bg-[#F0FDF4] flex items-center justify-center text-base">🎬</div>
                  <div className="flex-1"><strong className="text-[0.82rem] text-[#0A1628] block">Product Demo — Industry Cut</strong><span className="text-[0.72rem] text-[#64748B]">Video · 4 min</span></div>
                  <span className="text-[#CBD5E1] text-sm">→</span>
                </div>
              </div>
            </div>
          </div>


          {/* Feature 5: Manager Control Centre */}
          <div className="fade-in grid grid-cols-1 md:grid-cols-2 gap-[72px] items-center py-[72px]">
            <div>
              <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#06B6D4] mb-3">Manager Control Centre</p>
              <h2 className="font-display text-[clamp(1.5rem,2.5vw,2rem)] font-extrabold text-[#0A1628] mb-4 leading-tight">Update once.<br />Benefit your entire team instantly.</h2>
              <p className="text-[0.95rem] text-[#64748B] leading-relaxed mb-6">Sales managers have full control over what Salesji knows. Update pricing, refresh objection responses, add new case studies — your whole team reflects the change immediately.</p>
              <ul className="flex flex-col gap-2.5 mb-7">
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Centralised admin dashboard for all content management</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>No technical skills required — update via simple forms</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Real-time propagation to all reps&apos; bots</li>
                <li className="flex items-start gap-2.5 text-sm text-[#334155]"><span className="w-5 h-5 bg-[#EFF6FF] text-[#1D4ED8] rounded-full flex items-center justify-center text-[0.7rem] font-bold shrink-0 mt-0.5">✓</span>Usage analytics to see what your team asks most</li>
              </ul>
              <Link href="/contact" className="inline-flex items-center gap-1.5 bg-[#1D4ED8] text-white px-5 py-2.5 rounded-[9px] text-sm font-semibold shadow-[0_2px_8px_rgba(29,78,216,0.25)] hover:bg-[#1a44b8] hover:-translate-y-0.5 transition-all">See the Dashboard →</Link>
            </div>
            <div className="bg-[#F8FAFC] rounded-[20px] p-8 border border-[#F1F5F9] min-h-[300px] flex items-center justify-center relative overflow-hidden">
              <div className="bg-white rounded-[14px] shadow-[0_4px_24px_rgba(10,22,40,0.10)] p-5 w-full max-w-[360px] relative z-10">
                <div className="font-display text-[0.85rem] font-bold text-[#0A1628] mb-3.5">📋 Knowledge Base — Last Updated Today</div>
                <div className="flex items-center justify-between p-2.5 px-3 bg-[#F8FAFC] rounded-lg mb-2"><div><strong className="text-[0.82rem] text-[#0A1628] block">Product Pricing Sheet</strong><span className="text-[0.72rem] text-[#64748B]">Updated 2 hours ago</span></div><span className="text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full bg-[#EFF6FF] text-[#1D4ED8]">Updated</span></div>
                <div className="flex items-center justify-between p-2.5 px-3 bg-[#F8FAFC] rounded-lg mb-2"><div><strong className="text-[0.82rem] text-[#0A1628] block">Objection Playbook v3</strong><span className="text-[0.72rem] text-[#64748B]">Active · 42 objections</span></div><span className="text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A]">Live</span></div>
                <div className="flex items-center justify-between p-2.5 px-3 bg-[#F8FAFC] rounded-lg mb-2"><div><strong className="text-[0.82rem] text-[#0A1628] block">Competitor Battlecards</strong><span className="text-[0.72rem] text-[#64748B]">6 competitors covered</span></div><span className="text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A]">Live</span></div>
                <div className="flex items-center justify-between p-2.5 px-3 bg-[#F8FAFC] rounded-lg mb-3"><div><strong className="text-[0.82rem] text-[#0A1628] block">Case Studies Library</strong><span className="text-[0.72rem] text-[#64748B]">28 case studies</span></div><span className="text-[0.72rem] font-semibold px-2.5 py-0.5 rounded-full bg-[#F0FDF4] text-[#16A34A]">Live</span></div>
                <div className="bg-[#F1F5F9] rounded h-1 overflow-hidden"><div className="h-full rounded bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] w-[73%]" /></div>
                <p className="text-[0.72rem] text-[#64748B] mt-2">73% knowledge base completeness score</p>
              </div>
            </div>
          </div>

        </div>
      </section>


      {/* MINI FEATURES GRID */}
      <section className="py-24 px-6 bg-[#F8FAFC]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#1D4ED8] mb-3">More Capabilities</p>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-[#0A1628]">Everything else your team needs.</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "💬", title: "WhatsApp Integration", desc: "Your dedicated Salesji number on WhatsApp. Reps message it like they'd message a colleague. Instant, familiar, zero learning curve." },
              { icon: "✈️", title: "Telegram Integration", desc: "Full feature parity on Telegram. Teams that prefer Telegram get the exact same powerful experience with zero compromise." },
              { icon: "🖥️", title: "Web App Chat", desc: "No messaging app? No problem. Browser-based chat interface gives reps a dedicated tab for their AI co-pilot." },
              { icon: "🔒", title: "Enterprise Security", desc: "Your proprietary data stays yours. Enterprise-grade encryption, role-based access controls, and full audit logs." },
              { icon: "📊", title: "Usage Analytics", desc: "See what your team asks most, which objections come up, and which assets get shared. Intelligence to refine your playbook." },
              { icon: "⚡", title: "Sub-Second Responses", desc: "Salesji responds in under a second. Mid-call. Mid-meeting. There's no perceptible delay between asking and knowing." },
              { icon: "🌍", title: "Multi-Language Support", desc: "Salesji understands and responds in multiple languages. Serve diverse sales teams and multilingual markets with ease." },
            ].map((item, idx) => (
              <div key={idx} className="fade-in bg-white rounded-xl p-7 border border-[#F1F5F9] hover:shadow-[0_4px_24px_rgba(10,22,40,0.10)] hover:-translate-y-0.5 transition-all duration-300">
                <div className="w-11 h-11 bg-[#EFF6FF] rounded-xl flex items-center justify-center text-xl mb-4">{item.icon}</div>
                <h3 className="font-display text-[0.95rem] font-bold text-[#0A1628] mb-2">{item.title}</h3>
                <p className="text-[0.85rem] text-[#64748B] leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#1D4ED8] via-[#1e40af] to-[#0A1628] relative overflow-hidden">
        <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
        <div className="max-w-[720px] mx-auto text-center relative z-10">
          <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-white mb-4">See every feature<br />live in a demo.</h2>
          <p className="text-lg text-white/75 mb-9">Our team will walk you through Salesji using your own products and scenarios. 30 minutes. No slides. Just results.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/contact" className="inline-flex items-center gap-2 bg-white text-[#1D4ED8] px-8 py-3.5 rounded-[11px] text-base font-bold shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all">Book Your Free Demo →</Link>
            <Link href="/pricing" className="inline-flex items-center gap-2 bg-transparent text-white border-[1.5px] border-white/40 px-7 py-3.5 rounded-[11px] text-base font-semibold hover:border-white hover:bg-white/10 transition-all">View Pricing</Link>
          </div>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .fade-in {
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
