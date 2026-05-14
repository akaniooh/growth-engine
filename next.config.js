/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable webpack filesystem cache on Windows to avoid rename conflicts
  webpack: (config, { dev }) => {
    if (dev) {
      config.cache = false
    }
    return config
  },
}
module.exports = nextConfig
