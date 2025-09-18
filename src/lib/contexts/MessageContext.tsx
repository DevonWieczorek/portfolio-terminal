import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

interface MessageContextValue {
        message: string;
        setMessage: (text: string) => void;
        clearMessage: () => void;
}

const MessageContext = createContext<MessageContextValue | undefined>(undefined);

interface MessageProviderProps {
        children: ReactNode;
}

export function MessageProvider({ children }: MessageProviderProps) {
        const [message, setMessageState] = useState<string>("");

        const setMessage = useCallback((text: string) => {
                setMessageState(text);
        }, []);

        const clearMessage = useCallback(() => {
                setMessageState("");
        }, []);

        const value = useMemo(
                () => ({
                        message,
                        setMessage,
                        clearMessage,
                }),
                [message, setMessage, clearMessage],
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
