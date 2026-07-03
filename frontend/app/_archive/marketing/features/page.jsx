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
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
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
        </div>
      </section>


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
              </div>
            ))}
          </div>
        </div>
      </section>

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

      <style jsx>{`
        .fade-in {
          opacity: 0;
          transform: translateY(30px);
          transition: all 0.6s ease;
        }
        .fade-in.visible {
          opacity: 1;
          transform: translateY(0);
        }
      `}</style>
    </div>
  );
}
