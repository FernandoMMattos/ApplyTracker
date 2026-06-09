import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
  experimental: {
    typedRoutes: true,
  },
  // Ensures all ECS tasks in the same deployment use the same build ID.
  // GIT_HASH is injected by the CI pipeline (docker build --build-arg GIT_HASH=...)
  generateBuildId: async () => process.env.GIT_HASH ?? 'local',
}

export default nextConfig
