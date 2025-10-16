import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MessageInteraction {
        onEnter?: () => void;
}

interface MessageContextValue {
        message: string;
        interaction: MessageInteraction | null;
        setMessage: (text: string, interaction?: MessageInteraction | null) => void;
        clearMessage: () => void;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
        children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
        const [message, setMessageState] = useState<string>("");
        const [interaction, setInteraction] = useState<MessageInteraction | null>(null);

        const setMessage = useCallback((text: string, nextInteraction: MessageInteraction | null = null) => {
                setMessageState(text);
                setInteraction(nextInteraction);
        }, []);

        const clearMessage = useCallback(() => {
                setMessageState("");
                setInteraction(null);
        }, []);

        const value = useMemo(
                () => ({
                        message,
                        interaction,
                        setMessage,
                        clearMessage,
                }),
                [message, interaction, setMessage, clearMessage],
        );

        return <MessageContext.Provider value={value}>{children}</MessageContext.Provider>;
}

export function useMessage() {
        const context = useContext(MessageContext);

        if (!context) {
                throw new Error("useMessage must be used within a MessageProvider");
        }

        return context;
}
