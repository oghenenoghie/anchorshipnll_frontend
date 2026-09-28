/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      // The sell-to-us form posts up to 6 photos of 10 MB each with the
      // submission; the 1 MB default would reject them.
      bodySizeLimit: "64mb",
    },
  },
  // The vessel marketplace lives under /vessels; /listings addresses (the
  // reference site's scheme) redirect there. /listings/<id> is resolved by
  // app/listings/[id].
  async redirects() {
    return [
      { source: "/listings", destination: "/vessels", permanent: true },
      { source: "/listings/search", destination: "/vessels/search", permanent: true },
      { source: "/listings/category/:category", destination: "/vessels/:category", permanent: true },
      { source: "/listings/category/:category/:sub", destination: "/vessels/:category/:sub", permanent: true },
    ];
  },
  images: {
    // Listing photos are served from Neon Object Storage branch endpoints,
    // e.g. https://br-….storage.c-5.eu-central-1.….neon.tech/stock-photos/stock/….jpg
    remotePatterns: [{ protocol: "https", hostname: "**.neon.tech", pathname: "/**" }],
  },
};

export default nextConfig;
