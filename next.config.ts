import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["better-sqlite3"],
  // Geliştirme ekranındaki Next.js "N" rota göstergesini gizle (sol-alt köşe).
  // Build/çalışma-zamanı hataları yine de bildirilir; yalnızca dev modunda etkili.
  devIndicators: false,
};

export default nextConfig;
