import nextConfig from 'eslint-config-next';

const config = [
  ...nextConfig,
  {
    ignores: ['.yoyo/**', '.worktrees/**'],
  },
];

export default config;
