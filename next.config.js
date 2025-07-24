const withLess = require("next-with-less");

/** @type {import('next').NextConfig} */
const nextConfig = withLess({
	output: 'standalone',
	// Optional: only include if you're using ESLint
	eslint: {
		ignoreDuringBuilds: false, // Set to true if you want to skip lint errors during `next build`
	},
	lessLoaderOptions: {
		lessOptions: {
		  javascriptEnabled: true,
		},
	},
});

module.exports = nextConfig;
