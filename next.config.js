/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { allowedOrigins: ["*"] },
    instrumentationHook: true,
  },
}
module.exports = nextConfig
