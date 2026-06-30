"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Navbar from "../components/landing/Navbar";
import { siteConfig } from "@/app/utils/config";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    teamSize: "",
    role: "",
    platform: "",
    message: "",
    consent: false,
  });
  const [status, setStatus] = useState("idle");
  const observerRef = useRef(null);

  useEffect(() => {
    document.title = `Book a Demo — ${siteConfig.name} AI Sales Assistant`;
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


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    // Clear error state on input
    if (status === "error") setStatus("idle");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!formData.firstName || !formData.email || !formData.company) {
      setStatus("error");
      return;
    }
    if (!formData.consent) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    try {
      const res = await fetch("https://formspree.io/f/xkovkwzl", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          company: formData.company,
          teamSize: formData.teamSize,
          role: formData.role,
          platform: formData.platform,
          message: formData.message,
        }),
      });
      if (res.ok) {
        setStatus("success");
        // GA conversion event
        if (typeof window !== "undefined" && window.gtag) {
          window.gtag("event", "conversion", {
            send_to: "G-FZVTX9YWVY/demo_request",
          });
        }
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };


  const demoPoints = [
    "Personalised to your business",
    "30 minutes",
    "Free 14-day pilot",
    "WhatsApp / Telegram / Web App",
  ];

  const trustItems = [
    "Enterprise-grade security",
    "Setup in 30 minutes",
    "14-day free pilot",
    "No credit card required",
    "Used in 15+ countries",
  ];

  if (status === "success") {
    return (
      <div className="bg-white text-grey-800 min-h-screen font-body">
        <Navbar />
        <div className="pt-40 pb-24 flex flex-col items-center justify-center text-center px-6">
          <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center mb-6">
            <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-4xl font-bold text-navy mb-4">Demo Request Received!</h1>
          <p className="text-lg text-grey-500 max-w-md">
            Thank you for your interest in Salesji. Our team will reach out within 24 hours to schedule your personalised demo.
          </p>
        </div>
      </div>
    );
  }


  return (
    <div className="bg-white text-grey-800 min-h-screen font-body">
      <Navbar />

      {/* Split Layout */}
      <section className="pt-24 md:pt-0 min-h-screen grid grid-cols-1 md:grid-cols-2">
        {/* Left Panel */}
        <div className="bg-gradient-to-br from-navy via-[#1a2744] to-[#0f2040] text-white p-10 md:p-16 flex flex-col justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_80%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-block bg-primary-bright/15 text-primary-bright px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide uppercase mb-6">
              Book a Free Demo
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
              See Salesji work with{" "}
              <span className="text-accent">your</span> products.
            </h1>
            <p className="text-grey-300 text-base leading-relaxed mb-10 max-w-md">
              Get a personalised walkthrough of how Salesji can transform your team&apos;s sales conversations with AI-powered scripts, objection handling, and more.
            </p>
            <div className="space-y-4 mb-12">
              {demoPoints.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                    <svg className="w-3.5 h-3.5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm text-grey-200">{point}</span>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <a href="mailto:hello@salesji.com" className="flex items-center gap-3 text-sm text-grey-300 hover:text-white transition-colors">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs">✉</span>
                hello@salesji.com
              </a>
              <a href="https://linkedin.com/company/salesji" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-grey-300 hover:text-white transition-colors">
                <span className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold">in</span>
                LinkedIn
              </a>
            </div>
          </div>
        </div>


        {/* Right Panel - Form */}
        <div className="bg-grey-50 p-10 md:p-16 flex items-center justify-center">
          <div className="w-full max-w-lg">
            <h2 className="font-display text-2xl font-bold text-navy mb-8">Request your demo</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-grey-600 mb-1.5">First name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="John"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-grey-600 mb-1.5">Last name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                    placeholder="Doe"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-grey-600 mb-1.5">Work email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="john@company.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-grey-600 mb-1.5">Company name *</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  placeholder="Acme Inc."
                />
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-grey-600 mb-1.5">Sales team size</label>
                  <select
                    name="teamSize"
                    value={formData.teamSize}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="1-5">1-5 reps</option>
                    <option value="6-15">6-15 reps</option>
                    <option value="16-50">16-50 reps</option>
                    <option value="50+">50+ reps</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-grey-600 mb-1.5">Role</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  >
                    <option value="">Select...</option>
                    <option value="Sales Manager">Sales Manager</option>
                    <option value="VP of Sales">VP of Sales</option>
                    <option value="Sales Rep">Sales Rep</option>
                    <option value="Founder/CEO">Founder/CEO</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-grey-600 mb-1.5">Preferred platform</label>
                <select
                  name="platform"
                  value={formData.platform}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                >
                  <option value="">Select...</option>
                  <option value="WhatsApp">WhatsApp</option>
                  <option value="Telegram">Telegram</option>
                  <option value="Web App">Web App</option>
                  <option value="All">All platforms</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-grey-600 mb-1.5">Message</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-4 py-3 rounded-lg border border-grey-200 bg-white text-sm text-grey-800 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all resize-none"
                  placeholder="Tell us about your sales process and what you're looking for..."
                />
              </div>


              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  name="consent"
                  checked={formData.consent}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 rounded border-grey-300 text-primary focus:ring-primary"
                />
                <label className="text-xs text-grey-500 leading-relaxed">
                  I agree to receive communications from Salesji. You can unsubscribe at any time. View our{" "}
                  <Link href="/privacy" className="text-primary underline">Privacy Policy</Link>.
                </label>
              </div>
              <button
                type="submit"
                disabled={status === "loading"}
                className={`w-full py-3.5 rounded-lg font-semibold text-base transition-all ${
                  status === "error"
                    ? "bg-red-500 text-white"
                    : "bg-primary text-white hover:bg-primary-bright hover:-translate-y-0.5"
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {status === "loading" ? "Submitting..." : status === "error" ? "Please fix errors above" : "Book My Free Demo →"}
              </button>
            </form>
          </div>
        </div>
      </section>


      {/* Trust Strip */}
      <section className="py-10 border-y border-grey-200 bg-white">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10">
            {trustItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm text-grey-600">
                <svg className="w-4 h-4 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                {item}
              </div>
            ))}
          </div>
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
