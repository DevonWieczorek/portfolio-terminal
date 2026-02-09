import path from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

export default [
    ...compat.extends(
        "next/core-web-vitals",
        "next/typescript",
        "plugin:prettier/recommended"
    ),
    {
        ignores: ["**/dist/**", "**/*.min.js", ".next/**", "out/**"],
    },
    {
        files: ["**/*.ts", "**/*.tsx"],
        rules: {
            "no-unused-vars": "off",
            "no-undef": "off",
            "@typescript-eslint/no-unused-vars": "warn",
            "@typescript-eslint/no-require-imports": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "react/react-in-jsx-scope": "off",
        },
    },
    {
        files: ["src/components/three/**/*.{ts,tsx}"],
        rules: {
            // R3F primitives use non-standard DOM prop names.
            "react/no-unknown-property": "off",
        },
    },
];
