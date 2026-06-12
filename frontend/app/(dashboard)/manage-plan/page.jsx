"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, CheckCircle2, Zap, Shield, Sparkles } from "lucide-react";
import Link from "next/link";
import { subscriptionPlans } from "../../utils/config";
import { useSubscription } from "../../context/SubscriptionContext";
import { siteConfig } from "../../utils/config";

export const dynamic = "force-dynamic";

export default function ManagePlanPage() {
  const [isAnnual, setIsAnnual] = useState(true);

  // FIXED: Context failsafe and fallback to prevent crashes if context is loading
  const { activePlan, setActivePlan } = useSubscription() || {};
  const safeActivePlan = activePlan || { id: "starter" };

  // FIXED: Moved useEffect INSIDE the component to follow React Rules of Hooks
  useEffect(() => {
    document.title = `Manage Plan | ${siteConfig.name}`;
  }, []);

  // Map icons to the plan IDs dynamically with premium styling wrappers
  const planIcons = {
    starter: (
      <div className="w-12 h-12 rounded-[12px] bg-primary-light text-primary flex items-center justify-center shrink-0">
        <Sparkles size={24} />
      </div>
    ),
    professional: (
      <div className="w-12 h-12 rounded-[12px] bg-amber-50 text-amber-500 flex items-center justify-center shrink-0">
        <Zap size={24} />
      </div>
    ),
    enterprise: (
      <div className="w-12 h-12 rounded-[12px] bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
        <Shield size={24} />
      </div>
    ),
  };

  // Helper function to determine button text and styles based on the global active plan
  const getButtonState = (planId) => {
    if (safeActivePlan.id === planId) {
      return {
        text: "Current Plan",
        style: "bg-navy text-white shadow-sm cursor-default",
      };
    }

    // Quick logic to determine Upgrade vs Downgrade text
    const tiers = ["starter", "professional", "enterprise"];
    const currentIndex = tiers.indexOf(safeActivePlan.id);
    const planIndex = tiers.indexOf(planId);

    if (planIndex > currentIndex) {
      return {
        text: "Upgrade Plan",
        style:
          "bg-primary text-white hover:bg-primary-bright shadow-[0_4px_16px_rgba(29,78,216,0.25)] hover:-translate-y-[1px]",
      };
    } else {
      return {
        text: "Downgrade",
        style:
          "bg-white border border-grey-100 text-grey-700 hover:bg-grey-50 hover:text-navy",
      };
    }
  };

  return (
    <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 min-h-full">
      {/* Header Section */}
      <div className="mb-10 text-center max-w-2xl mx-auto pt-8">
        <div className="flex justify-center mb-6">
          <Link
            href="/billing"
            className="inline-flex items-center gap-2 text-[0.92rem] font-bold text-grey-500 hover:text-navy hover:bg-grey-50 transition-colors bg-white px-5 py-2.5 rounded-[12px] border border-grey-100 shadow-sm"
          >
            <ArrowLeft size={18} />
            Back to Billing
          </Link>
        </div>
        <h1 className="text-[2.2rem] md:text-[2.8rem] font-black font-display text-navy tracking-tight mb-4 leading-tight">
          Upgrade your workflow.
        </h1>
        <p className="text-[1.05rem] text-grey-500 font-medium">
          Choose the plan that fits your team's size and AI token requirements.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <span
            className={`text-[0.95rem] font-bold transition-colors ${!isAnnual ? "text-navy" : "text-grey-400"}`}
          >
            Monthly
          </span>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className={`w-14 h-7 rounded-full relative p-1 transition-colors duration-300 focus:outline-none ${isAnnual ? "bg-primary" : "bg-grey-300"}`}
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${isAnnual ? "translate-x-7" : "translate-x-0"}`}
            ></div>
          </button>
          <span
            className={`text-[0.95rem] font-bold flex items-center gap-2 transition-colors ${isAnnual ? "text-navy" : "text-grey-400"}`}
          >
            Annually{" "}
            <span className="bg-[#F0FDF4] text-[#16a34a] px-2 py-0.5 rounded-md text-[10px] uppercase font-bold tracking-wider">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.values(subscriptionPlans).map((plan) => {
          const isCurrentPlan = safeActivePlan.id === plan.id;
          const buttonDetails = getButtonState(plan.id);

          return (
            <div
              key={plan.id}
              className={`relative bg-white rounded-[20px] p-6 sm:p-8 transition-all duration-300 flex flex-col ${
                isCurrentPlan
                  ? "border-2 border-primary shadow-[0_16px_48px_rgba(10,22,40,0.12)] scale-100 md:scale-105 z-10"
                  : "border border-grey-100 shadow-sm hover:border-grey-300 hover:shadow-md cursor-pointer"
              }`}
              onClick={() => setActivePlan?.(plan)}
            >
              {isCurrentPlan && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-primary text-white px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm">
                  Active Plan
                </div>
              )}

              <div className="mb-6">{planIcons[plan.id]}</div>

              <h3 className="text-[1.4rem] font-bold font-display text-navy mb-2">
                {plan.name}
              </h3>
              <p className="text-[0.92rem] text-grey-500 font-medium h-12 mb-6 leading-relaxed">
                {plan.description}
              </p>

              <div className="flex items-baseline gap-1 mb-8">
                <span className="text-[3rem] font-black font-display text-navy leading-none">
                  ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                <span className="text-grey-500 font-medium">/mo</span>
              </div>

              <button
                className={`w-full py-3.5 rounded-[11px] font-bold transition-all mb-8 text-[0.95rem] ${buttonDetails.style}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setActivePlan?.(plan);
                }}
              >
                {buttonDetails.text}
              </button>

              <div className="space-y-4 mt-auto">
                <p className="text-[10px] font-bold text-grey-400 uppercase tracking-widest mb-4">
                  Included Features
                </p>
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <CheckCircle2
                      size={18}
                      className="text-[#16a34a] shrink-0 mt-0.5"
                    />
                    <span className="text-[0.95rem] font-medium text-navy leading-snug">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
