"use client";
import { useEffect, useState } from "react";

// Comprehensive SVG Icons Collection
const ICONS = [
  // Analytics & Charts
  {
    name: "bar-chart",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M3 3v18h18" />
        <path d="M18 17V9M13 17v-4m-5 4V5" />
      </svg>
    ),
    category: "data",
  },
  {
    name: "trending-up",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="23 6 23 12 17 12" />
      </svg>
    ),
    category: "data",
  },

  // Tech & Development
  {
    name: "code",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M16 18l6-6-6-6M8 6l-6 6 6 6" />
      </svg>
    ),
    category: "tech",
  },
  {
    name: "database",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M3 5c0 1.66 4 3 9 3s9-1.34 9-3M3 5v8c0 1.66 4 3 9 3s9-1.34 9-3V5M3 13c0 1.66 4 3 9 3s9-1.34 9-3" />
      </svg>
    ),
    category: "tech",
  },
  {
    name: "git-branch",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 0-9 9" />
      </svg>
    ),
    category: "tech",
  },

  // System & Connectivity
  {
    name: "server",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
        <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
        <line x1="6" y1="6" x2="6.01" y2="6" />
        <line x1="6" y1="18" x2="6.01" y2="18" />
      </svg>
    ),
    category: "system",
  },
  {
    name: "cloud",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
      </svg>
    ),
    category: "system",
  },
  {
    name: "wifi",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.94 0" />
        <line x1="12" y1="20" x2="12.01" y2="20" />
      </svg>
    ),
    category: "system",
  },

  // UI/UX & Design
  {
    name: "layout",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="3" x2="9" y2="21" />
      </svg>
    ),
    category: "design",
  },
  {
    name: "palette",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="13" cy="13" r="8" />
        <path d="M5.64 5.64a8 8 0 0 0 0 11.31" />
      </svg>
    ),
    category: "design",
  },
  {
    name: "square",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      </svg>
    ),
    category: "design",
  },

  // Business & Analytics
  {
    name: "target",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="12" r="5" />
        <circle cx="12" cy="12" r="9" />
      </svg>
    ),
    category: "business",
  },
  {
    name: "users",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
    category: "business",
  },
  {
    name: "briefcase",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    category: "business",
  },
  {
    name: "zap",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    ),
    category: "energy",
  },

  // Innovation & Advanced
  {
    name: "cpu",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
        <rect x="9" y="9" width="6" height="6" />
        <line x1="9" y1="1" x2="9" y2="4" />
        <line x1="15" y1="1" x2="15" y2="4" />
        <line x1="9" y1="20" x2="9" y2="23" />
        <line x1="15" y1="20" x2="15" y2="23" />
        <line x1="20" y1="9" x2="23" y2="9" />
        <line x1="20" y1="14" x2="23" y2="14" />
        <line x1="1" y1="9" x2="4" y2="9" />
        <line x1="1" y1="14" x2="4" y2="14" />
      </svg>
    ),
    category: "tech",
  },
  {
    name: "shield",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    category: "security",
  },

  // Creative & Fun
  {
    name: "star",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <polygon points="12 2 15.09 10.26 23.77 10.5 17.94 16.93 20.16 25.5 12 20.13 3.84 25.5 6.06 16.93 .23 10.5 8.91 10.26 12 2" />
      </svg>
    ),
    category: "premium",
  },
  {
    name: "heart",
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
    category: "premium",
  },
];

// Generate random positioned icons with varied animations
function generateRandomIcons(count = 20, sidebarWidth = 0) {
  return Array.from({ length: count }, (_, i) => {
    const randomIcon = ICONS[Math.floor(Math.random() * ICONS.length)];

    // Ensure icons don't overlap with sidebar area
    const minLeft = (sidebarWidth / window.innerWidth) * 100 + 5;
    const randomLeft = minLeft + Math.random() * (90 - minLeft);
    const randomTop = Math.random() * 95;

    const randomDelay = Math.random() * 3;
    const randomDuration = 6 + Math.random() * 4;
    const randomOpacity = 0.08 + Math.random() * 0.08;
    const randomSize = 12 + Math.random() * 20; // Smaller: 12-32px
    const animationType = ["float-fade", "drift-fade", "spin-fade"][
      Math.floor(Math.random() * 3)
    ];

    return {
      id: i,
      icon: randomIcon.svg,
      top: randomTop,
      left: randomLeft,
      delay: randomDelay,
      duration: randomDuration,
      opacity: randomOpacity,
      size: randomSize,
      animation: animationType,
      category: randomIcon.category,
    };
  });
}

export default function DecorativeIconBackground({ variant = "premium" }) {
  const [icons, setIcons] = useState([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Generate icons accounting for sidebar on desktop
    const sidebarWidth = window.innerWidth > 768 ? 280 : 0;
    setIcons(generateRandomIcons(22, sidebarWidth));

    // Regenerate on window resize
    const handleResize = () => {
      const newSidebarWidth = window.innerWidth > 768 ? 280 : 0;
      setIcons(generateRandomIcons(22, newSidebarWidth));
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!isMounted) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {/* Gradient overlay for premium feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-zinc-50/30 to-transparent opacity-40" />

      {/* Icons container */}
      {icons.map((item) => (
        <div
          key={item.id}
          className={`absolute animate-${item.animation}`}
          style={{
            top: `${item.top}%`,
            left: `${item.left}%`,
            opacity: 1,
            width: `${item.size}px`,
            height: `${item.size}px`,
            color: "#000000",
            animation: `${item.animation} ${item.duration}s ease-in-out ${item.delay}s infinite`,
            transform: "translate(-50%, -50%)",
            filter: "drop-shadow(0 0 1px rgba(0,0,0,0.05))",
          }}
        >
          {item.icon}
        </div>
      ))}

      <style>{`
        /* Float with fade in/out */
        @keyframes float-fade {
          0% {
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.08;
          }
          50% {
            transform: translate(-50%, -50%) translateY(-15px) rotate(2deg);
            opacity: 0.12;
          }
          85% {
            opacity: 0.08;
          }
          100% {
            transform: translate(-50%, -50%) translateY(0px) rotate(0deg);
            opacity: 0;
          }
        }

        /* Drift with fade in/out */
        @keyframes drift-fade {
          0% {
            transform: translate(-50%, -50%) translateX(0px);
            opacity: 0;
          }
          15% {
            opacity: 0.08;
          }
          50% {
            transform: translate(-50%, -50%) translateX(12px);
            opacity: 0.14;
          }
          85% {
            opacity: 0.08;
          }
          100% {
            transform: translate(-50%, -50%) translateX(0px);
            opacity: 0;
          }
        }

        /* Spin with fade in/out */
        @keyframes spin-fade {
          0% {
            transform: translate(-50%, -50%) rotate(0deg);
            opacity: 0;
          }
          15% {
            opacity: 0.08;
          }
          50% {
            transform: translate(-50%, -50%) rotate(180deg) translateY(-10px);
            opacity: 0.13;
          }
          85% {
            opacity: 0.08;
          }
          100% {
            transform: translate(-50%, -50%) rotate(360deg);
            opacity: 0;
          }
        }

        /* Utility classes for animations */
        .animate-float-fade {
          animation: float-fade var(--duration, 6s) ease-in-out infinite;
        }

        .animate-drift-fade {
          animation: drift-fade var(--duration, 6s) ease-in-out infinite;
        }

        .animate-spin-fade {
          animation: spin-fade var(--duration, 6s) ease-in-out infinite;
        }

        /* Mobile optimization */
        @media (max-width: 768px) {
          .animate-float-fade,
          .animate-drift-fade,
          .animate-spin-fade {
            animation-duration: calc(var(--duration, 6s) * 1.2);
          }
        }
      `}</style>
    </div>
  );
}
