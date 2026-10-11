import { readFileSync } from "node:fs";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { TextItem } from "pdfjs-dist/types/src/display/api";

export interface Span {
    text: string;
    bold: boolean;
    italic: boolean;
}

export interface Line {
    page: number;
    x: number;
    y: number;
    right: number;
    size: number;
    spans: Span[];
    text: string;
}

interface PdfFont {
    name: string;
    // An array for simple fonts, an object keyed by char code otherwise.
    widths?: Record<number, number | null>;
    toUnicode?: { _map?: (string | undefined)[] };
}

// macOS Quartz (Pages "Export to PDF") omits ligature glyphs from the font's
// ToUnicode map and subsets fonts without glyph names, so every extractor
// falls back to the raw char code ("So+ware", "transla>ng"). A ligature's
// advance width is fixed per font, so it identifies the glyph reliably.
const LIGATURES_BY_WIDTH: Record<string, Record<number, string>> = {
    Calibri: { 557: "ti", 616: "ft", 634: "tt", 856: "tti" },
    "Calibri-Bold": { 585: "ti", 636: "ft" },
};

const stripSubsetPrefix = (name: string) => name.replace(/^[A-Z]{6}\+/, "");

// Maps the fallback character pdf.js emits for each unmapped glyph to its
// advance width, so a lone glyph can be confirmed before it is replaced.
const getUnmappedGlyphs = (font: PdfFont) => {
    const unmapped = new Map<string, number>();
    const map = font.toUnicode?._map;
    if (!map || !font.widths) return unmapped;

    for (const [code, width] of Object.entries(font.widths)) {
        if (width != null && !map[Number(code)]) {
            unmapped.set(String.fromCharCode(Number(code)), width);
        }
    }
    return unmapped;
};

const repairLigature = (item: TextItem, font: PdfFont, warnings: string[]) => {
    const glyphWidth = getUnmappedGlyphs(font).get(item.str);
    if (glyphWidth === undefined) return item.str;

    // Quartz positions each ligature as its own run; a genuine character of
    // the same code would be part of a longer run or have a different width.
    const fontSize = Math.hypot(item.transform[0], item.transform[1]);
    if (Math.abs(item.width - (glyphWidth * fontSize) / 1000) > 0.5) {
        return item.str;
    }

    const baseName = stripSubsetPrefix(font.name);
    const ligature = LIGATURES_BY_WIDTH[baseName]?.[glyphWidth];
    if (!ligature) {
        warnings.push(
            `Unknown unmapped glyph "${item.str}" (${baseName}, width ${glyphWidth})`
        );
        return item.str;
    }
    return ligature;
};

const appendSpan = (line: Line, span: Span) => {
    const last = line.spans[line.spans.length - 1];
    if (last && last.bold === span.bold && last.italic === span.italic) {
        last.text += span.text;
    } else {
        line.spans.push(span);
    }
    line.text += span.text;
};

export const extractResumeLines = async (pdfPath: string) => {
    const data = new Uint8Array(readFileSync(pdfPath));
    const pdf = await getDocument({
        data,
        fontExtraProperties: true,
        verbosity: 0,
    }).promise;

    const lines: Line[] = [];
    const warnings: string[] = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        // Fonts are only loaded into commonObjs once the page is parsed.
        await page.getOperatorList();
        const { items } = await page.getTextContent();

        let line: Line | undefined;
        for (const item of items) {
            if (!("str" in item) || item.str === "") continue;

            const font: PdfFont = page.commonObjs.get(item.fontName);
            const [, , , , x, y] = item.transform;
            const isWhitespace = item.str.trim() === "";

            if (!line || Math.abs(line.y - y) > line.size / 2) {
                if (isWhitespace) continue;
                line = {
                    page: pageNumber,
                    x,
                    y,
                    right: x,
                    size: Math.round(item.height),
                    spans: [],
                    text: "",
                };
                lines.push(line);
            }

            appendSpan(line, {
                text: repairLigature(item, font, warnings),
                bold: /bold/i.test(font.name),
                italic: /italic|oblique/i.test(font.name),
            });
            line.right = Math.max(line.right, x + item.width);
            if (!isWhitespace) {
                line.size = Math.max(line.size, Math.round(item.height));
            }
        }
        page.cleanup();
    }

    await pdf.destroy();

    for (const line of lines) {
        line.text = line.text.trim();
    }
    return { lines: lines.filter(line => line.text), warnings };
};
