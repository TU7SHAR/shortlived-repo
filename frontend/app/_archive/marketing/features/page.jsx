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
<<<<<<< HEAD
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
=======
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add("visible"), i * 80);
            observerRef.current.unobserve(entry.target);
>>>>>>> shortorigin/main
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

<<<<<<< HEAD

  const features = [
    {
      label: "Personalised Scripts",
      title: "A perfect pitch, every time.",
      desc: "Salesji generates tailored sales scripts based on your prospect's role, industry, and pain points. No more generic pitches — every conversation feels personal and relevant.",
      visual: "script-card",
      reversed: false,
    },
    {
      label: "Objection Handling",
      title: "Never be caught off guard again.",
      desc: "Get real-time AI coaching when prospects push back. Salesji analyses the objection and suggests proven responses drawn from your team's best practices.",
      visual: "demo-card",
      reversed: true,
    },
    {
      label: "Competitive Intelligence",
      title: "Win every head-to-head comparison.",
      desc: "Access instant battlecards comparing your product against competitors. Know your strengths, acknowledge gaps, and position your offering with confidence.",
      visual: "battlecard",
      reversed: false,
    },
    {
      label: "Smart Asset Retrieval",
      title: "The right collateral, right now.",
      desc: "Salesji intelligently surfaces the most relevant case studies, one-pagers, and presentations based on where your prospect is in the sales cycle.",
      visual: "asset-list",
      reversed: true,
    },
    {
      label: "Manager Control Centre",
      title: "Update once. Benefit your entire team instantly.",
      desc: "Managers upload and maintain a single knowledge base. Every update is immediately available to all reps across all channels — no retraining required.",
      visual: "manager-ui",
      reversed: false,
    },
  ];


  const miniFeatures = [
    { icon: "💬", title: "WhatsApp Integration", desc: "Reach your reps where they already are. Full AI assistance right inside WhatsApp." },
    { icon: "✈️", title: "Telegram Integration", desc: "Seamless Telegram bot support for teams who prefer speed and simplicity." },
    { icon: "🌐", title: "Web App Chat", desc: "A full-featured web interface for desktop users who want the complete experience." },
    { icon: "🔒", title: "Enterprise Security", desc: "SOC 2 compliance, data encryption at rest and in transit, and SSO support." },
    { icon: "📊", title: "Usage Analytics", desc: "Track which features your team uses most and identify coaching opportunities." },
    { icon: "⚡", title: "Sub-Second Responses", desc: "AI responses delivered in under one second so conversations never lose momentum." },
    { icon: "🌍", title: "Multi-Language Support", desc: "Generate scripts and handle objections in multiple languages for global teams." },
  ];

  const renderVisual = (type) => {
    switch (type) {
      case "script-card":
        return (
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-[360px]">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-grey-100">
              <div className="w-2 h-2 rounded-full bg-accent" />
              <span className="text-xs text-grey-500 font-medium">Generated Script</span>
            </div>
            <div className="flex gap-2 mb-3">
              <span className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-medium">CFO</span>
              <span className="text-xs bg-primary-light text-primary px-2.5 py-1 rounded-full font-medium">Fintech</span>
            </div>
            <p className="text-sm text-grey-700 leading-relaxed">
              &quot;Hi Sarah, I noticed Apex Fintech just closed your Series B. Congratulations! Many CFOs at your stage are looking to streamline reconciliation workflows — we helped TrueBank cut processing time by 40%...&quot;
            </p>
          </div>
        );

      case "demo-card":
        return (
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-[360px]">
            <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-navy">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Objection Support
            </div>
            <div className="bg-primary-light text-primary text-sm p-2.5 px-3.5 rounded-xl mb-2 ml-auto max-w-[85%] w-fit">
              &quot;We already have a solution in place.&quot;
            </div>
            <div className="bg-grey-100 text-grey-700 text-sm p-2.5 px-3.5 rounded-xl max-w-[85%]">
              &quot;That&apos;s great — it means you value this area. Many of our clients used [competitor] before switching. Would it help if I shared how we differ on [specific pain point]?&quot;
            </div>
          </div>
        );
      case "battlecard":
        return (
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-[360px]">
            <div className="text-sm font-semibold text-navy mb-4 text-center">Salesji vs Competitor X</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-primary font-semibold mb-2">Salesji</h4>
                <div className="text-xs text-primary font-medium py-1.5 border-b border-grey-100">Real-time AI coaching</div>
                <div className="text-xs text-primary font-medium py-1.5 border-b border-grey-100">WhatsApp + Telegram</div>
                <div className="text-xs text-primary font-medium py-1.5 border-b border-grey-100">Sub-second responses</div>
                <div className="text-xs text-grey-600 py-1.5">Custom scripts</div>
              </div>
              <div>
                <h4 className="text-xs uppercase tracking-wider text-grey-500 font-semibold mb-2">Competitor X</h4>
                <div className="text-xs text-grey-600 py-1.5 border-b border-grey-100">Static playbooks</div>
                <div className="text-xs text-grey-600 py-1.5 border-b border-grey-100">Web only</div>
                <div className="text-xs text-grey-600 py-1.5 border-b border-grey-100">5-10s response time</div>
                <div className="text-xs text-grey-600 py-1.5">Template-based</div>
              </div>
            </div>
          </div>
        );

      case "asset-list":
        return (
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-[360px]">
            <div className="text-sm font-semibold text-navy mb-4">Recommended Assets</div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-grey-50 mb-2">
              <div className="w-9 h-9 rounded-lg bg-red-500 flex items-center justify-center text-white text-[10px] font-bold">PDF</div>
              <div><span className="text-sm font-medium text-grey-800 block">ROI Case Study — Fintech</span><small className="text-xs text-grey-500">Updated 2 days ago</small></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-grey-50 mb-2">
              <div className="w-9 h-9 rounded-lg bg-amber-500 flex items-center justify-center text-white text-[10px] font-bold">PPT</div>
              <div><span className="text-sm font-medium text-grey-800 block">Product Overview Deck</span><small className="text-xs text-grey-500">Updated 1 week ago</small></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-grey-50">
              <div className="w-9 h-9 rounded-lg bg-purple-500 flex items-center justify-center text-white text-[10px] font-bold">VID</div>
              <div><span className="text-sm font-medium text-grey-800 block">Customer Testimonial — TrueBank</span><small className="text-xs text-grey-500">3 min watch</small></div>
            </div>
          </div>
        );
      case "manager-ui":
        return (
          <div className="bg-white rounded-xl p-6 shadow-md w-full max-w-[360px]">
            <div className="text-sm font-semibold text-navy mb-4">Knowledge Base Status</div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-grey-50 mb-2">
              <span className="text-sm text-grey-700">Product Playbook v3.2</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-grey-50 mb-2">
              <span className="text-sm text-grey-700">Q1 Pricing Matrix</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-grey-50 mb-2">
              <span className="text-sm text-grey-700">Competitor Analysis 2025</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-amber-100 text-amber-700">Updating</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-grey-50">
              <span className="text-sm text-grey-700">Objection Library</span>
              <span className="text-[11px] px-2.5 py-1 rounded-full font-semibold bg-emerald-100 text-emerald-700">Active</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="bg-white text-grey-800 min-h-screen font-body">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-24 bg-gradient-to-br from-navy via-[#1a2744] to-[#0f2040] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(29,78,216,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <span className="inline-block bg-primary-bright/15 text-primary-bright px-5 py-2 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
            Platform Features
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-6 max-w-[800px] mx-auto leading-tight">
            Built for every stage of the{" "}
            <span className="bg-gradient-to-r from-primary-bright to-accent bg-clip-text text-transparent">
              sales conversation.
            </span>
          </h1>
          <p className="text-lg text-grey-300 max-w-[600px] mx-auto mb-10">
            From first pitch to close, Salesji equips your reps with AI-powered tools that adapt to every prospect and scenario in real time.
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-primary text-white px-9 py-3.5 rounded-lg text-base font-semibold hover:bg-primary-bright hover:-translate-y-0.5 transition-all shadow-md"
          >
            Book a Demo
          </Link>
        </div>
      </section>


      {/* Feature Rows */}
      <section className="py-28">
        <div className="max-w-[1200px] mx-auto px-6">
          {features.map((feat, idx) => (
            <div
              key={idx}
              className={`fade-in grid grid-cols-1 md:grid-cols-2 gap-20 items-center mb-28 last:mb-0 ${
                feat.reversed ? "md:[direction:rtl]" : ""
              }`}
            >
              <div className={feat.reversed ? "md:[direction:ltr]" : ""}>
                <span className="inline-block bg-primary-light text-primary px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide mb-4">
                  {feat.label}
                </span>
                <h2 className="font-display text-3xl md:text-4xl font-bold text-navy mb-4">
                  {feat.title}
                </h2>
                <p className="text-base text-grey-600 leading-relaxed">{feat.desc}</p>
              </div>
              <div className={`bg-grey-50 rounded-2xl p-10 border border-grey-200 min-h-[320px] flex items-center justify-center ${feat.reversed ? "md:[direction:ltr]" : ""}`}>
                {renderVisual(feat.visual)}
              </div>
            </div>
          ))}
=======
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

>>>>>>> shortorigin/main
        </div>
      </section>


<<<<<<< HEAD
      {/* Mini Features */}
      <section className="py-24 bg-grey-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center mb-14">And so much more...</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {miniFeatures.map((item, idx) => (
              <div
                key={idx}
                className="fade-in bg-white rounded-xl p-8 border border-grey-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary-bright transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center text-xl mb-4">
                  {item.icon}
                </div>
                <h3 className="font-display text-lg font-semibold text-navy mb-2">{item.title}</h3>
                <p className="text-sm text-grey-500 leading-relaxed">{item.desc}</p>
=======
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
>>>>>>> shortorigin/main
              </div>
            ))}
          </div>
        </div>
      </section>

<<<<<<< HEAD
      {/* CTA Banner */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary-bright text-white text-center">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">See every feature live in a demo.</h2>
          <p className="text-lg opacity-90 mb-10">Our team will walk you through every capability, personalised to your industry.</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-white text-primary px-8 py-3.5 rounded-lg text-base font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Book Your Free Demo
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center bg-transparent text-white border-2 border-white/40 px-8 py-3.5 rounded-lg text-base font-semibold hover:border-white hover:bg-white/10 transition-all ml-4"
          >
            View Pricing
          </Link>
        </div>
      </section>


      {/* Footer */}
      <footer className="bg-navy text-grey-300 pt-20 pb-10">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-14">
            <div className="md:col-span-1">
              <Link href="/" className="font-display font-extrabold text-xl text-white flex items-center gap-2 mb-4">
                <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">SJ</span> Salesji
              </Link>
              <p className="text-sm text-grey-400 leading-relaxed max-w-[300px]">
                AI-powered sales enablement for modern teams. Personalised scripts, real-time coaching, and smart asset retrieval.
              </p>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-grey-400 mb-5 font-semibold">Product</h4>
              <Link href="/features" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Features</Link>
              <Link href="/pricing" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Pricing</Link>
              <Link href="/contact" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Book a Demo</Link>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-grey-400 mb-5 font-semibold">Company</h4>
              <Link href="/about" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">About</Link>
              <Link href="/contact" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Contact</Link>
            </div>
            <div>
              <h4 className="text-xs uppercase tracking-widest text-grey-400 mb-5 font-semibold">Legal</h4>
              <Link href="/privacy" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="block text-sm text-grey-300 py-1.5 hover:text-white transition-colors">Terms of Service</Link>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-grey-500">
              &copy; 2025 Salesji. All rights reserved. A venture of{" "}
              <a href="https://essenn.associates" target="_blank" rel="noopener noreferrer" className="text-accent underline">ESS ENN Associates</a>
            </p>
            <div className="flex gap-4">
              <a href="mailto:hello@salesji.com" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-grey-400 hover:bg-primary hover:text-white transition-all text-sm">✉</a>
              <a href="https://linkedin.com/company/salesji" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 flex items-center justify-center text-grey-400 hover:bg-primary hover:text-white transition-all text-xs font-bold">in</a>
            </div>
          </div>
        </div>
      </footer>
=======
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
>>>>>>> shortorigin/main

      <style jsx>{`
        .fade-in {
          opacity: 0;
<<<<<<< HEAD
          transform: translateY(30px);
          transition: all 0.6s ease;
=======
          transform: translateY(20px);
          transition: opacity 0.6s ease, transform 0.6s ease;
>>>>>>> shortorigin/main
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
