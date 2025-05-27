
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
       // Add other image domains if needed, e.g., for user avatars
       // {
       //   protocol: 'https',
       //   hostname: 'lh3.googleusercontent.com', // Example for Google Avatars
       // },
    ],
  },
   // If using fonts that need remote loading and are not handled by next/font
   // async headers() {
   //   return [
   //     {
   //       source: '/(.*)',
   //       headers: [
   //         {
   //           key: 'Content-Security-Policy',
   //           value: "font-src 'self' fonts.gstatic.com;", // Allow fonts.gstatic.com
   //         },
   //       ],
   //     },
   //   ];
   // },
};

export default nextConfig;
