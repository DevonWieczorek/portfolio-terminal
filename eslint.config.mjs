import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";


export default [
	{files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"]},
	{languageOptions: { globals: globals.browser }},
	pluginJs.configs.recommended,
	...tseslint.configs.recommended,
	pluginReact.configs.flat.recommended,
	{
		languageOptions: {
			parserOptions: {
				ecmaFeatures: {
					jsx: true, // Enable JSX
				},
			},
		},
	},
	{
		rules: {
			'react/react-in-jsx-scope': 'off', // Disable the rule that requires React in scope
	  'indent': ['error', 'tab'],
		},
	},
];