import { memo } from "react";
import { useExperience } from "@/lib/stores/useExperience";
import styles from "@/styles/Message.module.scss";

interface MessageProps {
    text?: string;
    className?: string;
}

const Message = memo(({ text = "", className }: MessageProps) => {
    const trimmedText = text.trim();
    // Select only what's needed to prevent unnecessary rerenders
    const mode = useExperience(state => state.mode);

    // Hide messages when swapping experiences
    if (!trimmedText || mode === "terminal") {
        return null;
    }

    return (
        <div
            className={`${styles.message}${className ? ` ${className}` : ""}`}
            role="status"
            aria-live="polite"
        >
            <span
                className={styles.messageContent}
                // Messages are defined in source and treated as trusted content.
                dangerouslySetInnerHTML={{ __html: trimmedText }}
            />
        </div>
    );
});
Message.displayName = "Message";

export default Message;
