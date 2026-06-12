"use client";

import { useState, useEffect } from "react";
import {
  CreditCard,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { siteConfig } from "../../utils/config";
import { useSubscription } from "../../context/SubscriptionContext";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  const [showDemoAlert, setShowDemoAlert] = useState(false);

  // 1. Pull the active plan with a failsafe fallback so it doesn't crash on load
  const { activePlan } = useSubscription() || {};

  useEffect(() => {
    document.title = `Billing | ${siteConfig.name}`;
    setShowDemoAlert(true);
  }, []);

  const renewalDate = "June 14, 2026";

  // Safely fallback variables in case context is still loading
  const planName = activePlan?.name || "Pro Plan";
  const planPrice = activePlan?.monthlyPrice || 49;
  const planFeatures = activePlan?.features || [
    "Unlimited Sales Scripts",
    "Objection Handling Engine",
    "WhatsApp & Telegram Bots",
    "Manager Control Centre",
  ];

  // 2. Use activePlan for the invoice amounts
  const recentInvoices = [
    {
      id: "INV-2026-05",
      date: "May 14, 2026",
      amount: planPrice,
      status: "Paid",
    },
    {
      id: "INV-2026-04",
      date: "Apr 14, 2026",
      amount: planPrice,
      status: "Paid",
    },
    {
      id: "INV-2026-03",
      date: "Mar 14, 2026",
      amount: planPrice,
      status: "Paid",
    },
  ];

  return (
    <>
      {/* Demo Modal Styled for Salesji */}
      {showDemoAlert && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-navy/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[16px] p-8 max-w-md w-full shadow-[0_16px_48px_rgba(10,22,40,0.16)] relative animate-in fade-in zoom-in duration-300">
            <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-[12px] flex items-center justify-center mb-5 border border-amber-100">
              <AlertTriangle size={28} />
            </div>
            <h2 className="text-[1.8rem] font-bold text-navy font-display mb-2 leading-tight">
              Demo Environment
            </h2>
            <p className="text-[0.95rem] text-grey-500 font-medium leading-relaxed mb-8">
              This is just a demo page. It currently has no real information
              about final billing plans, and no payment gateways are active.
            </p>
            <button
              onClick={() => setShowDemoAlert(false)}
              className="w-full bg-navy text-white font-bold py-3.5 rounded-[11px] hover:bg-primary transition-colors shadow-sm"
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* Main Page Container */}
      <div className="w-full flex-1 px-6 lg:px-10 xl:px-12 py-6 sm:py-8 space-y-8 min-h-full">
        {/* Header Layout */}
        <div>
          <h1 className="text-[1.6rem] md:text-[2rem] font-bold text-navy font-display tracking-tight flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-[10px] bg-primary-light flex items-center justify-center shrink-0">
              <CreditCard size={22} className="text-primary" />
            </div>
            Billing & Subscription
          </h1>
          <p className="text-[0.95rem] text-grey-500 mt-1">
            Manage your {siteConfig.name} subscription, payment methods, and
            billing history.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Plan Card - Premium Styling */}
          <div className="lg:col-span-2 bg-gradient-to-br from-navy to-navy-mid text-white p-8 rounded-[16px] shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-[0.03] rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div>
                <span className="bg-white/10 border border-white/10 text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">
                  Active Plan
                </span>
                {/* 3. Use activePlan for the name */}
                <h2 className="text-[2.2rem] font-bold font-display mb-1 leading-tight">
                  {planName}
                </h2>
                <p className="text-white/60 text-[0.95rem]">
                  Your plan renews automatically on{" "}
                  <span className="text-white font-medium">{renewalDate}</span>.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mt-8 gap-4">
                <div>
                  {/* 4. Use activePlan for the price */}
                  <span className="text-[2.5rem] font-black font-display leading-none">
                    ${planPrice}
                  </span>
                  <span className="text-white/60 font-medium text-[0.95rem]">
                    {" "}
                    / month
                  </span>
                </div>
                <Link
                  href="/manage-plan"
                  className="bg-white text-navy px-5 py-2.5 rounded-[10px] text-[0.92rem] font-bold hover:bg-grey-50 transition-colors flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                  Manage Plan <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white border border-grey-100 p-6 md:p-8 rounded-[16px] shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="text-[1.1rem] font-bold text-navy font-display mb-4">
                Payment Method
              </h3>
              <div className="flex items-center gap-4 bg-grey-50 p-4 rounded-[12px] border border-grey-100">
                <div className="bg-primary text-white p-2 rounded-lg font-black italic text-xs tracking-wider shadow-sm">
                  VISA
                </div>
                <div>
                  <p className="text-[0.95rem] font-bold text-navy">
                    Visa ending in 4242
                  </p>
                  <p className="text-xs text-grey-500 mt-0.5">
                    Expires 12/2028
                  </p>
                </div>
              </div>
            </div>
            <button className="w-full text-center mt-6 text-[0.92rem] font-semibold text-primary hover:text-primary-bright transition-colors">
              Update Payment Method
            </button>
          </div>
        </div>

        {/* Features List */}
        <div className="bg-white border border-grey-100 rounded-[16px] shadow-sm p-6 md:p-8">
          <h3 className="text-xs font-bold text-grey-400 uppercase tracking-wider mb-5">
            Your Plan Includes
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {/* 5. Use activePlan for the features list */}
            {planFeatures.map((feature, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2.5 text-[0.92rem] font-medium text-navy"
              >
                <CheckCircle2 size={18} className="text-[#16a34a] shrink-0" />{" "}
                {feature}
              </div>
            ))}
          </div>
        </div>

        {/* Billing History Table */}
        <div className="bg-white border border-grey-100 rounded-[16px] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-grey-100">
            <h3 className="text-[1.2rem] font-bold text-navy font-display">
              Billing History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-grey-50 border-b border-grey-100 text-grey-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-4">Invoice</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-grey-100">
                {recentInvoices.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="hover:bg-grey-50 transition-colors text-[0.92rem]"
                  >
                    <td className="px-6 py-4 font-bold text-navy font-display">
                      {invoice.id}
                    </td>
                    <td className="px-6 py-4 text-grey-500 font-medium">
                      {invoice.date}
                    </td>
                    <td className="px-6 py-4 font-bold text-navy">
                      ${invoice.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="bg-[#F0FDF4] text-[#16a34a] px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-grey-400 hover:text-primary transition-colors p-1">
                        <Download size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
