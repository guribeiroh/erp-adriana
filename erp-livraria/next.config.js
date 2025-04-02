/** @type {import('next').NextConfig} */
const nextConfig = {
  // Configuração para ignorar erros durante a compilação
  webpack: (config, { isServer }) => {
    // Resolver problemas de dependências nativas
    config.externals = [...config.externals, 'canvas', 'jsdom'];
    return config;
  },
  eslint: {
    // Desativa a verificação de ESLint durante o build na produção
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Desativa a verificação de tipos durante o build na produção
    ignoreBuildErrors: true,
  },
  experimental: {
    // Configuração correta para serverActions
    serverActions: {
      allowedOrigins: ["*"],
      bodySizeLimit: "2mb"
    }
  },
  // Garante que o caminho base seja configurado corretamente
  trailingSlash: false,
  
  // Configurações para lidar com arquivos estáticos
  images: {
    domains: ['tddcvbsrfwtogmqclxon.supabase.co'],
    unoptimized: true
  }
};

module.exports = nextConfig; 