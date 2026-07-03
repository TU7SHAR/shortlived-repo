"use client";

import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Navbar from "../components/landing/Navbar";
import { Shield, Users, Target } from "lucide-react";
import LiquidSilkShader from "../components/landing/Dashboard/LiquidSilkShader";
import { siteConfig } from "@/app/utils/config";

export default function AboutPage() {
  const container = useRef(null);

  useEffect(() => {
    document.title = `About Us | ${siteConfig.name}`;
  }, []);

  useGSAP(
    () => {
      gsap.from(".about-header", {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: "power4.out",
      });

      gsap.from(".about-card", {
        y: 40,
        opacity: 0,
        stagger: 0.2,
        duration: 0.8,
        delay: 0.3,
        ease: "power2.out",
      });
    },
    { scope: container },
  );

  return (
    <div ref={container} className="bg-black text-white min-h-screen">
      <LiquidSilkShader />
      <Navbar />

      <main className="pt-40 px-6 max-w-7xl mx-auto pb-20">
        <div className="about-header max-w-3xl mb-24">
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 italic">
            The Mission.
          </h1>
          <p className="text-xl text-zinc-400 font-medium leading-relaxed">
            We didn't set out to build just another CRM. We built a system that
            thinks, acts, and scales like your best sales rep—without the
            burnout. High-performance AI for high-performance teams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Shield size={32} />,
              title: "Integrity First",
              desc: "No black-box AI. We prioritize transparency in every outreach and automation logic.",
            },
            {
              icon: <Users size={32} />,
              title: "Human Centric",
              desc: "Our tools are designed to augment human potential, not replace the human touch in sales.",
            },
            {
              icon: <Target size={32} />,
              title: "Ruthless Accuracy",
              desc: "Precision isn't a goal; it's our baseline. We optimize for high-intent engagement only.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="about-card bg-zinc-900/50 border border-white/5 p-10 rounded-[2.5rem] hover:bg-zinc-900 transition-colors"
            >
              <div className="text-white mb-6">{item.icon}</div>
              <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
              <p className="text-zinc-500 font-medium leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
