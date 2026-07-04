/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      // Security header for everything
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
      // ONLY cache Next.js static build assets for 1 year (they are content-hashed,
      // so a new build produces new filenames — safe to cache immutably).
      {
        source: "/_next/static/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      // Never cache HTML pages — always revalidate so users get fresh content
      // after each deploy (prevents stale-chunk 404 errors).
      {
        source: "/((?!_next/static).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  allowedDevOrigins: [
    "http://192.168.50.46:3000",
    "192.168.137.1",
    "192.168.50.46",
  ],
  reactCompiler: true,
};

export default nextConfig;
