/** @type {import('next').NextConfig} */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || ''
const assetPrefix = process.env.NEXT_PUBLIC_ASSET_PREFIX || ''

module.exports = {
  reactStrictMode: true,
  output: 'export',         // importantíssimo para Next 15 exports estáticos
  basePath,
  assetPrefix,
  images: {
    unoptimized: true,     // necessário para GitHub Pages (sem image optimization server)
  },
}
