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

type AskGPTProps = {
    onShowResponse: () => void;
    initialQuery?: string;
};

const AskGPT: FC<AskGPTProps> = ({ onShowResponse, initialQuery = "" }) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const hasSubmittedInitialQuery = useRef(false);
    const [query, setQuery] = useState<string>(initialQuery);
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

            // Error bodies may not be JSON; only tolerate that when !res.ok.
            const data = res.ok
                ? await res.json()
                : await res.json().catch(() => ({}));
            if (!res.ok && !data.error) {
                throw new Error("Failed to fetch response");
            }

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

    const handleSubmit = async (submittedQuery: string = query) => {
        if (!submittedQuery || isLoading) return;

        if (inputRef?.current) {
            setInputValue("asking devon-gpt, this may take a moment... ");
            setDisplayQuery(submittedQuery);
            inputRef.current.blur();
        }

        await queryOpenAIAssistant(submittedQuery);
    };

    const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
        if (isEnterKeyPress(event)) {
            handleSubmit();
        }
    };

    useEffect(() => {
        // `ask <question>` submits immediately; the ref guards against
        // StrictMode re-running this effect and sending a duplicate request.
        if (initialQuery) {
            if (!hasSubmittedInitialQuery.current) {
                hasSubmittedInitialQuery.current = true;
                handleSubmit(initialQuery);
            }
            return;
        }

        if (inputRef?.current) {
            inputRef.current.focus();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
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
                    onClick={() => handleSubmit()}
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
