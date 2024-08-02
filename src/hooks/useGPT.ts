import { useCallback } from "react";
import OpenAI from 'openai';

type callback = (response: string) => void;

type OpenAIAssistantHook = (params: { 
  onSuccess?: callback; 
  onError?: callback; 
}) => [OpenAI, (query: string) => Promise<void>];

const useOpenAIAssistant: OpenAIAssistantHook = ({ 
  onSuccess, 
  onError 
}) => {
  const assistantId = "asst_VxS0fyEox1V4TCdNQuN8KHeJ"; // TODO: replace with env variable
  
  const openai = new OpenAI({
    apiKey: process.env.REACT_APP_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true // Note: This is not recommended for production
  });

  const queryOpenAIAssistant = useCallback(async (query: string) => {
      try {
        // Step 1: Create a thread
        const thread = await openai.beta.threads.create();
    
        // Step 2: Add a message to the thread
        await openai.beta.threads.messages.create(thread.id, {
          role: "user",
          content: query
        });
    
        // Step 3: Run the assistant
        const run = await openai.beta.threads.runs.create(thread.id, {
          assistant_id: assistantId
        });
    
        // Step 4: Check the run status
        let runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    
        // Poll for status "completed"
        while (runStatus.status !== "completed") {
          await new Promise(resolve => setTimeout(resolve, 1000));
          runStatus = await openai.beta.threads.runs.retrieve(thread.id, run.id);
        }
    
        // Step 5: Retrieve the assistant's response
        const messages = await openai.beta.threads.messages.list(thread.id);
    
        // Get the last assistant message
        const assistantResponse = messages.data
          .filter(message => message.role === "assistant")
          .pop();
  
        if (assistantResponse && 'text' in assistantResponse.content[0]) {
          const response = (assistantResponse.content[0] as { text: { value: string } }).text.value;
          if(onSuccess) onSuccess(response);
        } else {
          if(onError) onError('Unexpected response format.');
        }
      } catch (error) {
        if(onError) onError('An error occurred while processing your request.');
      }
  }, []);

  return [openai, queryOpenAIAssistant];
}

export {  useOpenAIAssistant };
