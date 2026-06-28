import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "192.168.50.122",
    "192.168.50.229",
    "juxtapositional-aberrantly-jerlene.ngrok-free.dev",
    "pgd7q7rq-3000.euw.devtunnels.ms",
  ],
  experimental: {
    serverActions: {
      allowedOrigins: [
        "localhost:3000",
        "pgd7q7rq-3000.euw.devtunnels.ms",
        "juxtapositional-aberrantly-jerlene.ngrok-free.dev",
      ],
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "aymqecqttkrsolvkwhyn.supabase.co",
        pathname: "/storage/v1/object/public/menu-item-images/**",
      },
    ],
  },
};

export default nextConfig;
