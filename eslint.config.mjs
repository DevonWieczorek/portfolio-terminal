import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import pluginTs from "@typescript-eslint/eslint-plugin";
import parserTs from "@typescript-eslint/parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all,
});

export default defineConfig([
    globalIgnores(["**/dist/", "**/*.min.js"]),
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: parserTs,
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            "@typescript-eslint": pluginTs,
        },
        settings: {
            react: {
                version: "detect",
            },
        },
        rules: {
            // Turn off the base rule for TS files
            "no-unused-vars": "off",
            "no-undef": "off", // TypeScript handles this, and it doesn't understand global types
            // Use the TS rule as a warning
            "@typescript-eslint/no-unused-vars": "warn",
            // Disable React import requirement (Next.js 14+ uses new JSX transform)
            "react/react-in-jsx-scope": "off",
        },
        extends: compat.extends(
            "next/core-web-vitals",
            "eslint:recommended",
            "plugin:react/recommended",
            "plugin:prettier/recommended"
        ),
    },
    {
        files: [
            "src/components/three/**/*.tsx",
            "src/components/three/**/*.ts",
        ],
        rules: {
            // Disable unknown property check for R3F primitives which use non-standard props
            "react/no-unknown-property": "off",
        },
    },
]);
