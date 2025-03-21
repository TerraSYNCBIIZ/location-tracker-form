/** @type {import('next').NextConfig} */
const nextConfig = {
  /* Production configuration */
  output: 'standalone', // Optimized for containerized deployments
  poweredByHeader: false, // Remove the X-Powered-By header for security
  reactStrictMode: true, // Enable React strict mode for better development practices
  images: {
    domains: [], // Add any external image domains here if needed
    unoptimized: process.env.NODE_ENV === 'development', // Only optimize images in production
  },
  experimental: {
    // Modern optimizations available in Next.js 15
    serverMinification: true,
    optimizeCss: true,
  },
};

export default nextConfig; 