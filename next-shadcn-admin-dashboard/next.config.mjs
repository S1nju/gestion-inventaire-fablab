/** @type {import('next').NextConfig} */
const nextConfig = {
  // React Compiler can noticeably increase dev compile time and memory usage.
  reactCompiler: false,
  allowedDevOrigins: ["172.22.14.4"],
  experimental: {
    // Reduce module parse/bundle work for heavy UI libraries.
    optimizePackageImports: ["lucide-react", "recharts", "date-fns"],
  },
  // Keep fewer inactive pages in memory during development.
  onDemandEntries: {
    maxInactiveAge: 30 * 1000,
    pagesBufferLength: 2,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
  async redirects() {
    return [
      {
        source: "/dashboard",
        destination: "/dashboard/default",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
