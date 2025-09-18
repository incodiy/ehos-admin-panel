"use client";

import { CavadiaProvider as IncodiyCavadiaProvider, type CavadiaConfig } from "@incodiy/cavadia";

export { type CavadiaConfig } from "@incodiy/cavadia";

/**
 * EHOS CavadiaProvider — wrapper @incodiy/cavadia.
 * Integrasi media (gallery/foto temuan) dengan config API dari env + locale aktif
 * (Constraint I1/I2/I5). License tier enterprise diisikan saat backend media siap (9b dst).
 */
export function CavadiaProvider({
  config,
  children,
}: {
  config: CavadiaConfig;
  children: React.ReactNode;
}) {
  return (
    <IncodiyCavadiaProvider config={config}>
      {children}
    </IncodiyCavadiaProvider>
  );
}