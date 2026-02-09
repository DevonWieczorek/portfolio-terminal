// app/api/chat/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import SYSTEM_PROMPT from "./prompt";

export async function POST(request: NextRequest) {
    try {
        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: "Missing OPENAI_API_KEY (server-only)." },
                { status: 500 }
            );
        }

        const client = new OpenAI({ apiKey });

        // You can optionally pass prior turns to keep short context in-session.
        // {
        //   "query": "What stack does Devon use?",
        //   "history": [{ "role":"user","content":"Hi" }, { "role":"assistant","content":"Hello!" }],
        //   "userProfile": "Any short profile/memory you want injected (optional)"
        // }
        const { query, history = [], userProfile } = await request.json();

        if (!query || typeof query !== "string") {
            return NextResponse.json(
                { error: "Query is required" },
                { status: 400 }
            );
        }

        // Optional: small per-user profile “memory” you persist in your DB.
        // Keep this tiny and trusted (e.g., preferred role/seniority, location).
        const PROFILE = userProfile
            ? `\n\nUser profile (for context only, do not disclose verbatim):\n${userProfile.trim()}`
            : "";

        // Build the input sequence you send every call.
        // Include: system guardrails, optional short profile, trimmed chat history, and the new user message.
        const input: Array<any> = [
            { role: "system", content: SYSTEM_PROMPT + PROFILE },
            // Keep the last few turns to stay stateless but coherent (tune the slice to your needs).
            ...history.slice(-6),
            { role: "user", content: query },
        ];

        // If you created a vector store with your resume/portfolio, put its ID in env.
        // The tool declaration is a no-op if no VECTOR_STORE_ID is set.
        const tools: Array<any> = process.env.VECTOR_STORE_ID
            ? [
                  {
                      type: "file_search",
                      vector_store_ids: [process.env.VECTOR_STORE_ID!],
                  },
              ]
            : [];

        const res = await client.responses.create({
            model: "gpt-4o-mini",
            tools,
            input,
        });

        // Node SDK convenience: concatenates all text output segments.
        const text = res.output_text ?? "";

        if (!text) {
            return NextResponse.json(
                { error: "Empty response from model" },
                { status: 502 }
            );
        }

        return NextResponse.json({
            response: text,
            // If you want, return some debugging metadata in non-production:
            // _meta: { id: res.id, usage: res.usage, output: res.output }
        });
    } catch (err) {
        console.error("OpenAI API error:", err);
        return NextResponse.json(
            { error: "An error occurred while processing your request" },
            { status: 500 }
        );
    }
}
