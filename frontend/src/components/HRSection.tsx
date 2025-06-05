import React from 'react';
import ChatMessage from './ChatMessage';
import ChatOptions from './ChatOptions';
import { Message } from '@/hooks/useChatState';

interface HRSectionProps {
  messages: Message[];
  showOptions: boolean;
  onOptionClick: (text: string) => void;
}

const HRSection: React.FC<HRSectionProps> = ({ 
  messages, 
  showOptions, 
  onOptionClick 
}) => {
  return (
    <>
      <div className="p-4 pt-6 text-center">
        <p className="text-xl font-bold text-gray-800">How can I help you today?</p>
      </div>
      
      {messages.length > 0 && (
        <div className="space-y-4 px-4 mt-4">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              text={message.text} 
              isUser={message.isUser} 
            />
          ))}
        </div>
      )}
      
      {showOptions && <ChatOptions onOptionClick={onOptionClick} />}
    </>
  );
};

export default HRSection;
