import styles from "@/styles/Message.module.scss";

interface MessageProps {
        text?: string;
        className?: string;
}

function Message({ text = "", className }: MessageProps) {
        const trimmedText = text.trim();

        if (!trimmedText) {
                return null;
        }

        return (
                <div className={`${styles.message}${className ? ` ${className}` : ""}`} role="status" aria-live="polite">
                        <span>{trimmedText}</span>
                </div>
        );
}

export default Message;
