/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./sidepanel.html", // Ensure scanning side panel HTML
		"./graph.html", // Include knowledge graph HTML
		"./src/**/*.{js,ts,jsx,tsx}", // Scan all JS/TS/JSX/TSX files
	],
	theme: {
		extend: {
			keyframes: {
				flash: {
					"0%, 100%": { backgroundColor: "transparent" },
					"50%": { backgroundColor: "rgba(168, 85, 247, 0.15)" }, // A light purple flash
				},
			},
			animation: {
				flash: "flash 1.2s ease-in-out",
			},
		},
	},
	plugins: [],
};
