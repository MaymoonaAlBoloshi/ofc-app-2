export default {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
  serverExternalPackages: ["playwright-core"],
  experimental: { workerThreads: true, cpus: 2 },
  outputFileTracingRoot: process.cwd(),
};
