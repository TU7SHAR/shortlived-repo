"use client";

import React, { useRef, useLayoutEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollMarquee() {
  const containerRef = useRef(null);
  const textRef = useRef(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    let ctx = gsap.context(() => {
      // 1. THE CONSTANT MOTION LOOP
      const marqueeTween = gsap.to(textRef.current, {
        xPercent: -50,
        repeat: -1,
        duration: 60,
        ease: "linear",
      });

      // Advance the playhead so it never hits 0 and stops
      marqueeTween.totalTime(60 * 100);

      // FIX: Set the initial arrow rotation using GSAP, NOT Tailwind
      // 180 degrees points the arrow to the Left
      gsap.set(".dir-arrow", { rotation: 180 });

      let currentDirection = 1;

      // 2. THE SCROLL REVERSER & ARROW FLIPPER
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (self.direction !== currentDirection) {
            currentDirection = self.direction;

            // Reverse the marquee text direction
            gsap.to(marqueeTween, {
              timeScale: currentDirection,
              duration: 0.8,
              overwrite: true,
            });

            // Dynamically flip the arrows!
            // 180 points left, 0 points right
            gsap.to(".dir-arrow", {
              rotation: currentDirection === 1 ? 180 : 0,
              duration: 0.6,
              ease: "power3.inOut",
              overwrite: "auto", // Prevents freezing if user scrolls rapidly
            });
          }
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  const ArrowIcon = () => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      // REMOVED Tailwind's rotate-180. GSAP handles it now!
      className="dir-arrow w-12 h-12 md:w-20 md:h-20 flex-shrink-0"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
      />
    </svg>
  );

  return (
    <section
      ref={containerRef}
      className="relative w-full overflow-hidden bg-transparent text-white py-16 md:py-32 border-y border-white/10"
    >
      <div ref={textRef} className="flex items-center gap-8 md:gap-16 w-max">
        {[...Array(6)].map((_, i) => (
          <React.Fragment key={i}>
            <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter whitespace-nowrap drop-shadow-2xl">
              Empowering your sales force through intelligent automation
            </h2>
            <ArrowIcon />
          </React.Fragment>
        ))}
      </div>
    </section>
  );
}
