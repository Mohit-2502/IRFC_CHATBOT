import React from 'react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

interface TableData {
  [key: string]: any;
}

interface ChatMessageProps {
  text: string | { type: 'text' | 'table'; content: string | TableData[] };
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
            ? "bg-gradient-to-r from-[#2a427a] to-[#1a2e5b] text-white"
            : "bg-gradient-to-r from-[#2a427a] to-[#1a2e5b] text-white opacity-100"
        )}
      >
        {/* Apply text alignment and whitespace classes to a wrapper div */}
        <div className={cn(isUser ? "text-left" : "text-left", "whitespace-normal")}>
          {/* Conditionally render animated dots for "Thinking..." message */}
          {typeof text === 'string' && text.trim() === 'Thinking...' && !isUser ? (
            <span className="typing-dots">Thinking</span> 
          ) : typeof text === 'object' && text.type === 'table' && Array.isArray(text.content) ? (
            <table className="table-auto border-collapse border border-gray-400">
              <thead>
                <tr>
                  {/* Render table headers */}
                  {text.content.length > 0 && Object.keys(text.content[0]).map(header => (
                    <th key={header} className="border border-gray-400 px-4 py-2">{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Render table rows */}
                {text.content.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {Object.values(row).map((cell, cellIndex) => (
                      <td key={cellIndex} className="border border-gray-400 px-4 py-2">{String(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <ReactMarkdown>
              {typeof text === 'string' ? text.trim() : text.content.toString().trim()}
            </ReactMarkdown>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;