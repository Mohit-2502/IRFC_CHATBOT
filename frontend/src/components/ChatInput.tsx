
import React, { useState } from 'react';
import { Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
}

const ChatInput = ({
  onSendMessage
}: ChatInputProps) => {
  const [inputText, setInputText] = useState('');
  const isMobile = useIsMobile();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedText = inputText.trim();
    if (trimmedText) {
      onSendMessage(trimmedText);
      setInputText('');
    }
  };

  return (
    <div className="px-4 pt-2 pb-4">
      <form onSubmit={handleSubmit} className="relative">
        <input 
          type="text" 
          value={inputText} 
          onChange={e => setInputText(e.target.value)} 
          placeholder="Ask me anything..." 
          className="w-full p-3 pr-12 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
        />
        <button 
          type="submit" 
          className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200"
        >
          <Send className="h-4 w-4 text-white" />
        </button>
      </form>
      <div className={`text-[9px] text-gray-400 mt-2 leading-tight px-1 ${isMobile ? "mb-2" : ""}`}>
        This is an experimental AI Powered Chatbot which uses a trained language model. 
        It may produce inaccurate or misleading responses. Use at your own discretion.
      </div>
    </div>
  );
};

export default ChatInput;
