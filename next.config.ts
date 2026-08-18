import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use 'export' for GitHub Pages static deployment
  // Comment this out for server mode (standalone)
  output: process.env.NODE_ENV === 'production' && !process.env.DISABLE_AUTH ? "standalone" : "export",
  
  // For GitHub Pages, use a base path if deploying to a subdirectory
  // basePath: '/NEXUS-Preview',
  
  // Disable server-side features for static export
  ...(process.env.DISABLE_AUTH === 'true' ? {
    // These would be disabled in static mode
    images: {
      unoptimized: true,
    },
  } : {}),
  
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  
  // Handle trailing slashes
  trailingSlash: true,
  
  // Images configuration for static export
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
