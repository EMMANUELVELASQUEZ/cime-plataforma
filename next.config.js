/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  compress: true,
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    instrumentationHook: true,
    optimizePackageImports: ["lucide-react"],
  },
  // Recursos de marca: caché en el navegador (1 semana) para no descargarlos en cada visita
  async headers() {
    return [
      {
        source: "/brand/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=604800, stale-while-revalidate=86400" }],
      },
    ]
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "*.public.blob.vercel-storage.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = { ...config.resolve.fallback, child_process: false }
    }
    return config
  },
}
module.exports = nextConfig
