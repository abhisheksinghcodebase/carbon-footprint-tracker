import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, User, RefreshCw, MessageSquare } from 'lucide-react';
import axios from 'axios';

export default function Chat({ API_URL }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am EcoPulse AI, your personal carbon footprint and sustainability guide. Ask me anything about your current emissions, how to lower your footprint, or about energy-saving habits."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend) => {
    const msgText = textToSend || input;
    if (!msgText.trim()) return;

    if (!textToSend) setInput('');

    // Append user message
    const newMessages = [...messages, { role: 'user', content: msgText }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      // Prepare history formatted for API
      const history = messages.slice(1).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await axios.post(`${API_URL}/api/chat`, {
        message: msgText,
        history
      });

      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [
        ...prev,
        { 
          role: 'assistant', 
          content: "Sorry, I couldn't reach the server. Please verify the backend is running and has the `GEMINI_API_KEY` environment variable configured." 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: "EcoPulse AI reset! How can I help you optimize your carbon footprint today?"
      }
    ]);
  };

  // Standard questions to click and ask
  const suggestedPrompts = [
    "What are the best ways to reduce my food emissions?",
    "How does public transit compare to a gasoline car?",
    "Generate a weekly carbon reduction plan for me.",
    "Explain what carbon offset represents."
  ];

  return (
    <div className="bg-white dark:bg-[#0c0c0f] border border-zinc-200 dark:border-zinc-800 rounded-xl h-[600px] flex flex-col justify-between overflow-hidden shadow-sm">
      
      {/* Chat Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-5 py-4 bg-zinc-50/50 dark:bg-zinc-900/20">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-yellow-500/10 text-yellow-500 rounded-lg animate-pulse">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-bold text-zinc-900 dark:text-zinc-50 text-sm">EcoPulse AI Assistant</h3>
            <span className="text-[10px] text-zinc-500 block">Ask questions, get insights</span>
          </div>
        </div>
        <button
          onClick={clearChat}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          title="Clear Chat History"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {/* Messages list */}
      <div 
        className="flex-1 overflow-y-auto p-5 space-y-4"
        role="log"
        aria-live="polite"
        aria-relevant="additions"
      >
        {messages.map((m, index) => {
          const isAI = m.role === 'assistant';
          return (
            <div 
              key={index} 
              className={`flex gap-3 max-w-[85%] ${isAI ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
            >
              <div className={`p-2 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border ${
                isAI 
                  ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-yellow-500' 
                  : 'bg-blue-600 border-blue-700 text-white'
              }`}>
                {isAI ? <Sparkles size={14} /> : <User size={14} />}
              </div>
              
              <div className={`rounded-xl p-3 text-xs leading-relaxed ${
                isAI 
                  ? 'bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300' 
                  : 'bg-blue-500 text-white'
              }`}>
                <div className="whitespace-pre-line prose dark:prose-invert">
                  {m.content}
                </div>
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto">
            <div className="p-2 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 border bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-yellow-500 animate-spin">
              <RefreshCw size={14} />
            </div>
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3 text-xs text-zinc-400 dark:text-zinc-500 w-24">
              <div className="flex gap-1 items-center justify-center py-1">
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-1.5 h-1.5 bg-zinc-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts (shown only when chat has just started) */}
      {messages.length === 1 && (
        <div className="px-5 py-2 flex flex-wrap gap-2">
          {suggestedPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="text-[10px] bg-zinc-100 dark:bg-zinc-900 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 px-2.5 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full transition-all cursor-pointer"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Input panel */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 p-4 flex gap-2">
        <input
          type="text"
          id="chat-message-input"
          aria-label="Ask EcoPulse AI Assistant"
          placeholder="Ask EcoPulse AI..."
          className="flex-1 bg-zinc-50 dark:bg-[#09090b] border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-xs shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 text-zinc-950 dark:text-zinc-100 transition-all"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button
          onClick={() => handleSendMessage()}
          disabled={isLoading || !input.trim()}
          aria-label="Send message"
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg p-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          <Send size={14} />
        </button>
      </div>

    </div>
  );
}
