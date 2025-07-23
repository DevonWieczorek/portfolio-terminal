/** @type {import('next').NextConfig} */
const nextConfig = {
	output: "standalone",
	// Optional: only include if you're using ESLint
	eslint: {
		ignoreDuringBuilds: false, // Set to true if you want to skip lint errors during `next build`
	},
};

module.exports = nextConfig;
