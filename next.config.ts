/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // se você está usando GitHub Pages precisa exportar
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || '',
  assetPrefix: process.env.NEXT_PUBLIC_ASSET_PREFIX || '',
  images: {
    unoptimized: true, // obrigatório para Pages (sem Image Optimization server)
  },
}

module.exports = nextConfig
