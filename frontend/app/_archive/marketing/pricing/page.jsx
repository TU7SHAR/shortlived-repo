"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { siteConfig } from "@/app/utils/config";

const MARKETING_URL = "https://salesji.com";

const plans = [
  {
    name: "Starter",
    monthly: 49,
    annual: 39,
    annualSavings: "$120/yr",
    desc: "Perfect for small SME sales teams getting started with AI-powered enablement.",
    popular: false,
    features: [
      { text: "Up to 5 sales reps", included: true },
      { text: "WhatsApp bot + Web app chat", included: true },
      { text: "1 knowledge base (500 items)", included: true },
      { text: "Objection handling library", included: true },
      { text: "Basic script generation", included: true },
      { text: "Asset retrieval", included: true },
      { text: "Telegram integration", included: false },
      { text: "Competitive battlecards", included: false },
      { text: "Analytics dashboard", included: false },
    ],
    cta: "Get Started",
    ctaStyle: "outline",
  },
  {
    name: "Growth",
    monthly: 149,
    annual: 119,
    annualSavings: "$360/yr",
    desc: "For growing teams that need competitive intelligence and personalised scripts.",
    popular: true,
    features: [
      { text: "Up to 25 sales reps", included: true },
      { text: "WhatsApp + Telegram + Web app", included: true },
      { text: "3 knowledge bases (2,000 items each)", included: true },
      { text: "Full objection playbooks", included: true },
      { text: "Personalised script generation", included: true },
      { text: "Asset retrieval + smart search", included: true },
      { text: "Competitive battlecards (up to 10)", included: true },
      { text: "Usage analytics dashboard", included: true },
      { text: "Custom AI personality", included: false },
    ],
    cta: "Book a Demo",
    ctaStyle: "primary",
  },
  {
    name: "Enterprise",
    monthly: null,
    annual: null,
    annualSavings: null,
    desc: "Full-featured, white-glove deployment for large enterprise sales organisations.",
    popular: false,
    features: [
      { text: "Unlimited sales reps", included: true },
      { text: "WhatsApp + Telegram + Web app + API", included: true },
      { text: "Unlimited knowledge bases", included: true },
      { text: "Custom AI personality & tone", included: true },
      { text: "Advanced script personalisation", included: true },
      { text: "Unlimited competitive battlecards", included: true },
      { text: "Advanced analytics & reporting", included: true },
      { text: "SSO / SAML + enterprise security", included: true },
      { text: "Dedicated CSM + SLA support", included: true },
    ],
    cta: "Contact Sales",
    ctaStyle: "outline",
  },
];

const faqs = [
  { q: "How does the 14-day pilot work?", a: "You get full access to your chosen plan for 14 days, no credit card required. We help you set up your knowledge base and get your first reps using it. If it's not delivering value, you pay nothing." },
  { q: "How long does setup take?", a: "Most teams are live within 30 minutes. You upload your product information and collaterals via our admin portal, and Salesji starts working immediately." },
  { q: "Can we update our knowledge base at any time?", a: "Absolutely. Sales managers can update pricing, objection responses, competitive positioning and collaterals at any time via the admin portal. Changes propagate to all reps instantly." },
  { q: "Is our proprietary data secure?", a: "Yes. All data is encrypted at rest and in transit. Your knowledge base is private to your organisation and never used to train shared models. Enterprise plans include additional security controls." },
  { q: "Do we need to install anything?", a: "No. Salesji runs as a WhatsApp or Telegram bot. Your reps add the Salesji number and start messaging immediately. No app downloads, no browser extensions required." },
  { q: "What if we need more reps than the plan allows?", a: "You can upgrade between plans at any time, and the pricing difference is prorated. Enterprise plans offer unlimited users — contact our sales team for a custom quote." },
];

const comparisonData = [
  { section: "Team & Usage" },
  { feature: "Sales reps included", starter: "Up to 5", growth: "Up to 25", enterprise: "Unlimited" },
  { feature: "Knowledge base items", starter: "500", growth: "6,000", enterprise: "Unlimited" },
  { feature: "Monthly queries", starter: "2,000", growth: "20,000", enterprise: "Unlimited" },
  { section: "Channels" },
  { feature: "WhatsApp bot", starter: true, growth: true, enterprise: true },
  { feature: "Telegram bot", starter: false, growth: true, enterprise: true },
  { feature: "Web app chat", starter: true, growth: true, enterprise: true },
  { feature: "REST API access", starter: false, growth: false, enterprise: true },
  { section: "AI Features" },
  { feature: "Objection handling", starter: true, growth: true, enterprise: true },
  { feature: "Sales script generation", starter: "Basic", growth: "Personalised", enterprise: "Advanced + custom tone" },
  { feature: "Personalisation by persona", starter: false, growth: true, enterprise: true },
  { feature: "Competitive battlecards", starter: false, growth: "Up to 10", enterprise: "Unlimited" },
  { feature: "Smart asset retrieval", starter: true, growth: true, enterprise: true },
  { feature: "Custom AI personality", starter: false, growth: false, enterprise: true },
  { section: "Management & Security" },
  { feature: "Manager control centre", starter: true, growth: true, enterprise: true },
  { feature: "Usage analytics", starter: false, growth: true, enterprise: "Advanced" },
  { feature: "SSO / SAML", starter: false, growth: false, enterprise: true },
  { feature: "Dedicated CSM", starter: false, growth: false, enterprise: true },
  { feature: "SLA guarantee", starter: false, growth: false, enterprise: true },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    document.title = `Pricing — ${siteConfig.name}`;
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
    document.querySelectorAll(".fade-in").forEach((el) => observerRef.current.observe(el));
    return () => observerRef.current?.disconnect();
  }, []);

  const renderCell = (val) => {
    if (val === true) return <span className="text-[#1D4ED8] text-lg">✓</span>;
    if (val === false) return <span className="text-[#CBD5E1] text-lg">—</span>;
    return <span className="text-sm text-[#334155]">{val}</span>;
  };

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      {/* Hero */}
      <section className="pt-[140px] pb-20 bg-gradient-to-br from-[#EFF6FF] via-[#F0F9FF] to-white text-center px-6">
        <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#1D4ED8] mb-3.5">Pricing</p>
        <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-extrabold leading-[1.12] tracking-tight text-[#0A1628] mb-4">
          Simple pricing for<br />
          <span className="bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] bg-clip-text text-transparent">teams of every size.</span>
        </h1>
        <p className="text-lg text-[#64748B] max-w-[560px] mx-auto mb-6 leading-relaxed font-light">
          No hidden fees. No per-message charges. One flat monthly price per plan — and your whole team benefits.
        </p>
        <div className="flex items-center justify-center gap-3">
          <div className="inline-flex bg-[#F1F5F9] rounded-full p-1">
            <button onClick={() => setIsAnnual(false)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${!isAnnual ? "bg-white text-[#0A1628] shadow-sm" : "text-[#64748B]"}`}>Monthly</button>
            <button onClick={() => setIsAnnual(true)} className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${isAnnual ? "bg-white text-[#0A1628] shadow-sm" : "text-[#64748B]"}`}>Annual</button>
          </div>
          <span className="inline-flex items-center gap-1.5 bg-[#F0FDF4] text-[#16A34A] text-xs font-bold px-3 py-1 rounded-full">🎉 Save 20%</span>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="fade-in grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {plans.map((plan, idx) => (
              <div key={idx} className={`relative bg-white border rounded-[20px] p-9 transition-all hover:shadow-[0_16px_48px_rgba(10,22,40,0.16)] hover:-translate-y-1 ${plan.popular ? "border-[#1D4ED8] md:scale-[1.03]" : "border-[#F1F5F9]"}`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-[#1D4ED8] to-[#06B6D4] text-white text-[0.75rem] font-bold px-4 py-1 rounded-full uppercase tracking-wider whitespace-nowrap">Most Popular</div>
                )}
                <p className={`text-xs font-bold tracking-[0.08em] uppercase mb-2 ${plan.popular ? "text-[#1D4ED8]" : "text-[#64748B]"}`}>{plan.name}</p>
                <div className="mb-2">
                  {plan.monthly ? (
                    <span className="font-display text-5xl font-extrabold text-[#0A1628] tracking-tight">
                      <sup className="text-xl align-super">$</sup>{isAnnual ? plan.annual : plan.monthly}
                      <span className="text-[0.85rem] font-normal text-[#64748B]"> / month</span>
                    </span>
                  ) : (
                    <span className="font-display text-[2.2rem] font-extrabold text-[#0A1628]">Custom</span>
                  )}
                </div>
                {plan.annualSavings && (
                  <p className={`text-xs font-semibold text-[#16A34A] mb-4 ${isAnnual ? "visible" : "invisible"}`}>
                    Billed annually — save {plan.annualSavings}
                  </p>
                )}
                {!plan.annualSavings && <p className="text-xs invisible mb-4">placeholder</p>}
                <p className="text-sm text-[#64748B] leading-relaxed mb-6 pb-6 border-b border-[#F1F5F9]">{plan.desc}</p>
                <ul className="flex flex-col gap-3 mb-7">
                  {plan.features.map((f, i) => (
                    <li key={i} className={`flex items-start gap-2.5 text-sm ${f.included ? "text-[#334155]" : "text-[#CBD5E1]"}`}>
                      <span className={`w-[18px] h-[18px] rounded-full flex items-center justify-center text-[0.65rem] font-bold shrink-0 mt-0.5 ${f.included ? "bg-[#EFF6FF] text-[#1D4ED8]" : "bg-[#F1F5F9] text-[#CBD5E1]"}`}>
                        {f.included ? "✓" : "✗"}
                      </span>
                      {f.text}
                    </li>
                  ))}
                </ul>
                <Link
                  href={`${MARKETING_URL}/contact.html`}
                  className={`block w-full text-center py-3.5 rounded-[10px] text-[0.95rem] font-semibold transition-all ${
                    plan.ctaStyle === "primary"
                      ? "bg-[#1D4ED8] text-white shadow-[0_3px_12px_rgba(29,78,216,0.3)] hover:bg-[#1a44b8] hover:shadow-[0_6px_20px_rgba(29,78,216,0.4)] hover:-translate-y-0.5"
                      : "bg-white text-[#0A1628] border-[1.5px] border-[#CBD5E1] hover:border-[#1D4ED8] hover:text-[#1D4ED8]"
                  }`}
                >
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center mt-8 text-sm text-[#64748B]">
            All plans include a <strong>14-day free pilot</strong> · No credit card required · Cancel anytime
          </p>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 px-6 bg-[#F8FAFC]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12 fade-in">
            <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#1D4ED8] mb-3">Detailed Comparison</p>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-[#0A1628]">What&apos;s included in each plan.</h2>
          </div>
          <div className="fade-in overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-2xl overflow-hidden shadow-[0_4px_24px_rgba(10,22,40,0.10)] min-w-[600px]">
              <thead className="bg-[#0A1628]">
                <tr>
                  <th className="px-6 py-5 text-left font-display font-bold text-sm text-white">Feature</th>
                  <th className="px-6 py-5 text-center font-display font-bold text-sm text-white">Starter</th>
                  <th className="px-6 py-5 text-center font-display font-bold text-sm text-white">Growth</th>
                  <th className="px-6 py-5 text-center font-display font-bold text-sm text-white">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((row, idx) => {
                  if (row.section) {
                    return (
                      <tr key={idx} className="bg-[#F8FAFC]">
                        <td colSpan={4} className="px-6 py-3 font-display font-bold text-xs text-[#64748B] uppercase tracking-wider">{row.section}</td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={idx} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors">
                      <td className="px-6 py-3.5 text-sm text-[#334155]">{row.feature}</td>
                      <td className="px-6 py-3.5 text-center">{renderCell(row.starter)}</td>
                      <td className="px-6 py-3.5 text-center">{renderCell(row.growth)}</td>
                      <td className="px-6 py-3.5 text-center">{renderCell(row.enterprise)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-12 fade-in">
            <p className="text-xs font-bold tracking-[0.1em] uppercase text-[#1D4ED8] mb-3">Common Questions</p>
            <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-[#0A1628]">Frequently asked questions.</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {faqs.map((faq, idx) => (
              <div key={idx} className="fade-in bg-[#F8FAFC] border border-[#F1F5F9] rounded-xl p-6">
                <h3 className="font-display text-[0.95rem] font-bold text-[#0A1628] mb-2.5">{faq.q}</h3>
                <p className="text-sm text-[#64748B] leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-[#1D4ED8] via-[#1e40af] to-[#0A1628] relative overflow-hidden">
        <div className="absolute top-[-150px] right-[-150px] w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(255,255,255,0.08)_0%,transparent_70%)]" />
        <div className="max-w-[720px] mx-auto text-center relative z-10">
          <h2 className="font-display text-[clamp(1.6rem,3vw,2.2rem)] font-extrabold text-white mb-4">Not sure which plan?<br />Let&apos;s talk.</h2>
          <p className="text-lg text-white/75 mb-9">Our team will assess your team size, use cases and goals, and recommend the right plan.</p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <a href={`${MARKETING_URL}/contact.html`} className="inline-flex items-center gap-2 bg-white text-[#1D4ED8] px-8 py-3.5 rounded-[11px] text-base font-bold shadow-[0_4px_16px_rgba(0,0,0,0.2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition-all">Book a Free Demo →</a>
            <a href={`${MARKETING_URL}/contact.html`} className="inline-flex items-center gap-2 bg-transparent text-white border-[1.5px] border-white/40 px-7 py-3.5 rounded-[11px] text-base font-semibold hover:border-white hover:bg-white/10 transition-all">Talk to Sales</a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0A1628] text-white/60 py-16 px-6">
        <div className="max-w-[1200px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div>
              <a href={MARKETING_URL} className="flex items-center gap-2.5 mb-3.5">
                <div className="w-8 h-8 bg-[#1D4ED8] rounded-lg flex items-center justify-center font-display font-extrabold text-white text-xs">SJ</div>
                <span className="font-display font-extrabold text-lg text-white tracking-tight">Sales<span className="text-[#3B82F6]">ji</span></span>
              </a>
              <p className="text-sm leading-relaxed max-w-[260px]">AI-powered sales enablement for enterprise and SME teams.</p>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-4">Product</h4>
              <ul className="flex flex-col gap-2.5"><li><a href={`${MARKETING_URL}/features.html`} className="text-sm text-white/50 hover:text-white transition-colors">Features</a></li><li><Link href="/pricing" className="text-sm text-white/50 hover:text-white transition-colors">Pricing</Link></li><li><a href={`${MARKETING_URL}/contact.html`} className="text-sm text-white/50 hover:text-white transition-colors">Book a Demo</a></li></ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-4">Company</h4>
              <ul className="flex flex-col gap-2.5"><li><a href={MARKETING_URL} className="text-sm text-white/50 hover:text-white transition-colors">About</a></li><li><a href={`${MARKETING_URL}/contact.html`} className="text-sm text-white/50 hover:text-white transition-colors">Contact</a></li></ul>
            </div>
            <div>
              <h4 className="font-display font-bold text-sm text-white mb-4">Legal</h4>
              <ul className="flex flex-col gap-2.5"><li><Link href="/privacy" className="text-sm text-white/50 hover:text-white transition-colors">Privacy Policy</Link></li><li><Link href="/terms" className="text-sm text-white/50 hover:text-white transition-colors">Terms of Service</Link></li><li><Link href="/refunds" className="text-sm text-white/50 hover:text-white transition-colors">Refund Policy</Link></li></ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <p>&copy; 2025 Salesji. All rights reserved. · A venture of <a href="https://essenn.associates" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors">ESS ENN Associates</a></p>
            <div className="flex gap-4"><a href="#" className="text-white/40 hover:text-white transition-colors">LinkedIn</a><a href="#" className="text-white/40 hover:text-white transition-colors">Twitter</a></div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        .fade-in { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .fade-in.visible { opacity: 1; transform: translateY(0); }
      `}</style>
    </div>
  );
}
