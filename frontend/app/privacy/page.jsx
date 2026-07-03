"use client";

import { useEffect } from "react";
import Link from "next/link";
import { siteConfig } from "@/app/utils/config";

const MARKETING_URL = "https://salesji.com";

export default function PrivacyPage() {
  useEffect(() => {
    document.title = `Privacy Policy — ${siteConfig.name}`;
  }, []);

  return (
    <div className="bg-white min-h-screen" style={{ fontFamily: "'DM Sans', sans-serif" }}>
      <div className="max-w-[760px] mx-auto px-6 pt-32 pb-20">
        <Link href="/pricing" className="text-sm text-[#1D4ED8] font-medium hover:underline mb-6 inline-block">&larr; Back to Pricing</Link>
        <h1 className="font-display text-3xl md:text-4xl font-extrabold text-[#0A1628] mb-4">Privacy Policy</h1>
        <p className="text-sm text-[#64748B] mb-10">Last updated: July 2, 2026</p>

        <div className="prose-custom space-y-8 text-[#334155] text-[0.92rem] leading-relaxed">
          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">1. Introduction</h2>
            <p>Salesji (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;), a product of ESS ENN Associates, operates the app.salesji.com platform and associated Telegram bot services. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our services.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">2. Information We Collect</h2>
            <p className="mb-3"><strong>Account Information:</strong> When you register, we collect your email address, name, and authentication credentials via our identity provider (Supabase Auth).</p>
            <p className="mb-3"><strong>Bot Usage Data:</strong> When your team members interact with the Telegram bot, we collect their Telegram user ID, username, messages sent to the bot, and bot responses for analytics purposes.</p>
            <p className="mb-3"><strong>Knowledge Base Content:</strong> Documents, files, and text you upload to build your AI knowledge base are stored and processed to provide the service.</p>
            <p className="mb-3"><strong>Payment Information:</strong> Payment processing is handled by Paddle (our Merchant of Record). We do not store credit card numbers or bank details. Paddle may collect billing information as described in their privacy policy.</p>
            <p><strong>Usage Analytics:</strong> We collect aggregated usage metrics including query counts, response times, feature usage patterns, and training/test completion rates.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>To provide and maintain the Salesji platform and bot services</li>
              <li>To generate AI responses based on your uploaded knowledge base</li>
              <li>To provide usage analytics and training/test reports to account administrators</li>
              <li>To process subscriptions and payments (via Paddle)</li>
              <li>To send service-related communications (account verification, security alerts)</li>
              <li>To improve our AI models and service quality (using aggregated, anonymised data only)</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">4. Data Isolation & Multi-Tenancy</h2>
            <p>Each organisation&apos;s data is strictly isolated. Your knowledge base, chat logs, user data, and analytics are accessible only to your account administrator. We enforce row-level security at the database level to prevent cross-tenant data access.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">5. Data Retention</h2>
            <p>We retain your data for as long as your account is active. Upon account deletion or subscription cancellation, we delete all associated data (knowledge base, chat logs, user records) within 30 days. Anonymised, aggregated analytics may be retained indefinitely for service improvement.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">6. Third-Party Services</h2>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Supabase:</strong> Database hosting and authentication (servers in Australia)</li>
              <li><strong>Google Gemini / Groq:</strong> AI language model providers for generating responses</li>
              <li><strong>Paddle:</strong> Payment processing and subscription management (Merchant of Record)</li>
              <li><strong>Telegram:</strong> Bot messaging platform</li>
              <li><strong>DigitalOcean:</strong> Application hosting infrastructure</li>
            </ul>
            <p className="mt-3">We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">7. Your Rights (GDPR / Data Protection)</h2>
            <p className="mb-3">You have the right to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Withdraw consent for data processing</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
            <p className="mt-3">To exercise any of these rights, contact us at <a href="mailto:salesjiteam@gmail.com" className="text-[#1D4ED8] hover:underline">salesjiteam@gmail.com</a>.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">8. Security</h2>
            <p>We implement industry-standard security measures including encryption in transit (TLS 1.3), encryption at rest, row-level security policies, and regular security monitoring. However, no method of electronic transmission is 100% secure.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">9. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on this page and updating the &quot;Last updated&quot; date.</p>
          </section>

          <section>
            <h2 className="font-display text-xl font-bold text-[#0A1628] mb-3">10. Contact Us</h2>
            <p>For privacy-related inquiries, contact us at:<br /><a href="mailto:salesjiteam@gmail.com" className="text-[#1D4ED8] hover:underline">salesjiteam@gmail.com</a></p>
            <p className="mt-2">ESS ENN Associates<br />India</p>
          </section>
        </div>
      </div>
    </div>
  );
}
