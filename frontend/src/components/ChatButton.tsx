import React from 'react';
import { cn } from '@/lib/utils';

interface ChatButtonProps {
  onClick: () => void;
  isVisible: boolean;
}

const ChatButton: React.FC<ChatButtonProps> = ({ onClick, isVisible }) => {
  if (isVisible) return null;
  
  return (
    <button 
      onClick={onClick} 
      className="chat-button-pulse fixed bottom-6 right-6 h-14 w-14 md:h-16 md:w-16 rounded-full bg-red-700 opacity-90 shadow-lg flex items-center justify-center transform transition-all duration-300 hover:scale-105 overflow-hidden"
    >
      <img 
        src="/lovable-uploads/d2ab4876-9d6e-4ebd-86e4-df0252cdab35.png" 
        alt="Chat Assistant" 
        className="w-10 h-10 md:w-12 md:h-12 object-contain"
      />
    </button>
  );
};

export default ChatButton;
