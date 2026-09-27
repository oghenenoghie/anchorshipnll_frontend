/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Listing photos are served from Neon Object Storage branch endpoints,
    // e.g. https://br-….storage.c-5.eu-central-1.….neon.tech/stock-photos/stock/….jpg
    remotePatterns: [{ protocol: "https", hostname: "**.neon.tech", pathname: "/**" }],
  },
};

export default nextConfig;
