import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
	plugins: [react()],
	build: {
		rollupOptions: {
			input: {
				sidepanel: resolve(__dirname, "sidepanel.html"),
				background: resolve(__dirname, "src/background/background.ts"),
				// Added: Knowledge graph page HTML entry
				graph: resolve(__dirname, "graph.html"),
				'content-injector': resolve(__dirname, 'src/lib/injector/content-injector.ts'),
			},
			output: {
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background") {
						return "[name].js";
					}
					// Output 'content-injector' to dist root so it matches manifest.json web_accessible_resources
					if (chunkInfo.name === "content-injector") {
						return "[name].js";
					}
					// Output 'graph' entry to dist root for direct access
					if (chunkInfo.name === "graph") {
						return "assets/[name].js"; // graph's main.tsx will be here
					}
					return "assets/[name].js";
				},
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
			},
		},
	},
});
