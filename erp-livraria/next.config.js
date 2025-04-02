/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para ignorar erros durante a compilação
  webpack: (config, { isServer }) => {
    // Resolver problemas de dependências nativas
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
};

module.exports = nextConfig; 