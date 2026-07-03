"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/app/utils/config";

export default function RefundsPage() {
  useEffect(() => {
    document.title = `Refund Policy — ${siteConfig.name}`;
  }, []);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[760px] mx-auto px-6 pt-32 pb-20">
        <Link href="/pricing" className="text-sm text-[#1D4ED8] font-medium hover:underline mb-6 inline-block">&larr; Back to Pricing</Link>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#0A1628] mb-4">Refund Policy</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: July 2, 2026</p>

        <div className="prose-custom space-y-8 text-[#334155] text-[0.92rem] leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">1. Overview</h2>
            <p>Salesji offers digital software-as-a-service (SaaS) subscriptions. All payments are processed by <strong>Paddle</strong>, who acts as our Merchant of Record. This refund policy applies to all paid subscription plans purchased through our platform.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">2. Free Trial / Pilot Period</h2>
            <p>All plans include a 14-day free pilot with full access. No payment is required during this period. If you decide not to continue, simply do not subscribe — no charges will be made.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">3. Refund Eligibility</h2>
            <p className="mb-3">We offer refunds under the following conditions:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Within 7 days of first payment:</strong> If you are unsatisfied with the service after your first subscription payment, you may request a full refund within 7 days of the charge.</li>
              <li><strong>Service unavailability:</strong> If the platform experiences extended downtime (more than 72 consecutive hours) not caused by scheduled maintenance, you may request a prorated refund for the affected period.</li>
              <li><strong>Duplicate charges:</strong> If you are charged in error or duplicated, we will refund the incorrect charge immediately upon verification.</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">4. Non-Refundable Situations</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>Requests made more than 7 days after the initial charge</li>
              <li>Renewal charges (you can cancel before renewal to avoid future charges)</li>
              <li>Partial month usage (subscription access continues until period end)</li>
              <li>Annual plans after 14 days from purchase (unless service unavailability applies)</li>
              <li>Accounts terminated due to Terms of Service violations</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">5. How to Request a Refund</h2>
            <p className="mb-3">To request a refund, email us at <a href="mailto:salesjiteam@gmail.com" className="text-[#1D4ED8] hover:underline">salesjiteam@gmail.com</a> with:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your registered email address</li>
              <li>Date of charge</li>
              <li>Reason for refund request</li>
              <li>Paddle transaction/receipt ID (if available)</li>
            </ul>
            <p className="mt-3">We will respond within 2 business days. Approved refunds are processed by Paddle and typically appear within 5-10 business days depending on your payment method.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">6. Cancellation</h2>
            <p className="mb-3">You may cancel your subscription at any time from the billing settings in your dashboard or by contacting us. Upon cancellation:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Your access continues until the end of the current billing period</li>
              <li>No further charges will be made</li>
              <li>Your data will be retained for 30 days post-cancellation, then permanently deleted</li>
              <li>You can reactivate within 30 days without data loss</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">7. Paddle as Merchant of Record</h2>
            <p>Paddle.com Market Limited acts as the Merchant of Record for all purchases. This means Paddle handles payment processing, invoicing, sales tax/VAT collection, and compliance with local tax regulations on our behalf. Refunds are processed through Paddle&apos;s systems.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">8. Contact</h2>
            <p>For refund requests or billing questions:<br /><a href="mailto:salesjiteam@gmail.com" className="text-[#1D4ED8] hover:underline">salesjiteam@gmail.com</a></p>
            <p className="mt-2">ESS ENN Associates<br />India</p>
          </section>
        </div>
      </div>
    </div>
  );
}
