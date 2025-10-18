import { useExperience } from "@/lib/stores/useExperience";
import styles from "@/styles/Message.module.scss";

interface MessageProps {
        text?: string;
        className?: string;
}

function Message({ text = "", className }: MessageProps) {
        const trimmedText = text.trim();
        const { mode } = useExperience();

        // Hide messages when swapping experiences
        if (!trimmedText || mode === 'terminal') {
                return null;
        }

        return (
                <div className={`${styles.message}${className ? ` ${className}` : ""}`} role="status" aria-live="polite">
                        <span>{trimmedText}</span>
                </div>
        );
}

export default Message;
