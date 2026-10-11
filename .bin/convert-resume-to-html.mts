import { writeFileSync } from "node:fs";
import path from "node:path";
import { extractResumeLines } from "./lib/resume-pdf.mts";

const pdfFilePath = path.resolve(
    import.meta.dirname,
    "../src/assets/resume.pdf"
);
const outputFilePath = path.resolve(
    import.meta.dirname,
    "../src/assets/resume.html"
);

const HTML_ENTITIES: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
};

const escapeHtml = (text: string) =>
    text.replace(/[&<>"']/g, char => HTML_ENTITIES[char]);

const convertResumeToHtml = async () => {
    const { lines, warnings } = await extractResumeLines(pdfFilePath);
    warnings.forEach(warning => console.warn(warning));

    const textContent = lines
        .map((line, i) => {
            const isNewPage = i > 0 && lines[i - 1].page !== line.page;
            return (isNewPage ? "\n" : "") + line.text;
        })
        .join("\n");

    const htmlContent = `<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="utf-8" />
        <title>Resume</title>
    </head>
    <body>
        <pre>${escapeHtml(textContent)}</pre>
    </body>
</html>
`;

    writeFileSync(outputFilePath, htmlContent, "utf8");
    console.log(`HTML file created at ${outputFilePath}`);
};

convertResumeToHtml().catch((error: unknown) => {
    console.error("Error converting PDF to HTML:", error);
    process.exitCode = 1;
});
