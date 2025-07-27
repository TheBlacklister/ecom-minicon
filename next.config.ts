import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  
  images: {
    // CRITICAL: Convert PNG to modern formats
    formats: ['image/webp', 'image/avif'],
    
    // Define responsive breakpoints optimized for your grid
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    
    // Increase cache duration for better performance
    minimumCacheTTL: 31536000, // 1 year
    
    // Enable dangerously large image handling
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    
    // Ensure optimization is enabled
    unoptimized: false,
    
    // Add remote patterns if you're using external image sources
    remotePatterns: [],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize builds
  swcMinify: true,
  
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/_next/image(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Webpack configuration for handling large assets
  webpack: (config, { isServer }) => {
    // Optimize image loading
    config.module.rules.push({
      test: /\.(png|jpg|jpeg|gif|webp|avif)$/i,
      type: 'asset',
      parser: {
        dataUrlCondition: {
          maxSize: 8 * 1024, // 8kb - inline smaller images
        },
      },
      generator: {
        filename: 'static/images/[name].[hash][ext]',
      },
    });
    
    // Increase performance hints threshold for large images
    if (!isServer) {
      config.performance = {
        ...config.performance,
        maxAssetSize: 512000, // 500kb
        maxEntrypointSize: 512000,
      };
    }
    
    return config;
  },
  
  // Experimental features for better performance
  experimental: {
    // Enable optimizeCss for production
    optimizeCss: true,
    // Use the new app directory features
    scrollRestoration: true,
  },
};

export default nextConfig;