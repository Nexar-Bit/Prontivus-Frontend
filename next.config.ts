import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: false, // Temporarily disabled - can cause async component errors
	transpilePackages: [
		"react-big-calendar",
		"uncontrollable",
	],
	// Turbopack is disabled via NEXT_SKIP_TURBOPACK environment variable
	// This prevents HMR chunk loading errors
	// Add headers to prevent caching of HTML pages
	async headers() {   
		return [
			{
				// Apply to all routes
				source: '/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
					},
					{
						key: 'Pragma',
						value: 'no-cache',
					},
					{
						key: 'Expires',
						value: '0',
					},
					{
						key: 'X-Content-Type-Options',
						value: 'nosniff',
					},
				],
			},
			{
				// Allow caching for static assets only
				source: '/_next/static/:path*',
				headers: [
					{
						key: 'Cache-Control',
						value: 'public, max-age=31536000, immutable',
					},
				],
			},
		];
	},
};

export default nextConfig;
