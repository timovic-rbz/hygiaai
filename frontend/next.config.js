/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Permanent redirect von / zu /dashboard
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
