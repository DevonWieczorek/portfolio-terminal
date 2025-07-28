"use client";

import {
	useState,
	useRef,
	useEffect,
	type FC,
	type ChangeEvent,
	type KeyboardEvent,
} from "react";
import Markdown from "react-markdown";
import { isEnterKeyPress } from "@/utils/keyboard";
import { removeCitations } from "@/utils/formatting";
import styles from "@/styles/AskGPT.module.scss";

type FormattedResponseProps = {
	response: string;
	query?: string;
	onShowResponse?: () => void;
};

const FormattedResponse: FC<FormattedResponseProps> = ({
	response,
	query,
	onShowResponse,
}) => {
	useEffect(() => {
		if (onShowResponse && response) {
			onShowResponse();
		}
	}, [response, onShowResponse]);

	if (response) {
		return (
			<div className={styles.askGpt}>
				{query && <div>{query}</div>}
				<div>
					<Markdown>{response}</Markdown>
				</div>
			</div>
		);
	}
	return null;
};

const AskGPT: FC<{ onShowResponse: () => void }> = ({ onShowResponse }) => {
	const inputRef = useRef<HTMLInputElement>(null);
	const [query, setQuery] = useState<string>("");
	const [inputValue, setInputValue] = useState<string>("");
	const [displayQuery, setDisplayQuery] = useState<string>("");
	const [response, setResponse] = useState<string>("");
	const [isLoading, setIsLoading] = useState<boolean>(false);

	const queryOpenAIAssistant = async (query: string) => {
		try {
			setIsLoading(true);
			const res = await fetch("/api/gpt", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ query }),
			});

			if (!res.ok) {
				throw new Error("Failed to fetch response");
			}

			const data = await res.json();
			if (data.error) {
				setFormattedResponse(data.error);
			} else {
				setFormattedResponse(data.response);
			}
		} catch (error) {
			console.error("Error:", error);
			setFormattedResponse(
				"An error occurred while processing your request."
			);
		} finally {
			setIsLoading(false);
		}
	};

	const setFormattedResponse = (response: string) => {
		if (response) {
			const formattedResponse = removeCitations(response);
			setResponse(formattedResponse);
		}
	};

	const handleQueryChange = (event: ChangeEvent<HTMLInputElement>) => {
		setInputValue(event.target.value);
		setQuery(event.target.value);
	};

	const handleSubmit = async () => {
		if (!query || isLoading) return;

		if (inputRef?.current) {
			setInputValue("asking devon-gpt, this may take a moment... ");
			setDisplayQuery(query);
			inputRef.current.blur();
		}

		await queryOpenAIAssistant(query);
	};

	const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (isEnterKeyPress(event)) {
			handleSubmit();
		}
	};

	useEffect(() => {
		if (inputRef?.current) {
			inputRef.current.focus();
		}
	}, []);

	if (response) {
		return (
			<FormattedResponse
				response={response}
				query={query}
				onShowResponse={onShowResponse}
			/>
		);
	}

	return (
		<div className={styles.askGpt}>
			{displayQuery ? (
				<div>{displayQuery}</div>
			) : (
				<div>press ENTER to submit:</div>
			)}
			<div className={styles.inputArea}>
                                <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onKeyDown={handleKeyPress}
                                        onChange={handleQueryChange}
                                        placeholder="ask a question to devon-gpt..."
                                        className={styles.askGptInput}
                                        disabled={isLoading}
                                />
				<button
					onClick={handleSubmit}
					className={styles.askGptButton}
					disabled={isLoading}
				>
					submit
				</button>
			</div>
		</div>
	);
};

export default AskGPT;
