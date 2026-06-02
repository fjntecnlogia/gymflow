const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
  async redirects() {
    return [
      // /cadastro foi consolidado em /planos-saas (escolha de plano + checkout).
      // 308 = permanente — preserva SEO de qualquer link antigo já indexado.
      { source: "/cadastro", destination: "/planos-saas", permanent: true },
    ];
  },
};
module.exports = nextConfig;
