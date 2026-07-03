"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/app/utils/config";

export default function TermsPage() {
  useEffect(() => {
    document.title = `Terms of Service — ${siteConfig.name}`;
  }, []);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[760px] mx-auto px-6 pt-32 pb-20">
        <Link href="/pricing" className="text-sm text-[#1D4ED8] font-medium hover:underline mb-6 inline-block">&larr; Back to Pricing</Link>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#0A1628] mb-4">Terms of Service</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: July 2, 2026</p>

        <div className="prose-custom space-y-8 text-[#334155] text-[0.92rem] leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Salesji (app.salesji.com) and its associated services, you agree to be bound by these Terms of Service. If you do not agree, you must not use the service. These terms apply to all users, including administrators and invited team members.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">2. Description of Service</h2>
            <p>Salesji is an AI-powered sales enablement platform that provides: a Telegram-based sales assistant bot, a web-based admin dashboard, knowledge base management, team training and testing modules, and RAG-powered chat capabilities. The service is provided on a subscription basis.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">3. Accounts & Access</h2>
            <p className="mb-3">You are responsible for maintaining the security of your account credentials. Admin users can invite team members via single-use invite tokens. You must not share invite tokens publicly or with unauthorized parties.</p>
            <p>We reserve the right to suspend or terminate accounts that violate these terms, engage in abuse, or are used for illegal purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">4. Subscription & Billing</h2>
            <p className="mb-3">Paid subscriptions are billed monthly or annually as selected. All payments are processed by <strong>Paddle</strong>, who acts as our Merchant of Record. Paddle handles all billing, invoicing, tax collection, and payment processing.</p>
            <p className="mb-3">By subscribing, you agree to Paddle&apos;s terms of service and authorize recurring charges for your chosen plan. Prices are subject to change with 30 days&apos; notice.</p>
            <p>Free pilot periods (14 days) do not require payment information. Upon expiry, access reverts to the free tier unless a paid plan is selected.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">5. Acceptable Use</h2>
            <p className="mb-3">You agree not to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Use the service for any illegal, harmful, or fraudulent activity</li>
              <li>Upload malicious files, malware, or content that violates intellectual property rights</li>
              <li>Attempt to reverse-engineer, decompile, or extract the AI models or algorithms</li>
              <li>Abuse API rate limits or attempt to circumvent usage restrictions</li>
              <li>Resell or redistribute access without written permission</li>
              <li>Use the bot to spam, harass, or deceive end-users or prospects</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">6. Intellectual Property</h2>
            <p className="mb-3"><strong>Your Content:</strong> You retain all rights to content you upload (documents, knowledge base materials). By uploading, you grant us a limited license to process and store this content solely to provide the service.</p>
            <p><strong>Our Service:</strong> The Salesji platform, code, AI models, algorithms, and branding are owned by ESS ENN Associates. Nothing in these terms transfers ownership to you.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">7. AI-Generated Content</h2>
            <p>Salesji generates responses using AI models based on your uploaded knowledge base. We do not guarantee the accuracy, completeness, or suitability of AI-generated content. You are responsible for reviewing and verifying AI outputs before using them in business communications.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">8. Service Availability</h2>
            <p>We strive for high uptime but do not guarantee uninterrupted access. We may perform maintenance, updates, or experience outages. We will provide reasonable notice for planned maintenance where possible. Enterprise SLA plans offer specific uptime guarantees.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Salesji and ESS ENN Associates shall not be liable for any indirect, incidental, consequential, or punitive damages arising from your use of the service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">10. Termination</h2>
            <p className="mb-3">You may cancel your subscription at any time. Upon cancellation, access continues until the end of the current billing period. After termination, your data will be deleted within 30 days per our Privacy Policy.</p>
            <p>We may terminate or suspend your account immediately if you breach these terms.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">11. Changes to Terms</h2>
            <p>We may modify these terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">12. Governing Law</h2>
            <p>These terms are governed by the laws of India. Any disputes shall be resolved in the courts of competent jurisdiction in India.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">13. Contact</h2>
            <p>For questions about these terms, contact us at:<br /><a href="mailto:salesjiteam@gmail.com" className="text-[#1D4ED8] hover:underline">salesjiteam@gmail.com</a></p>
          </section>
        </div>
      </div>
    </div>
  );
}
