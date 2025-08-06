import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:9000";

let storageHost: string[] = [];
try {
  storageHost = [new URL(storageUrl).hostname];
} catch {
  storageHost = ["localhost"];
}

const nextConfig: NextConfig = {
  transpilePackages: [
    "@incodiy/cavable",
    "@incodiy/cavadia",
    "@incodiy/cavaloc",
    "@incodiy/cavaform",
    "@incodiy/cavagate",
    "@incodiy/cavains",
    "@incodiy/cavator",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "**.localhost",
      },
      ...storageHost.map((hostname) => ({
        protocol: (storageUrl.startsWith("https") ? "https" : "http") as "http" | "https",
        hostname,
      })),
      {
        protocol: "https",
        hostname: "img.minio.io",
      },
    ],
  },
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: [],
      fallback: [
        {
          source: "/api/:path*",
          destination: `${apiUrl}/:path*`,
        },
      ],
    };
  },
};

export default nextConfig;