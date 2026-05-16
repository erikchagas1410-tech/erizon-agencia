/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (isServer) {
      // Prevent bundling native @resvg binaries which break the webpack parser on Windows.
      config.externals = config.externals || [];
      if (Array.isArray(config.externals)) {
        config.externals.push("@resvg/resvg-js");
      }
    }

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com"
      }
    ]
  }
};

export default nextConfig;
