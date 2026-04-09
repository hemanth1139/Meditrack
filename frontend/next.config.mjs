import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
  },

  compiler: {
    // Strip all console.* calls from the production client bundle
    removeConsole: process.env.NODE_ENV === "production",
  },


  // Disable source maps in development to save RAM
  productionBrowserSourceMaps: false,

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          // Prevent clickjacking
          { key: "X-Frame-Options", value: "DENY" },
          // Prevent MIME-type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Legacy XSS filter (belt-and-suspenders)
          { key: "X-XSS-Protection", value: "1; mode=block" },
          // Force HTTPS for 1 year (only active in production behind HTTPS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Don't leak full URL as referer to third parties
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Only the QR scanner needs camera; microphone is never needed
          {
            key: "Permissions-Policy",
            value: "camera=self, microphone=()",
          },
        ],
      },
    ];
  },
};

export default withBundleAnalyzer(nextConfig);
