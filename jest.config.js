module.exports = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: [
		"@testing-library/jest-dom",
		"<rootDir>/jest.setup.js",
	],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/src/$1",

		// ✅ CSS Modules go through identity-obj-proxy
		"\\.module\\.(css|less|scss|sass)$": "identity-obj-proxy",

		// ✅ Global styles go to a mock (we’ll add this file next)
		"\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
	},

	transform: {
		"^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
	},
	testPathIgnorePatterns: ["/node_modules/", "/.next/"],
	// transformIgnorePatterns: [
	// 	"/node_modules/(?!react-markdown|remark-.*|unified|bail|trough|vfile|is-plain-obj|mdast-util-.*|micromark-.*|decode-named-character-reference|character-entities-.*)/",
	// ],
	transformIgnorePatterns: [
		"/node_modules/(?!react-markdown|remark-.*|unified|bail|trough|vfile|is-plain-obj|mdast-util-.*|micromark-.*|decode-named-character-reference|character-entities-.*|devlop)/",
	],
};
