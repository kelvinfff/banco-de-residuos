import type { NextConfig } from "next";

// Endereço da API Express. No Docker é o nome do serviço (http://api:3333).
const API_URL = process.env.API_URL ?? "http://localhost:3333";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Gera um servidor enxuto em .next/standalone, usado pela imagem Docker.
  output: "standalone",
  poweredByHeader: false,
  // Cabeçalhos de segurança para todas as páginas.
  async headers() {
    return [
      {
        source: "/:caminho*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          // O site não pode ser embutido em páginas de terceiros (clickjacking).
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  // O navegador fala só com o Next.js; /api e /uploads são repassados à API.
  // Assim o cookie de sessão é de mesma origem e não há CORS para configurar.
  async rewrites() {
    return [
      { source: "/api/:caminho*", destination: `${API_URL}/api/:caminho*` },
      { source: "/uploads/:caminho*", destination: `${API_URL}/uploads/:caminho*` },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
