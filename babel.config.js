module.exports = {
	presets: [
		[
			"next/babel",
			{
				"preset-env": {
					modules: "commonjs",
				},
			},
		],
	],
	plugins: [
		"@babel/plugin-transform-private-methods",
		"@babel/plugin-proposal-private-property-in-object",
	],
};
