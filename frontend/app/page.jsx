"use client";

import dynamic from "next/dynamic";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Navbar from "./components/landing/Navbar";
import { landingConfig, siteConfig } from "./utils/config";
import { ArrowRight, Zap, Target, BarChart3, Shield } from "lucide-react";
import Link from "next/link";
import RibbonShader from "./components/landing/Dashboard/RibbonShader";
import ScrollMarquee from "./components/landing/ScrollMarquee";
import ShutterIntro from "./components/landing/ShutterIntro";
import ScrollToTop from "./components/landing/ScrollToTop";
import Footer from "./components/landing/Footer";
// import PortalShader from "./components/landing/PortalShader";

const PortalShader = dynamic(
  () => import("./components/landing/Dashboard/PortalShader"),
  {
    ssr: false, // This is the magic line that fixes the blank screen
  },
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function HomePage() {
  const container = useRef(null);

  useGSAP(
    () => {
      const tl = gsap.timeline();

      tl.from(".hero-title", {
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
        delay: 2.9,
      })
        .from(
          ".hero-sub",
          {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
          },
          "-=0.6",
        )
        .from(
          ".hero-btn",
          {
            scale: 0.8,
            opacity: 0,
            duration: 0.5,
            ease: "back.out(1.7)",
          },
          "-=0.4",
        );

      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: ".features-grid",
          start: "top 80%",
        },
        y: 60,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        ease: "power2.out",
      });
    },
    { scope: container },
  );

  return (
    <div
      ref={container}
      className="bg-black text-white min-h-screen selection:bg-white selection:text-black relative"
    >
      {/* Isolated Shader Background */}
      <ShutterIntro />
      <RibbonShader />
      <div className="relative z-10">
        <Navbar />

        <main>
          <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 sm:px-6 overflow-hidden pt-28 pb-16 md:pt-20 md:pb-0">
            <div className="relative z-10 w-full max-w-4xl mx-auto">
              {/* Responsive scaling for the massive title */}
              <h1 className="hero-title text-5xl sm:text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] md:leading-[0.9] mb-6 md:mb-8 uppercase italic break-words">
                {landingConfig?.heroTitle || "Supercharge Your Sales Team"}
              </h1>

              <p className="hero-sub text-base sm:text-lg md:text-xl text-zinc-400 font-medium max-w-2xl mx-auto mb-10 md:mb-12 px-2">
                {landingConfig?.heroSubtitle ||
                  "The all-in-one platform for automated outreach, engagement tracking, and intelligent sales optimization."}
              </p>

              {/* Buttons stack vertically on mobile, row on desktop */}
              <div className="hero-btn flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md sm:max-w-none mx-auto">
                <Link
                  href="/login"
                  className="w-full sm:w-auto group bg-white text-black px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                >
                  Get Started Free{" "}
                  <ArrowRight
                    size={20}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
                <button className="w-full sm:w-auto px-6 sm:px-8 py-4 rounded-2xl font-bold text-base sm:text-lg border border-white/10 hover:bg-white/5 transition-all backdrop-blur-sm">
                  View Demo
                </button>
              </div>
            </div>
          </section>
          <ScrollMarquee />
          <section className="py-20 md:py-32 px-4 sm:px-6 max-w-7xl mx-auto relative z-10">
            <div className="mb-12 md:mb-20 text-center md:text-left">
              <h2 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4">
                Engineered for growth.
              </h2>
              <p className="text-zinc-500 text-base sm:text-lg max-w-xl mx-auto md:mx-0">
                Every tool you need to dominate the sales cycle, powered by
                custom-trained AI models.
              </p>
            </div>

            <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              {/* Responsive padding: p-6 on mobile, p-10 on desktop */}
              <div className="feature-card md:col-span-2 bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] relative overflow-hidden group hover:border-white/30 transition-colors duration-500">
                <div className="relative z-10">
                  <Target className="text-white mb-4 md:mb-6" size={32} />
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">
                    Precision Targeting
                  </h3>
                  <p className="text-zinc-400 text-base sm:text-lg max-w-md">
                    Our AI analyzes thousands of data points to find your ideal
                    customer profile with 98% accuracy.
                  </p>
                </div>
                <div className="absolute right-0 bottom-0 w-48 h-48 md:w-64 md:h-64 bg-white/5 blur-[80px] md:blur-[100px] group-hover:bg-white/10 transition-all duration-700" />
              </div>

              <div className="feature-card bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] group hover:border-white/20 transition-colors duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <Zap className="text-white mb-4 md:mb-6" size={32} />
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">
                    Instant Setup
                  </h3>
                  <p className="text-zinc-400 text-sm sm:text-base">
                    Deploy your first sales bot in under 5 minutes with our
                    pre-built workflow templates.
                  </p>
                </div>
              </div>

              <div className="feature-card bg-zinc-900/80 backdrop-blur-xl border border-white/10 p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] group hover:border-white/20 transition-colors duration-500 relative overflow-hidden">
                <div className="relative z-10">
                  <BarChart3 className="text-zinc-400 mb-4 md:mb-6" size={32} />
                  <h3 className="text-2xl sm:text-3xl font-bold mb-3 md:mb-4">
                    Live Insights
                  </h3>
                  <p className="text-zinc-400 text-sm sm:text-base">
                    Real-time engagement tracking that tells you exactly when to
                    pick up the phone.
                  </p>
                </div>
              </div>

              <div className="feature-card md:col-span-2 bg-white/95 backdrop-blur-xl text-black p-6 sm:p-8 md:p-10 rounded-3xl md:rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
                <div className="max-w-md text-center md:text-left w-full">
                  <h3 className="text-2xl sm:text-3xl font-black mb-3 md:mb-4 uppercase italic tracking-tighter">
                    Ready to scale?
                  </h3>
                  <p className="font-medium opacity-70 mb-6 md:mb-8 text-sm sm:text-base">
                    Join high-performance teams using{" "}
                    {siteConfig?.name || "SalesJi"} to automate their
                    top-of-funnel.
                  </p>
                  <Link
                    href="/login"
                    className="inline-flex w-full sm:w-auto items-center justify-center bg-black text-white px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl font-bold hover:bg-zinc-800 transition-colors"
                  >
                    Start Free Trial
                  </Link>
                </div>
              </div>
            </div>
            <ScrollToTop />
          </section>
        </main>

        <Footer siteConfig={{ name: "SalesJi", version: "1.0.0" }} />
      </div>
    </div>
  );
}
