import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";

interface MessageInteraction {
    onEnter?: () => void;
}

interface MessageContextValue {
    message: string;
    interaction: MessageInteraction | null;
    setMessage: (text: string, interaction?: MessageInteraction | null) => void;
    // With `text`, clears only if that message is the one showing
    clearMessage: (text?: string) => void;
}

interface MessageState {
    message: string;
    interaction: MessageInteraction | null;
}

const EMPTY_MESSAGE: MessageState = { message: "", interaction: null };

const MessageContext = createContext<MessageContextValue | undefined>(
    undefined
);

interface MessageProviderProps {
    children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
    const [{ message, interaction }, setState] =
        useState<MessageState>(EMPTY_MESSAGE);

    const setMessage = useCallback(
        (text: string, nextInteraction: MessageInteraction | null = null) => {
            setState({ message: text, interaction: nextInteraction });
        },
        []
    );

    // Compares against the latest state, not the last render's, so it's safe
    // to call from effect cleanups
    const clearMessage = useCallback((text?: string) => {
        setState(current =>
            text === undefined || current.message === text
                ? EMPTY_MESSAGE
                : current
        );
    }, []);

    const value = useMemo(
        () => ({
            message,
            interaction,
            setMessage,
            clearMessage,
        }),
        [message, interaction, setMessage, clearMessage]
    );

    return (
        <MessageContext.Provider value={value}>
            {children}
        </MessageContext.Provider>
    );
}

export function useMessage() {
    const context = useContext(MessageContext);

    if (!context) {
        throw new Error("useMessage must be used within a MessageProvider");
    }

    return context;
}
