import { writeFileSync } from "node:fs";
import path from "node:path";
import { extractResumeLines, type Line } from "./lib/resume-pdf.mts";

const pdfFilePath = path.resolve(
    import.meta.dirname,
    "../src/assets/resume.pdf"
);
const outputFilePath = path.resolve(
    import.meta.dirname,
    "../src/assets/resume.md"
);

const BULLET = /^[•▪◦‣●]\s*/;

const isBold = (line: Line) => line.spans.every(span => span.bold);
const isItalic = (line: Line) => line.spans.every(span => span.italic);
const startsBold = (line: Line) => line.spans[0].bold && !isBold(line);

const formatSpans = (line: Line) =>
    line.spans
        .map(({ text, bold, italic }) => {
            const trimmed = text.trim();
            if (!trimmed || (!bold && !italic)) return text;
            const marker = bold ? "**" : "_";
            const leading = text.match(/^\s*/)?.[0] ?? "";
            const trailing = text.match(/\s*$/)?.[0] ?? "";
            return `${leading}${marker}${trimmed}${marker}${trailing}`;
        })
        .join("")
        .trim();

const mostCommon = (values: number[]) => {
    const counts = new Map<number, number>();
    for (const value of values) {
        counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return Array.from(counts).sort((a, b) => b[1] - a[1])[0][0];
};

const convertResumeToMarkdown = async () => {
    const { lines, warnings } = await extractResumeLines(pdfFilePath);
    warnings.forEach(warning => console.warn(warning));

    const bodySize = mostCommon(lines.map(line => line.size));
    const titleSize = Math.max(...lines.map(line => line.size));
    const pageRight = new Map<number, number>();
    for (const line of lines) {
        if (line.size !== bodySize) continue;
        pageRight.set(
            line.page,
            Math.max(pageRight.get(line.page) ?? 0, line.right)
        );
    }

    // A line wrapped if a space plus the next line's first word wouldn't have
    // fit after it.
    const wrapsInto = (prev: Line, next: Line) => {
        const firstWord = next.text.split(/\s/)[0];
        const wordWidth =
            ((next.right - next.x) * (firstWord.length + 1)) / next.text.length;
        return prev.right + wordWidth > (pageRight.get(prev.page) ?? Infinity);
    };

    const blocks: string[] = [];
    let previous: { line: Line; kind: "paragraph" | "bullet" } | undefined;

    for (const line of lines) {
        const text = formatSpans(line);
        const isBody = line.size === bodySize;

        if (
            previous &&
            isBody &&
            !BULLET.test(line.text) &&
            !startsBold(line) &&
            !isBold(line) &&
            !isItalic(line) &&
            (previous.kind === "bullet"
                ? line.x > previous.line.x
                : wrapsInto(previous.line, line))
        ) {
            const last = blocks.length - 1;
            const joiner = blocks[last].endsWith("-") ? "" : " ";
            blocks[last] += joiner + text;
            previous.line = { ...line, x: previous.line.x };
            continue;
        }

        previous = undefined;
        if (line.size === titleSize) {
            blocks.push(`# ${line.text}`);
        } else if (isBold(line) && line.size > bodySize) {
            blocks.push(`## ${line.text}`);
        } else if (isBold(line) && isBody) {
            blocks.push(`### ${line.text}`);
        } else if (BULLET.test(line.text)) {
            blocks.push(`- ${text.replace(BULLET, "")}`);
            previous = { line, kind: "bullet" };
        } else {
            blocks.push(text);
            if (isBody && !isItalic(line)) {
                previous = { line, kind: "paragraph" };
            }
        }
    }

    const markdown = blocks.reduce((output, block, i) => {
        const isListItem = block.startsWith("- ");
        const continuesList = isListItem && blocks[i - 1]?.startsWith("- ");
        return i === 0
            ? block
            : output + (continuesList ? "\n" : "\n\n") + block;
    }, "");

    writeFileSync(outputFilePath, `${markdown}\n`, "utf8");
    console.log(`Markdown file created at ${outputFilePath}`);
};

convertResumeToMarkdown().catch((error: unknown) => {
    console.error("Error converting PDF to Markdown:", error);
    process.exitCode = 1;
});
