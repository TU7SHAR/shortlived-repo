"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../components/landing/Navbar";
import { siteConfig } from "@/app/utils/config";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);
  const observerRef = useRef(null);

  useEffect(() => {
    document.title = `Pricing — ${siteConfig.name} AI Sales Assistant`;
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("visible");
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".fade-in").forEach((el) => {
      observerRef.current.observe(el);
    });
    return () => observerRef.current?.disconnect();
  }, []);


  const plans = [
    {
      name: "Starter",
      monthly: 49,
      annual: 39,
      desc: "For small teams getting started with AI sales support.",
      features: [
        { text: "5 sales reps", included: true },
        { text: "WhatsApp + Web channels", included: true },
        { text: "1 Knowledge Base (500 items)", included: true },
        { text: "Objection handling", included: true },
        { text: "Basic scripts", included: true },
        { text: "Asset retrieval", included: true },
        { text: "Telegram integration", included: false },
        { text: "Competitive battlecards", included: false },
        { text: "Usage analytics", included: false },
      ],
      popular: false,
    },
    {
      name: "Growth",
      monthly: 149,
      annual: 119,
      desc: "For scaling teams that need full AI sales power.",
      features: [
        { text: "25 sales reps", included: true },
        { text: "WhatsApp + Telegram + Web", included: true },
        { text: "3 Knowledge Bases (2,000 items each)", included: true },
        { text: "Full playbooks", included: true },
        { text: "Personalised scripts", included: true },
        { text: "Smart search", included: true },
        { text: "10 battlecards", included: true },
        { text: "Usage analytics", included: true },
        { text: "Custom AI personality", included: false },
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      monthly: null,
      annual: null,
      desc: "Custom pricing for large organisations.",
      features: [
        { text: "Unlimited sales reps", included: true },
        { text: "All channels", included: true },
        { text: "Unlimited Knowledge Bases", included: true },
        { text: "API access", included: true },
        { text: "Custom AI personality", included: true },
        { text: "SSO / SAML", included: true },
        { text: "Dedicated CSM + SLA", included: true },
        { text: "Advanced analytics", included: true },
        { text: "Priority support", included: true },
      ],
      popular: false,
    },
  ];


  const comparisonData = [
    {
      category: "Team & Usage",
      rows: [
        { feature: "Sales reps", starter: "5", growth: "25", enterprise: "Unlimited" },
        { feature: "Knowledge Bases", starter: "1 (500 items)", growth: "3 (2,000 each)", enterprise: "Unlimited" },
        { feature: "Messages/month", starter: "5,000", growth: "50,000", enterprise: "Unlimited" },
      ],
    },
    {
      category: "Channels",
      rows: [
        { feature: "WhatsApp", starter: "✓", growth: "✓", enterprise: "✓" },
        { feature: "Telegram", starter: "—", growth: "✓", enterprise: "✓" },
        { feature: "Web App", starter: "✓", growth: "✓", enterprise: "✓" },
      ],
    },
    {
      category: "AI Features",
      rows: [
        { feature: "Objection handling", starter: "✓", growth: "✓", enterprise: "✓" },
        { feature: "Personalised scripts", starter: "Basic", growth: "Advanced", enterprise: "Custom" },
        { feature: "Battlecards", starter: "—", growth: "10", enterprise: "Unlimited" },
        { feature: "Smart asset retrieval", starter: "✓", growth: "✓", enterprise: "✓" },
        { feature: "Custom AI personality", starter: "—", growth: "—", enterprise: "✓" },
      ],
    },
    {
      category: "Management & Security",
      rows: [
        { feature: "Manager control centre", starter: "✓", growth: "✓", enterprise: "✓" },
        { feature: "Usage analytics", starter: "—", growth: "✓", enterprise: "Advanced" },
        { feature: "SSO / SAML", starter: "—", growth: "—", enterprise: "✓" },
        { feature: "Dedicated CSM", starter: "—", growth: "—", enterprise: "✓" },
        { feature: "SLA", starter: "—", growth: "—", enterprise: "99.9%" },
      ],
    },
  ];


  const faqs = [
    { q: "Is there a free trial?", a: "Yes! Every plan comes with a 14-day free pilot. No credit card required, and you can cancel anytime." },
    { q: "How long does setup take?", a: "Most teams are up and running in under 30 minutes. Our onboarding team will help configure your knowledge base and channels." },
    { q: "How do I update the knowledge base?", a: "Managers can upload, edit, and remove documents from the control centre at any time. Changes are reflected instantly for all reps." },
    { q: "How is my data secured?", a: "We use enterprise-grade encryption at rest and in transit, SOC 2 compliance, and offer SSO/SAML on Enterprise plans." },
    { q: "Do my reps need to install anything?", a: "No. Salesji works through WhatsApp, Telegram, and a web app — no downloads or installations needed." },
    { q: "What if I need more reps than my plan allows?", a: "You can upgrade your plan at any time, or contact us for custom Enterprise pricing to fit your team size." },
  ];

  return (
    <div className="bg-white text-grey-800 min-h-screen font-body">
      <Navbar />

      {/* Hero */}
      <section className="pt-40 pb-24 bg-gradient-to-br from-navy via-[#1a2744] to-[#0f2040] text-white text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(29,78,216,0.15),transparent_50%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <span className="inline-block bg-primary-bright/15 text-primary-bright px-5 py-2 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
            Pricing
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-extrabold mb-6 max-w-[800px] mx-auto leading-tight">
            Simple pricing for teams of{" "}
            <span className="bg-gradient-to-r from-primary-bright to-accent bg-clip-text text-transparent">
              every size.
            </span>
          </h1>


          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-1 bg-white/10 p-1 rounded-full border border-white/10 mb-4">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all ${
                !isAnnual ? "bg-white text-navy" : "text-grey-300 hover:text-white"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2.5 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                isAnnual ? "bg-white text-navy" : "text-grey-300 hover:text-white"
              }`}
            >
              Annual
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>
      </section>


      {/* Pricing Cards */}
      <section className="py-20 -mt-16">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, idx) => (
              <div
                key={idx}
                className={`fade-in relative bg-white rounded-2xl p-8 border transition-all hover:-translate-y-1 hover:shadow-lg ${
                  plan.popular
                    ? "border-primary border-2 shadow-xl scale-[1.02] z-10"
                    : "border-grey-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide">
                    Most Popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-navy mb-2">{plan.name}</h3>
                <p className="text-sm text-grey-500 mb-6 h-10">{plan.desc}</p>
                <div className="flex items-baseline gap-1 mb-8">
                  {plan.monthly !== null ? (
                    <>
                      <span className="font-display text-5xl font-extrabold text-navy">
                        ${isAnnual ? plan.annual : plan.monthly}
                      </span>
                      <span className="text-grey-500 font-medium">/mo</span>
                    </>
                  ) : (
                    <span className="font-display text-3xl font-extrabold text-navy">Custom</span>
                  )}
                </div>
                <Link
                  href="/contact"
                  className={`block w-full text-center py-3.5 rounded-lg font-semibold transition-all mb-8 ${
                    plan.popular
                      ? "bg-primary text-white hover:bg-primary-bright"
                      : "bg-grey-100 text-navy hover:bg-grey-200"
                  }`}
                >
                  {plan.monthly !== null ? "Start Free Pilot" : "Contact Sales"}
                </Link>
                <div className="space-y-3">
                  {plan.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {feat.included ? (
                        <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-grey-300 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`text-sm ${feat.included ? "text-grey-700" : "text-grey-400"}`}>
                        {feat.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-grey-500 mt-10">
            14-day free pilot &bull; No credit card required &bull; Cancel anytime
          </p>
        </div>
      </section>


      {/* Comparison Table */}
      <section className="py-20 bg-grey-50">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center mb-14">Compare plans in detail</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-grey-200">
                  <th className="text-left py-4 px-4 font-semibold text-grey-700 w-1/4">Feature</th>
                  <th className="text-center py-4 px-4 font-semibold text-grey-700">Starter</th>
                  <th className="text-center py-4 px-4 font-semibold text-primary">Growth</th>
                  <th className="text-center py-4 px-4 font-semibold text-grey-700">Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((section, sIdx) => (
                  <Fragment key={sIdx}>
                    <tr>
                      <td colSpan={4} className="pt-8 pb-3 px-4 font-display font-bold text-navy text-base">
                        {section.category}
                      </td>
                    </tr>
                    {section.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="border-b border-grey-100">
                        <td className="py-3 px-4 text-grey-700">{row.feature}</td>
                        <td className="py-3 px-4 text-center text-grey-600">{row.starter}</td>
                        <td className="py-3 px-4 text-center text-grey-600 font-medium">{row.growth}</td>
                        <td className="py-3 px-4 text-center text-grey-600">{row.enterprise}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>


      {/* FAQ */}
      <section className="py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-display text-3xl font-bold text-navy text-center mb-14">Frequently asked questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[900px] mx-auto">
            {faqs.map((faq, idx) => (
              <div key={idx} className="fade-in">
                <h3 className="font-display text-base font-semibold text-navy mb-2">{faq.q}</h3>
                <p className="text-sm text-grey-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-24 bg-gradient-to-r from-primary to-primary-bright text-white text-center">
        <div className="max-w-[1200px] mx-auto px-6">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Not sure which plan? Let&apos;s talk.</h2>
          <p className="text-lg opacity-90 mb-10">Our team will help you find the perfect fit for your sales organisation.</p>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-white text-primary px-8 py-3.5 rounded-lg text-base font-semibold hover:-translate-y-0.5 hover:shadow-lg transition-all"
          >
            Book a Demo
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center bg-transparent text-white border-2 border-white/40 px-8 py-3.5 rounded-lg text-base font-semibold hover:border-white hover:bg-white/10 transition-all ml-4"
          >
            Talk to Sales
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
