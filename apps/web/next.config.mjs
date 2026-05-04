/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Same-origin API: the browser always calls /api/* on whatever host it's
  // loaded from, and Next.js proxies it to the Go backend. In dev that's
  // localhost:8080; in prod the deploy's ingress points API_BASE_URL at the
  // internal API service. The browser never sees a hardcoded host.
  async rewrites() {
    const apiBase = process.env.API_BASE_URL ?? 'http://localhost:8080';
    return [
      {
        source: '/api/:path*',
        destination: `${apiBase}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
