import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	base: "./", // 使用相對路徑，這對 Chrome extension 很重要
	build: {
		rollupOptions: {
			input: {
				// 側邊欄的 HTML 入口
				sidepanel: resolve(__dirname, "sidepanel.html"),
				// 新增：背景腳本作為一個獨立的 JavaScript 入口
				background: resolve(__dirname, "src/background/background.ts"),
				// content script 也可能需要作為獨立入口，但目前我們還沒用到
				// content: resolve(__dirname, 'src/content/content.js'),
			},
			output: {
				// 設定 entryFileNames，讓 'background' 入口直接輸出到 dist 根目錄
				// 其他的入口 (如 sidepanel) 則保留在 assets 資料夾內
				entryFileNames: (chunkInfo) => {
					if (chunkInfo.name === "background") {
						return "[name].js"; // background.js 直接輸出到 dist/background.js
					}
					return "assets/[name].js"; // 其他的輸出到 dist/assets/
				},
				chunkFileNames: `assets/[name].js`,
				assetFileNames: `assets/[name].[ext]`,
			},
		},
	},
});
