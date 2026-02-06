/** @type {import('next').NextConfig} */
const nextConfig = {
    output: "standalone",
    eslint: {
        ignoreDuringBuilds: false,
    },
    webpack: (config, { isServer }) => {
        config.module.rules.push({
            test: /\.(js|ts|tsx)$/,
            exclude: /node_modules/,
            enforce: "pre",
            use: [
                {
                    loader: "ifdef-loader",
                    options: {
                        DEBUG: process.env.NEXT_PUBLIC_DEBUG === "true",
                        VERSION: 1,
                        "ifdef-verbose": false,
                        "ifdef-triple-slash": false,
                    },
                },
            ],
        });
        return config;
    },
};

module.exports = nextConfig;
