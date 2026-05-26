/** @type {import('next').NextConfig} */
const nextConfig = {
  // Disable React Strict Mode — prevents Leaflet "Map container already initialized" error
  // Strict Mode intentionally mounts components twice in development to catch side effects.
  // This breaks Leaflet which doesn't expect double-mount.
  reactStrictMode: false,
  env: {
    NEXT_PUBLIC_API_URL:      process.env.NEXT_PUBLIC_API_URL      || "http://localhost:8000",
    NEXT_PUBLIC_MAPBOX_TOKEN: process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "",
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "*.basemaps.cartocdn.com" },
      { protocol: "https", hostname: "*.tile.openstreetmap.org" },
    ],
  },
}
module.exports = nextConfig
