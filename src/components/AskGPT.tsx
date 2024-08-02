import React, { useState } from "react";
import axios from "axios";
import s from "../styles/AskGPT.less";

const AskGPT: React.FC = () => {
  const [query, setQuery] = useState<string>("");
  const [response, setResponse] = useState<string>("");

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  const handleSubmit = async () => {
    if (!query) return;

    try {
      const result = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "You are assistant 'asst_VxS0fyEox1V4TCdNQuN8KHeJ'. Please assist the user with expert knowledge in [specify domain or persona, e.g., software engineering]."
            },
            {
              role: "user",
              content: query
            }
          ],
          max_tokens: 150,
          temperature: 0.5
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.REACT_APP_OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );      

      setResponse(result.data.choices[0].text);
    } catch (error) {
      setResponse("Error fetching response from GPT.");
    }
  };

  return (
    <div className={s.askGpt}>
      <input
        type="text"
        value={query}
        onChange={handleQueryChange}
        placeholder="Ask something..."
        className={s.askGptInput}
      />
      <button onClick={handleSubmit} className={s.askGptButton}>
        Send
      </button>
      <div className={s.askGptResponse}>{response}</div>
    </div>
  );
};

export default AskGPT;
