module.exports = {
	testEnvironment: "jsdom",
	setupFilesAfterEnv: [
		"@testing-library/jest-dom",
		"<rootDir>/jest.setup.js",
	],
       moduleNameMapper: {
               "^@/(.*)\\.module\\.(css|less|scss|sass)$": "identity-obj-proxy",
               "^@/(.*)\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
               "\\.module\\.(css|less|scss|sass)$": "identity-obj-proxy",
               "\\.(css|less|scss|sass)$": "<rootDir>/__mocks__/styleMock.js",
               "^@/(.*)$": "<rootDir>/src/$1",
       },

        transform: {
                "^.+\\.(js|jsx|ts|tsx)$": [
                        "@swc/jest",
                        {
                                jsc: {
                                        transform: {
                                                react: {
                                                        runtime: "automatic",
                                                },
                                        },
                                },
                        },
                ],
        },
	testPathIgnorePatterns: ["/node_modules/", "/.next/"],
	// transformIgnorePatterns: [
	// 	"/node_modules/(?!react-markdown|remark-.*|unified|bail|trough|vfile|is-plain-obj|mdast-util-.*|micromark-.*|decode-named-character-reference|character-entities-.*)/",
	// ],
	transformIgnorePatterns: [
		"/node_modules/(?!react-markdown|remark-.*|unified|bail|trough|vfile|is-plain-obj|mdast-util-.*|micromark-.*|decode-named-character-reference|character-entities-.*|devlop)/",
	],
};
