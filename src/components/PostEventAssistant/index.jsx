import React, { useState } from 'react';
import { generateText } from '../../services/gemini';
import { FaRobot, FaPaperPlane, FaCopy, FaLightbulb, FaRegSmileWink } from 'react-icons/fa';
import { GiBrain } from 'react-icons/gi';
import { toast } from 'react-hot-toast';
import './styles.css';

const PostEventAssistant = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([]);

  // AI Personality Configuration
  const AI_PERSONA = {
    name: "Aria",
    title: "Senior Event Strategist",
    personality: {
      traits: ["Analytical", "Creative", "Detail-Oriented", "Empathetic"],
      communicationStyle: {
        tone: "Professional yet approachable",
        structure: "Clear problem-solution framework with risk analysis",
        quirks: ["Uses occasional event planning jargon", "Loves food & beverage analogies"]
      },
      expertise: ["Risk Mitigation", "Guest Experience Design", "Logistics Optimization"]
    },
    avatar: <FaRobot className="aria-avatar"/>,
    greeting: "Hi there! I'm Aria, your event solutions architect. Let's turn your challenges into opportunities!"
  };

  // Enhanced system message with personality
  const systemMessage = `You are ${AI_PERSONA.name}, ${AI_PERSONA.title} with ${AI_PERSONA.personality.expertise.join(', ')} expertise. 
  Personality: ${AI_PERSONA.personality.traits.join(', ')}. 
  Communication Style: ${AI_PERSONA.personality.communicationStyle.tone}. 
  Always respond using this framework:
  1. [Analysis] Summarize core challenge in <50 words
  2. [Solutions] Present 3 options with:
     - 💡 Approach
     - ⚠️ Risks
     - ✅ Implementation Tips
  3. [Recommendation] Highlight preferred solution with rationale
  4. [Pro Tip] Share industry insight from experience
  Format with emoji headings, markdown bullets, and occasional ${AI_PERSONA.personality.communicationStyle.quirks[1]}.`;

  const handleGenerate = async () => {
    if (!input.trim()) {
      toast.error('Please describe your event challenge');
      return;
    }

    setIsLoading(true);
    try {
      const fullPrompt = `${systemMessage}\n\nCurrent Challenge: ${input}\n\nPrevious Context: ${conversationHistory.join('\n')}`;
      const text = await generateText(fullPrompt);
      
      setConversationHistory(prev => [...prev.slice(-3), `User: ${input}`, `${AI_PERSONA.name}: ${text}`]);
      setOutput(text);
      toast.success('Aria has some ideas!');
    } catch (error) {
      setOutput(`⚠️ Oops! ${AI_PERSONA.name} is recalibrating...\nError: ${error.message}`);
      toast.error('Temporary system overload');
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${AI_PERSONA.name}'s Recommendations:\n\n${output}`);
    toast.success('Copied to clipboard!');
  };

  const sampleQuestions = [
    "How to handle last-minute venue cancellation?",
    "Ideas for engaging 500+ attendees virtually",
    "Reducing F&B costs without quality loss",
    "Managing VIP guest expectations"
  ];

  return (
    <div className="assistant-container aria-theme">
      <header className="aria-header">
        <div className="aria-branding">
          {AI_PERSONA.avatar}
          <div>
            <h1>{AI_PERSONA.name} <span className="ai-title">{AI_PERSONA.title}</span></h1>
            <p className="personality-traits">
              {AI_PERSONA.personality.traits.join(' • ')} 
              <GiBrain className="brain-icon"/>
            </p>
          </div>
        </div>
        <div className="aria-greeting">
          <FaRegSmileWink className="wink-icon"/>
          <p>{AI_PERSONA.greeting}</p>
        </div>
      </header>

      <div className="input-section">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`Describe your event challenge to ${AI_PERSONA.name}...`}
          rows={5}
          className="aria-textarea"
        />
        
        <div className="quick-prompts">
          <h4><FaLightbulb/> Quick Start Questions:</h4>
          {sampleQuestions.map((q, i) => (
            <button 
              key={i}
              onClick={() => setInput(q)}
              className="sample-question"
            >
              {q}
            </button>
          ))}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !input.trim()}
          className="aria-button"
        >
          <FaPaperPlane /> {isLoading ? 'Analyzing...' : 'Get Strategic Solutions'}
        </button>
      </div>

      {isLoading && (
        <div className="loading-indicator aria-loading">
          <div className="spinner"></div>
          <p>{AI_PERSONA.name} is strategizing...<br/>
          <small>"Hmm, let me cross-reference industry benchmarks..."</small></p>
        </div>
      )}

      {output && (
        <div className="output-section aria-response">
          <div className="output-header">
            <h3>
              {AI_PERSONA.name}'s Event Blueprint 
              <span className="response-meta"> • {AI_PERSONA.personality.communicationStyle.tone}</span>
            </h3>
            <button onClick={copyToClipboard} className="copy-button">
              <FaCopy /> Export
            </button>
          </div>
          <div className="output-content aria-markdown">
            {output.split('\n').map((line, i) => {
              const formattedLine = line
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                .replace(/\*(.*?)\*/g, '<em>$1</em>');

              return (
                <p 
                  key={i}
                  className={`response-line ${line.includes('💡') ? 'solution-heading' : ''}`}
                  dangerouslySetInnerHTML={{ __html: formattedLine }}
                />
              );
            })}
          </div>
          <div className="aria-signature">
            <FaRegSmileWink/> {AI_PERSONA.name} hopes this helps! Need clarification?
          </div>
        </div>
      )}
    </div>
  );
};

export default PostEventAssistant;