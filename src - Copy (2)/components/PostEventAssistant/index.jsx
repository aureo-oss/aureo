import React, { useState } from 'react';
import { generateText } from '../../services/gemini';
import { FaRobot, FaPaperPlane, FaCopy } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import './styles.css';

const PostEventAssistant = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Hidden system message that guides the AI's behavior
  const systemMessage = `You are an expert event management assistant specializing in troubleshooting and suggestions. 
  When responding to any user request about event planning or issues:
  1. First identify the core challenge or opportunity
  2. Provide 3 actionable solutions ranked by effectiveness
  3. Include potential risks for each solution
  4. Format responses with clear headings and bullet points
  5. Keep responses under 300 words`;

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please describe your event issue or request');
      return;
    }

    setIsLoading(true);
    setOutput('');

    try {
      const fullPrompt = `${systemMessage}\n\nUser Request: ${input}`;
      const text = await generateText(fullPrompt);
      setOutput(text);
      toast.success('Suggestions generated!');
    } catch (error) {
      setOutput(error.message);
      toast.error('Failed to generate response');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="assistant-container">
      <header>
        <h1><FaRobot /> Event Troubleshooter</h1>
        <p>Get expert solutions for your event challenges</p>
      </header>

      <div className="input-section">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Describe your event issue or ask for planning advice..."
          rows={5}
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !input.trim()}
        >
          <FaPaperPlane /> Get Solutions
        </button>
      </div>

      {isLoading && (
        <div className="loading-indicator">
          <div className="spinner"></div>
          <p>Analyzing your event challenge...</p>
        </div>
      )}

      {output && (
        <div className="output-section">
          <div className="output-header">
            <h3>Expert Recommendations</h3>
            <button onClick={copyToClipboard} className="copy-button">
              <FaCopy /> Copy
            </button>
          </div>
          <pre className="output-content">
            {output}
          </pre>
        </div>
      )}
    </div>
  );
};

export default PostEventAssistant;