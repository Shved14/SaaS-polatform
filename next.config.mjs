/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Убрали предупреждение, так как Server Actions доступны по умолчанию
  // experimental: {
  //   serverActions: true
  // },
  // Конфигурация для работы с доменом и Nginx
  assetPrefix: process.env.NODE_ENV === 'production' ? undefined : '',
  trailingSlash: false,
  // Для корректной работы аутентификации
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ];
  },
};

export default nextConfig;

