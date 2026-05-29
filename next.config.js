/** @type {import('next').NextConfig} */
const nextConfig = {
    turbopack: {
        root: import.meta.dirname,
    },
    allowedDevOrigins: ["localhost", "127.0.0.1", "192.168.10.5", "192.168.18.5", "192.168.80.1"],
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination: "http://127.0.0.1:8000/api/:path*",
            },
        ];
    },
};

export default nextConfig;
