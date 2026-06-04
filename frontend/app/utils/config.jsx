export const llmPricing = {
  INPUT_PRICE: 0.5,
  OUTPUT_PRICE: 1.5,
};

export const subscriptionPlans = {
  STARTER: {
    id: "starter",
    name: "Starter",
    description: "Perfect for trying out the AI capabilities.",
    monthlyPrice: 0,
    annualPrice: 0,
    limits: { teamMembers: 1, apiQueriesPerMonth: 1000 },
    features: [
      "1 Team Member",
      "1,000 API Queries / mo",
      "Basic Models (LLaMA 3)",
      "Community Support",
    ],
  },
  PROFESSIONAL: {
    id: "professional",
    name: "Professional",
    description: "For scaling sales teams and managers.",
    monthlyPrice: 59,
    annualPrice: 49,
    limits: { teamMembers: 50, apiQueriesPerMonth: 50000 },
    features: [
      "Up to 50 Team Members",
      "50,000 API Queries / mo",
      "Premium Models (Gemini 1.5)",
      "Priority Email Support",
    ],
  },
  ENTERPRISE: {
    id: "enterprise",
    name: "Enterprise",
    description: "Custom limits and dedicated infrastructure.",
    monthlyPrice: 249,
    annualPrice: 199,
    limits: { teamMembers: "Unlimited", apiQueriesPerMonth: "Unlimited" },
    features: [
      "Unlimited Team Members",
      "Unlimited API Queries",
      "Custom Fine-Tuned Models",
      "24/7 Dedicated Support & SLA",
    ],
  },
};

export const landingConfig = {
  heroTitle: "Supercharge Your Sales Team with AI",
  heroSubtitle:
    "The all-in-one platform for automated outreach, engagement tracking, and intelligent sales optimization.",
  features: [
    {
      title: "AI Outreach",
      desc: "Personalized messages that actually convert.",
    },
    {
      title: "Live Analytics",
      desc: "Track every click and engagement in real-time.",
    },
    {
      title: "Smart Routing",
      desc: "Automated lead distribution for maximum efficiency.",
    },
  ],
};

export const siteConfig = {
  name: "SALESJI",
  tagline: "AI Telegram Bot Workspace",
  description:
    "Advanced onboarding, tracking, and training matrix for Telegram user management. Optimize your team workflows.",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  version: "1.0.0",

  pages: {
    dashboard: {
      title: "Dashboard Overview",
      description:
        "Live tracking matrix across user acquisition, modules, and grading indicators.",
    },
    account: {
      title: "Account Management",
      description:
        "Overview of configuration profiles, connection credentials, and integrated webhooks.",
    },
    invites: {
      title: "Token Management",
      description:
        "Generate, revoke, and track access vouchers for your sales team.",
    },
    knowledge: {
      title: "Knowledge Base",
      description:
        "Upload and manage the training documents and context your AI uses.",
    },
    users: {
      title: "Users Management",
      description:
        "Directory of all onboarded trainees and their current system status.",
    },
    settings: {
      title: "System Settings",
      description:
        "Configure bot behavior, maintenance mode, and global workspace rules.",
    },
    // new pages would be here added
  },
};

export const activeSubscription = subscriptionPlans.PROFESSIONAL;
