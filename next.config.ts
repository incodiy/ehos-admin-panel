import type { NextConfig } from "next";

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
const storageUrl = process.env.NEXT_PUBLIC_STORAGE_URL || "http://localhost:9000";

let storageHost: string[] = [];
try {
  storageHost = [new URL(storageUrl).hostname];
} catch {
  storageHost = ["localhost"];
}

/**
 * Incodiy Cava* Ecosystem Environment & Tier Bridge
 * Maps standard SCREAMING_SNAKE_CASE environment variables from .env to internal
 * package lookups (including PascalCase aliases and master enterprise switches)
 * ensuring seamless Webpack inlining on client components.
 */
function resolveIncodiyEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  const raw = process.env;

  // 1. Cavable Table (Bridge ALL CAPS -> PascalCase + Enterprise master flags)
  const cavableTier = (raw.NEXT_PUBLIC_CAVABLE_TIER || raw.NEXT_PUBLIC_Cavable_TIER || "enterprise").toLowerCase();
  env.NEXT_PUBLIC_CAVABLE_TIER = cavableTier;
  env.NEXT_PUBLIC_Cavable_TIER = cavableTier;
  if (cavableTier === "enterprise") {
    env.NEXT_PUBLIC_CAVABLE_ENTERPRISE_ALL = "true";
    env.NEXT_PUBLIC_Cavable_ENTERPRISE_ALL = "true";
    env.NEXT_PUBLIC_Cavable_ENTERPRISE = "true";
  } else if (cavableTier === "premium") {
    env.NEXT_PUBLIC_CAVABLE_PREMIUM_ALL = "true";
    env.NEXT_PUBLIC_Cavable_PREMIUM_ALL = "true";
    env.NEXT_PUBLIC_Cavable_PREMIUM = "true";
  }

  // 2. Cavadia Media Studio
  const cavadiaTier = (raw.NEXT_PUBLIC_CAVADIA_TIER || raw.NEXT_PUBLIC_Cavadia_TIER || "enterprise").toLowerCase();
  env.NEXT_PUBLIC_CAVADIA_TIER = cavadiaTier;
  env.NEXT_PUBLIC_Cavadia_TIER = cavadiaTier;
  if (cavadiaTier === "enterprise") {
    env.NEXT_PUBLIC_CAVADIA_ENTERPRISE_ALL = "true";
    env.NEXT_PUBLIC_Cavadia_ENTERPRISE_ALL = "true";
    env.NEXT_PUBLIC_Cavadia_ENTERPRISE = "true";
  } else if (cavadiaTier === "premium") {
    env.NEXT_PUBLIC_CAVADIA_PREMIUM_ALL = "true";
    env.NEXT_PUBLIC_Cavadia_PREMIUM_ALL = "true";
    env.NEXT_PUBLIC_Cavadia_PREMIUM = "true";
  }

  // 3. Cavaloc Maps
  const cavalocTier = (raw.NEXT_PUBLIC_CAVALOC_TIER || "enterprise").toLowerCase();
  env.NEXT_PUBLIC_CAVALOC_TIER = cavalocTier;
  if (cavalocTier === "enterprise") {
    env.NEXT_PUBLIC_CAVALOC_ENTERPRISE_ALL = "true";
    env.NEXT_PUBLIC_CAVALOC_ENTERPRISE = "true";
  } else if (cavalocTier === "premium") {
    env.NEXT_PUBLIC_CAVALOC_PREMIUM_ALL = "true";
  }

  // 4. CavaForm Engine
  const cavaformTier = (raw.NEXT_PUBLIC_CAVAFORM_TIER || "enterprise").toLowerCase();
  env.NEXT_PUBLIC_CAVAFORM_TIER = cavaformTier;
  if (cavaformTier === "enterprise") {
    env.NEXT_PUBLIC_CAVAFORM_ENTERPRISE_ALL = "true";
  } else if (cavaformTier === "premium") {
    env.NEXT_PUBLIC_CAVAFORM_PREMIUM_ALL = "true";
  }

  // 5. Cavator Editor
  const cavatorTier = (raw.NEXT_PUBLIC_CAVATOR_TIER || "enterprise").toLowerCase();
  env.NEXT_PUBLIC_CAVATOR_TIER = cavatorTier;
  if (cavatorTier === "enterprise") {
    env.NEXT_PUBLIC_CAVATOR_ENTERPRISE_ALL = "true";
  } else if (cavatorTier === "premium") {
    env.NEXT_PUBLIC_CAVATOR_PREMIUM_ALL = "true";
  }

  // 6. Dynamic pass-through for all granular FEATURE overrides
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith("NEXT_PUBLIC_CAV") || key.startsWith("NEXT_PUBLIC_Cav")) {
      if (value !== undefined) {
        env[key] = value;
      }
    }
  }

  return env;
}

const nextConfig: NextConfig = {
  env: resolveIncodiyEnv(),
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
    return [
      {
        source: "/api/:path*",
        destination: `${apiUrl}/:path*`,
      },
      {
        source: "/dashboard/Regions/regions",
        destination: "/dashboard/hotels/regions",
      },
      {
        source: "/dashboard/regions",
        destination: "/dashboard/hotels/regions",
      },
      {
        source: "/dashboard/regions/:path*",
        destination: "/dashboard/hotels/regions/:path*",
      },
    ];
  },
};

export default nextConfig;