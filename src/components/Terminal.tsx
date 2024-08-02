import React, { useState, useEffect } from "react";
import s from "../styles/Terminal.less";

interface TerminalProps {
  onCommand: (command: string) => void;
}

const Terminal: React.FC<TerminalProps> = ({ onCommand }) => {
  const [output, setOutput] = useState<any>([]);

  const HelpMenu = () => {
    return (
      <div>
        <p>commands:</p>
        <ul>
          <li>resume - todo: add resume</li>
          <li>contact - find out where to reach Devon</li>
          <li>ask - asks AI Devon a question</li>
          <li>help - displays this menu</li>
        </ul>
      </div>
    );
  }

  const handleSetOutput = (newOutput: any) => {
    const _newOutput = (typeof newOutput === 'string') ? <div>{newOutput}</div> : newOutput;
    const _output: any[] = [...output, _newOutput];
    setOutput(_output);
  }

  const handleCommand = (command: string) => {
    switch (command.toLowerCase()) {
      case "resume":
        onCommand("resume");
        handleSetOutput("Displaying Resume...");
        break;
      case "contact":
        onCommand("contact");
        handleSetOutput("Displaying Contact Information...");
        break;
      case "ask":
        onCommand("ask");
        handleSetOutput("Ask your query...");
        break;
      case "help":
        onCommand("help");
        handleSetOutput(HelpMenu);
        break;
      default:
        handleSetOutput(`Command not recognized: ${command}`);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const command = (event.target as HTMLInputElement).value;
      handleCommand(command);
      (event.target as HTMLInputElement).value = "";
    }
  };

  useEffect(() => {
    handleCommand("help");
  }, []);

  return (
    <div className={s.terminal}>
      <div className={s.terminalHeader}>
        <span>Devon's Terminal Portfolio</span>
      </div>
      <div className={s.terminalBody}>
        <div className={s.terminalOutput}>{output}</div>
        <input
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