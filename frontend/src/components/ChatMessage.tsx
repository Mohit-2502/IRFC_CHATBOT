import React from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  text: string;
  isUser: boolean;
}

const ChatMessage = ({ text, isUser }: ChatMessageProps) => {
  return (
    <div
      className={cn(
        "flex",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-xl py-2 px-4",
          isUser
            ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white"
            : "bg-blue-100 text-gray-800"
        )}
      >
        {/* Apply text alignment and whitespace classes to a wrapper div */}
        <div className="text-left whitespace-normal">
          {/* Conditionally render animated dots for "Thinking..." message */}
          {text.trim() === 'Thinking...' && !isUser ? (
            <span className="typing-dots">Thinking</span> 
          ) : (
            <ReactMarkdown>
              {text.trim()}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;