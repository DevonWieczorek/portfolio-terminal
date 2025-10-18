import { defineConfig, globalIgnores } from "eslint/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";
import pluginTs from "@typescript-eslint/eslint-plugin";

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
        plugins: {
            "@typescript-eslint": pluginTs,
        },
        rules: {
            // Turn off the base rule for TS files
            "no-unused-vars": "off",
            // Use the TS rule as a warning
            "@typescript-eslint/no-unused-vars": "warn",
        },
        extends: compat.extends(
            "next/core-web-vitals",
            "eslint:recommended",
            "plugin:react/recommended",
            "plugin:prettier/recommended"
        ),
    },
]);
