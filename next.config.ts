import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,
  
  images: {
    // CRITICAL: Convert PNG to modern formats
    formats: ['image/webp', 'image/avif'],
    
    // Define responsive breakpoints
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384, 512],
    
    // Cache optimized images
    minimumCacheTTL: 86400,
    
    // Ensure optimization is enabled
    unoptimized: false,
  },
  
  compress: true,
};

export default nextConfig;
