/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./sidepanel.html", // 確保掃描側邊欄的 HTML
		"./src/**/*.{js,ts,jsx,tsx}", // 掃描所有的 JS/TS/JSX/TSX 檔案
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
