import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  
  images: {
    // CRITICAL: Convert PNG to modern formats - AVIF is essential for PNG compression
    formats: ['image/avif', 'image/webp'],
    
    // Smaller breakpoints for PNG optimization - prevents oversized images
    deviceSizes: [320, 480, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 24, 32, 48, 64, 96, 128, 192, 256, 320, 384, 512],
    
    // Cache optimized images longer
    minimumCacheTTL: 31536000, // 1 year
    
    // Ensure optimization is enabled - crucial for PNG conversion
    unoptimized: false,
    
    // Add quality controls
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Loader configuration for maximum PNG compression
    loader: 'default',
    
    // Add domains if using external images
    remotePatterns: [
      // Add your domains here if needed
      // {
      //   protocol: 'https',
      //   hostname: 'your-domain.com',
      // },
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Additional performance optimizations
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
  
  // Webpack optimizations for image handling
  webpack: (config, { dev, isServer }) => {
    // Add image optimization loader for local images
    if (!dev && !isServer) {
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|webp|avif)$/i,
        use: [
          {
            loader: 'responsive-loader',
            options: {
              adapter: require('responsive-loader/sharp'),
              sizes: [320, 640, 960, 1200, 1800],
              quality: 75,
              format: 'webp',
            },
          },
        ],
      });
    }
    return config;
  },
};

export default nextConfig;