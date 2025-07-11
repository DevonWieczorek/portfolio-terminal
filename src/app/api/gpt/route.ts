import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
	try {
		const { query } = await request.json();

		if (!query) {
			return NextResponse.json(
				{ error: "Query is required" },
				{ status: 400 }
			);
		}

		// Step 1: Create a thread
		const thread = await openai.beta.threads.create();

		// Step 2: Add a message to the thread
		await openai.beta.threads.messages.create(thread.id, {
			role: "user",
			content: query,
		});

		// Step 3: Run the assistant
		const run = await openai.beta.threads.runs.create(thread.id, {
			assistant_id: process.env.NEXT_PUBLIC_OPENAI_ASSISTANT_ID,
		});

		// Step 4: Check the run status
		let runStatus = await openai.beta.threads.runs.retrieve(
			thread.id,
			run.id
		);

		// Poll for status "completed"
		while (runStatus.status !== "completed") {
			await new Promise(resolve => setTimeout(resolve, 1000));
			runStatus = await openai.beta.threads.runs.retrieve(
				thread.id,
				run.id
			);
		}

		// Step 5: Retrieve the assistant's response
		const messages = await openai.beta.threads.messages.list(thread.id);

		// Get the last assistant message
		const assistantResponse = messages.data
			.filter(message => message.role === "assistant")
			.pop();

		if (assistantResponse && "text" in assistantResponse.content[0]) {
			const response = (
				assistantResponse.content[0] as {
					text: { value: string };
				}
			).text.value;
			return NextResponse.json({ response });
		} else {
			return NextResponse.json(
				{ error: "Unexpected response format" },
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("OpenAI API error:", error);
		return NextResponse.json(
			{ error: "An error occurred while processing your request" },
			{ status: 500 }
		);
	}
}
