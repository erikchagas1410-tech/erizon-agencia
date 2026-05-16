/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack(config, { isServer }) {
    if (isServer) {
      /*
       * @resvg/resvg-js ships native .node binaries.
       * Keep it external so Next/Webpack does not try to parse the binary
       * while compiling API routes that import the creative renderer.
       */
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
