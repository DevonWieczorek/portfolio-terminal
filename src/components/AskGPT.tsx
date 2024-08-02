import React, { useState, useRef, useEffect } from "react";
import Markdown from 'react-markdown'
import { isEnterKeyPress } from "../utils/keyboard";
import { removeCitations } from "../utils/formatting";
import { useOpenAIAssistant } from "../hooks/useGPT";
import s from "../styles/AskGPT.less";

type FormattedResponseProps = {
  response: string;
  query?: string;
  onShowResponse?: Function;
}

const FormattedResponse: React.FC<FormattedResponseProps> = ({ response, query, onShowResponse }) => {
  useEffect(() => {
    if (onShowResponse && response) {
      onShowResponse();
    }
  }, [response, onShowResponse]);

  if (response){
    return (
      <div className={s.askGpt}>
        {query && <div>{query}</div>}
        <div>
          <Markdown>{response}</Markdown>
        </div>
      </div>
    );
  }
  return null;
}


const AskGPT: React.FC <{ onShowResponse: Function }>= ({ onShowResponse }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [displayQuery, setDisplayQuery] = useState<string>("");
  const [response, setResponse] = useState<string>("");
  const [, queryOpenAIAssistant] = useOpenAIAssistant({
    onSuccess: (response: string) => setFormattedResponse(response),
    onError: (error: string) => setFormattedResponse(error),
  });

  const setFormattedResponse = (response: string) => {
    if(response) {
      const formattedResponse = removeCitations(response);
      setResponse(formattedResponse);
    }
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
    setQuery(event.target.value);
  };

  const handleSubmit = async () => {
    if (!query) return;

    if (inputRef?.current) {
      setInputValue("asking devon-gpt, this may take a moment... ");
      setDisplayQuery(query);
      inputRef.current.blur();
    }

    queryOpenAIAssistant(query);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>): void => {
    if (isEnterKeyPress(event)) {
      handleSubmit();
    }
  };

  useEffect(() => {
    if (inputRef?.current) {
      inputRef.current.focus();
    }
  });

  if (response){
    return <FormattedResponse response={response} query={query} onShowResponse={onShowResponse} />;
  }
 
  return (
    <div className={s.askGpt}>
      {displayQuery ? <div>{displayQuery}</div> : <div>press ENTER to submit</div>}
      <div className={s.inputArea}>
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onKeyPress={handleKeyPress}
          onChange={handleQueryChange}
          placeholder="ask a question to devon-gpt..."
          className={s.askGptInput}
        />
        <button onClick={handleSubmit} className={s.askGptButton}>
          submit
        </button>
      </div>
    </div>
  );
};

export default AskGPT;