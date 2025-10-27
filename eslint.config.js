// eslint.config.js
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";

export default tseslint.config(
	{
		ignores: ["dist/**", "node_modules/**", "*.config.js"],
	},
	{
		files: ["**/*.{ts,tsx}"],
		languageOptions: {
			globals: {
				...globals.browser,
				...globals.node,
			},
			parser: tseslint.parser,
			parserOptions: {
				ecmaFeatures: {
					jsx: true,
				},
				ecmaVersion: "latest",
				sourceType: "module",
				project: "./tsconfig.json",
			},
		},
		plugins: {
			react: pluginReact,
		},
		rules: {
			"react/jsx-uses-react": "error",
			"react/jsx-uses-vars": "error",
			"@typescript-eslint/no-explicit-any": "off",
			"@typescript-eslint/no-unused-vars": [
				"error",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
				},
			],
		},
	},
	...tseslint.configs.recommended
);
