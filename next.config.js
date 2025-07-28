const isCodex = process.env.CI === 'true' && process.env.HOME === '/workspace';

/** @type {import('next').NextConfig} */
const baseConfig = {
	output: 'standalone',
	// Optional: only include if you're using ESLint
	eslint: {
		ignoreDuringBuilds: false, // Set to true if you want to skip lint errors during `next build`
	},
};

if (isCodex){
	module.exports = baseConfig;
} else {
	const withLess = require("next-with-less");

	const nextConfig = withLess({
		...baseConfig,
		lessLoaderOptions: {
			lessOptions: {
				javascriptEnabled: true,
			},
		},
	});

	module.exports = nextConfig;	
}
