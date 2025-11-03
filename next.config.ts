import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
	/* config options here */
	reactCompiler: false, // Temporarily disabled - can cause async component errors
	transpilePackages: [
		"react-big-calendar",
		"uncontrollable",
	],
	// Disable Turbopack temporarily to avoid caching issues
	// turbopack: {
	//   root: path.resolve(__dirname),
	// },
};

export default nextConfig;
