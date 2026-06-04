"use client";

import React, { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function ScrollToTop() {
  const buttonRef = useRef(null);
  const textRef = useRef(null);
  const arrowRef = useRef(null);
  const spinTween = useRef(null);

  useGSAP(
    () => {
      // Register ScrollTrigger for this component
      gsap.registerPlugin(ScrollTrigger);

      // 1. Set initial states
      gsap.set(arrowRef.current, { rotation: 45 });

      // Start the button completely hidden and scaled down
      gsap.set(buttonRef.current, { scale: 0, autoAlpha: 0 });

      // 2. Start the infinite text rotation
      spinTween.current = gsap.to(textRef.current, {
        rotation: "+=360",
        duration: 8,
        repeat: -1,
        ease: "none",
        transformOrigin: "center center",
      });

      // 3. The Visibility ScrollTrigger
      // Pops the button in after 100vh, and hides it if you scroll back to the top
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: "100vh top", // Triggers when the page has been scrolled exactly 100vh down
        onEnter: () => {
          gsap.to(buttonRef.current, {
            scale: 1,
            autoAlpha: 1, // autoAlpha handles both opacity and visibility
            duration: 0.5,
            ease: "back.out(1.5)",
            overwrite: "auto",
          });
        },
        onLeaveBack: () => {
          gsap.to(buttonRef.current, {
            scale: 0,
            autoAlpha: 0,
            duration: 0.4,
            ease: "power3.in",
            overwrite: "auto",
          });
        },
      });
    },
    { scope: buttonRef },
  );

  const handleMouseEnter = () => {
    gsap.to(arrowRef.current, {
      rotation: 0,
      duration: 0.5,
      ease: "back.out(1.5)",
      overwrite: "auto",
    });

    gsap.to(spinTween.current, {
      timeScale: 3.5,
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(buttonRef.current, {
      scale: 1.05,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const handleMouseLeave = () => {
    gsap.to(arrowRef.current, {
      rotation: 45,
      duration: 0.5,
      ease: "power3.out",
      overwrite: "auto",
    });

    gsap.to(spinTween.current, {
      timeScale: 1,
      duration: 0.5,
      ease: "power2.out",
    });

    gsap.to(buttonRef.current, {
      scale: 1,
      duration: 0.4,
      ease: "power3.out",
      overwrite: "auto",
    });
  };

  const handleClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      // Kept the fixed positioning because autoAlpha handles the hiding gracefully
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[90] w-20 h-20 md:w-32 md:h-32 bg-white text-black rounded-full flex items-center justify-center cursor-pointer shadow-2xl drop-shadow-2xl hover:bg-zinc-200 transition-colors invisible"
    >
      <div
        ref={textRef}
        className="absolute inset-0 w-full h-full p-1 md:p-1.5 pointer-events-none"
      >
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <path
            id="circlePath"
            d="M 50, 50 m -36, 0 a 36,36 0 1,1 72,0 a 36,36 0 1,1 -72,0"
            fill="none"
          />
          <text
            fontSize="10.5"
            fontWeight="900"
            letterSpacing="0.08em"
            fill="currentColor"
          >
            <textPath href="#circlePath" startOffset="0%">
              BACK TO TOP • SALESJI • AI-AGENT •
            </textPath>
          </text>
        </svg>
      </div>

      <div
        ref={arrowRef}
        className="flex items-center justify-center w-full h-full absolute inset-0 pointer-events-none"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="w-6 h-6 md:w-10 md:h-10"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 19V5M5 12l7-7 7 7"
          />
        </svg>
      </div>
    </button>
  );
}
