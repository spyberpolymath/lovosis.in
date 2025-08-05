import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // ✅ Added this line to skip image optimization (optional but speeds up builds)
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000'
      },
      {
        protocol: 'https',
        hostname: 'lovosis.in'
      },
      {
        protocol: 'https',
        hostname: 'www.lovosis.in'
      }
    ],
    domains: ['lovosis.in', 'www.lovosis.in', 'localhost'], // Add this to allow your domain
    dangerouslyAllowSVG: true, // Allow SVG files if needed
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(mp4|webm|ogg|mov|pdf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: '/_next/static/files/',
          outputPath: 'static/files/',
          name: '[name].[hash].[ext]',
        },
      },
    });
    return config;
  },
  output: 'standalone',
  typescript: {
    ignoreBuildErrors: true
  },
  eslint: {
    ignoreDuringBuilds: true
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '15mb'
    }
  },
  staticPageGenerationTimeout: 120,
  reactStrictMode: process.env.NODE_ENV === 'production',
};

export default nextConfig;
