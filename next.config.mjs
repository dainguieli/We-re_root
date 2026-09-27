import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  agentRules: false,
  webpack(config) {
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      'react-native$': path.resolve(__dirname, 'src/compat/react-native.tsx'),
      '@expo/vector-icons$': path.resolve(__dirname, 'src/compat/vector-icons.tsx'),
    };

    return config;
  },
};

export default nextConfig;
