/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./sidepanel.html", // Ensure scanning side panel HTML
		"./graph.html", // Include knowledge graph HTML
		"./src/**/*.{js,ts,jsx,tsx}", // Scan all JS/TS/JSX/TSX files
	],
	theme: {
		extend: {},
	},
	plugins: [],
};
