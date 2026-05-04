/** @type {import('next').NextConfig} */

const nextConfig = {
	turbopack: {},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "**",
			},
		],
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
	allowedDevOrigins: ["*.theopenbuilder.com"],
	devIndicators: false,
	serverExternalPackages: ["google-play-scraper"],
};

export default nextConfig;
