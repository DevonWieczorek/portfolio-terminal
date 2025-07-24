"use client";

import {
	useState,
	useEffect,
	useRef,
	useCallback,
	type FC,
	type ReactNode,
	type KeyboardEvent,
} from "react";
import AskGPT from "./AskGPT";
import Contact from "./Contact";
import FunFact from "./FunFact";
import HelpMenu from "./HelpMenu";
import Resume from "./Resume";
import { isEnterKeyPress } from "@/utils/keyboard";
import styles from "@/styles/Terminal.module.less";

interface TerminalProps {
	onCommand: (command: string) => void;
}

const Terminal: FC<TerminalProps> = ({ onCommand }) => {
	const inputRef = useRef<HTMLInputElement>(null);
        const [output, setOutput] = useState<ReactNode[]>([]);
        const keyRef = useRef(0);

	const focusInput = useCallback(() => {
		if (inputRef?.current) {
			inputRef.current.focus();
		}
	}, []);

        const handleSetOutput = useCallback((newOutput: ReactNode | string) => {
                const key = keyRef.current++;
                const element =
                        typeof newOutput === "string" ? (
                                <div key={key}>{newOutput}</div>
                        ) : (
                                <div key={key}>{newOutput}</div>
                        );
                setOutput(prevOutput => [...prevOutput, element]);
        }, []);

	// Scroll to bottom whenever output changes
	useEffect(() => {
		window.scrollTo({
			top: document.body.scrollHeight,
			behavior: "smooth",
		});
	}, [output]);

	const handleCommand = (command: string): void => {
		switch (command.toLowerCase()) {
			case "resume":
				onCommand("resume");
				setOutput([]);
				handleSetOutput(<Resume />);
				break;
			case "contact":
				onCommand("contact");
				handleSetOutput(<Contact />);
				break;
			case "ask":
				onCommand("ask");
				handleSetOutput(<AskGPT onShowResponse={focusInput} />);
				break;
			case "fun-fact":
				onCommand("fun-fact");
				handleSetOutput(<FunFact />);
				break;
			case "help":
				onCommand("help");
				handleSetOutput(<HelpMenu />);
				break;
			case "clear":
				setOutput([]);
				break;
			default:
				handleSetOutput(`Command not recognized: ${command}`);
		}
	};

	const handleKeyPress = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (isEnterKeyPress(event)) {
			const command = (event.target as HTMLInputElement).value;
			handleCommand(command);
			(event.target as HTMLInputElement).value = "";
		}
	};

	useEffect(() => {
		focusInput();
	}, [focusInput]);

	useEffect(() => {
		handleCommand("clear");
		handleCommand("help");
	}, []);

	return (
		<div className={styles.terminal}>
			<div className={styles.terminalHeader}>
				<span>DevonGPT: Devon Wieczorek&apos;s Personal Assistant</span>
			</div>
			<div className={styles.terminalBody}>
				<div className={styles.terminalOutput}>{output}</div>
                                <input
                                        ref={inputRef}
                                        type="text"
                                        className={styles.terminalInput}
                                        onKeyDown={handleKeyPress}
                                        placeholder="Type a command..."
                                />
			</div>
		</div>
	);
};

export default Terminal;
