import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "11mb", // images jusqu'à 10 Mo + overhead du formulaire
    },
  },
};

export default nextConfig;
