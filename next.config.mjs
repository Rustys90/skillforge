/** @type {import('next').NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // Prefer modern image defaults; none required for this app's video-first UI
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
