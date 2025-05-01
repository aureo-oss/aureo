import React, { useState } from 'react';
import { FaRobot, FaPaperPlane, FaCopy } from 'react-icons/fa';
import { generateText } from './gemini';

const PostEventAssistant = () => {
  const [userInput, setUserInput] = useState("");
  const [output, setOutput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Hidden system message that guides the AI's behavior
  const systemMessage = `You are an expert event management assistant specializing in troubleshooting and suggestions. 
  When responding to any user request, always:
  1. First identify the core issue or opportunity
  2. Provide 3 actionable solutions ranked by effectiveness
  3. Include potential risks for each solution
  4. Format responses with clear headings and bullet points
  5. Maintain a professional but friendly tone`;

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setOutput("Please enter your event-related question or issue");
      return;
    }

    setIsLoading(true);
    setOutput("");

    try {
      // Combine the hidden system message with user input
      const fullPrompt = `${systemMessage}\n\nUser Request: ${userInput}`;
      
      const result = await generateText(fullPrompt);
      setOutput(result);
    } catch (error) {
      setOutput(`Error: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="assistant-container">
      <div className="assistant-header">
        <FaRobot /> Event Management Helper
      </div>

      <div className="input-section">
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Describe your event issue or ask for suggestions..."
          rows={5}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !userInput.trim()}
        >
          <FaPaperPlane /> Get Expert Advice
        </button>
      </div>

      {isLoading && <div className="loading">Analyzing your event issue...</div>}

      {output && (
        <div className="output-container">
          <h3>Recommendations:</h3>
          <pre>{output}</pre>
          <button onClick={() => navigator.clipboard.writeText(output)}>
            <FaCopy /> Copy Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default PostEventAssistant;