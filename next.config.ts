import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Remove TypeScript error ignoring to catch real issues
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Experimental features for performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      resolveAlias: {
        // Add any package aliases if needed
      },
    },
  },
  // Webpack configuration for chunk splitting
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Only apply custom webpack config in production builds
    if (!dev && !isServer) {
      // Optimize chunk splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunk for third-party libraries
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            // Separate chunk for Radix UI components
            radix: {
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              name: 'radix',
              priority: 20,
              chunks: 'all',
            },
            // Separate chunk for Lucide icons
            lucide: {
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              name: 'lucide',
              priority: 20,
              chunks: 'all',
            },
            // Separate chunk for Firebase
            firebase: {
              test: /[\\/]node_modules[\\/]firebase[\\/]/,
              name: 'firebase',
              priority: 20,
              chunks: 'all',
            },
            // Common chunks for shared utilities
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              enforce: true,
            },
            // Heavy UI components
            'ui-heavy': {
              test: /[\\/]src[\\/]components[\\/]ui[\\/](calendar|date-picker|carousel)[\\/]/,
              name: 'ui-heavy',
              priority: 15,
              chunks: 'all',
            },
          },
        },
        // Improve runtime chunk handling
        runtimeChunk: {
          name: 'runtime',
        },
      };

      // Add module federation support if needed for future micro-frontend architecture
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        })
      );

      // Enable better compression
      config.optimization.minimizer?.push(
        new webpack.TerserPlugin({
          parallel: true,
          terserOptions: {
            compress: {
              drop_console: process.env.NODE_ENV === 'production',
            },
          },
        })
      );
    }

    // Add transpilation for specific packages if needed
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }

    return config;
  },
  // Transpile packages that need compilation
  transpilePackages: [],
  // Configure SWC minification
  swcMinify: true,
  // Configure compression
  compress: true,
  // Enable standalone output for better deployment
  output: 'standalone',
  // Configure headers for better caching
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 's-maxage=1, stale-while-revalidate=59',
          },
        ],
      },
    ];
  },
  // Configure redirects if needed
  async redirects() {
    return [];
  },
  // Configure rewrites for API proxying if needed
  async rewrites() {
    return [];
  },
};

export default nextConfig;
