import "./globals.css";
import { siteConfig } from "./utils/config";

export const viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
};

// 1. Safely parse the URL. Fallback to localhost if the env var is missing during build.
const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return new URL(process.env.NEXT_PUBLIC_APP_URL);
  }
  if (process.env.VERCEL_URL) {
    return new URL(`https://${process.env.VERCEL_URL}`); // Vercel preview environments
  }
  return new URL(`http://localhost:${process.env.PORT || 3000}`);
};

// 2. Generate the global metadata using your siteConfig
export const metadata = {
  metadataBase: getBaseUrl(),
  alternates: {
    canonical: "/", // Adds the self-canonical tag
  },
  title: {
    default: `${siteConfig.name} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "Sales AI",
    "Knowledge Base",
    "Access Control",
    "Onboarding",
    "Telegram Bot",
  ],
  authors: [{ name: siteConfig.name }],
  creator: siteConfig.name,
  openGraph: {
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: getBaseUrl(),
    siteName: siteConfig.name,
    locale: "en_US",
    type: "website",
    // Next.js will automatically look for app/opengraph-image.jsx and append it here!
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} | ${siteConfig.tagline}`,
    description: siteConfig.description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-white text-zinc-900">{children}</body>
    </html>
  );
}
