module.exports = {
    presets: ["next/babel"],
    plugins: [
        [
            "conditional-compilation",
            {
                // Used for conditional comments
                DEBUG: process.env.NEXT_PUBLIC_DEBUG === "true",
            },
        ],
    ],
};
