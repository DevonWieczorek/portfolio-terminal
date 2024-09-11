import { useState, useEffect, useRef, useCallback, type FC } from "react";
import AskGPT from "../components/AskGPT";
import Contact from "../components/Contact";
import FunFact from "../components/FunFact";
import HelpMenu from "../components/HelpMenu";
import Resume from "../components/Resume";
import { isEnterKeyPress } from "../utils/keyboard";
import s from "../styles/Terminal.less";

interface TerminalProps {
  onCommand: (command: string) => void;
}

const Terminal: FC<TerminalProps> = ({ onCommand }) => {
  const bodyRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [output, setOutput] = useState<any>([]);

  const focusInput = useCallback(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const handleSetOutput = (newOutput: any) => {
    const _newOutput = (typeof newOutput === 'string') ? <div>{newOutput}</div> : newOutput;
    const _output: any[] = [...output, _newOutput];
    setOutput(_output);

    // TODO: replace with withScrollToTop once fixed
    window.scrollTo({
      top: document.body.scrollHeight,
      behavior: 'smooth'
    });
  }

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
        handleSetOutput(<AskGPT onShowResponse={focusInput}/>);
        break;
      case "fun-fact":
        onCommand("fun-fact");
        handleSetOutput(<FunFact/>);
        break;
      case "help":
        onCommand("help");
        handleSetOutput(<HelpMenu/>);
        break;
      case "clear":
        setOutput([]);
        break;
      default:
        handleSetOutput(`Command not recognized: ${command}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (isEnterKeyPress(event)) {
      const command = (event.target as HTMLInputElement).value;
      handleCommand(command);
      (event.target as HTMLInputElement).value = "";
    }
  };

  useEffect(() => {
    focusInput();
  }, [inputRef, focusInput]);

  useEffect(() => {
    handleCommand("clear");
    handleCommand("help");
  }, []);

  return (
    <div className={s.terminal}>
      <div className={s.terminalHeader}>
        <span>DevonGPT: Devon Wieczorek's Personal Assistant</span>
      </div>
      <div ref={bodyRef} className={s.terminalBody}>
        <div className={s.terminalOutput}>
            {output}
        </div>
        <input
          ref={inputRef}
          type="text"
          className={s.terminalInput}
          onKeyPress={handleKeyPress}
          placeholder="Type a command..."
        />
      </div>
    </div>
  );
};

export default Terminal;