/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable", // Cache TTL setup
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
