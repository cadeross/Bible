import type { AuthConfig } from "convex/server";

const providers: AuthConfig["providers"] = [
  {
    domain: process.env.CONVEX_SITE_URL!,
    applicationID: "convex",
  },
];

if (process.env.CLERK_JWT_ISSUER_DOMAIN) {
  providers.push({
    domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
    applicationID: "convex",
  });
}

export default { providers } satisfies AuthConfig;
