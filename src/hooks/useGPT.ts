// src/hooks/useGPT.ts

import { useState } from "react";
import api from "../utils/api";

const useGPT = () => {
  const [response, setResponse] = useState<string>("");

  const askGPT = async (query: string) => {
    try {
      const result = await api.post("chat/completions", {
        model: 'gpt-4',
        prompt: query,
        max_tokens: 150,
        n: 1,
        stop: null,
        temperature: 0.5,
        metadata: {
          assistantId: 'asst_VxS0fyEox1V4TCdNQuN8KHeJ', 
        }
      });

      setResponse(result.data.choices[0].text);
    } catch (error) {
      setResponse("Error fetching response from GPT.");
    }
  };

  return { response, askGPT };
};

export default useGPT;
