/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingIncludes: {
    "/api/leases/[id]/document": ["./templates/**"],
  },
};

module.exports = nextConfig;
