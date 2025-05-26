import React from 'react';
import { X, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ChatHeaderProps {
  onClose: () => void;
  showBackButton: boolean;
  onBackClick: () => void;
}

const ChatHeader = ({
  onClose,
  showBackButton,
  onBackClick
}: ChatHeaderProps) => {
  const isMobile = useIsMobile();
  
  return (
    <div className="bg-red-700">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center">
          {showBackButton && (
            <button 
              onClick={onBackClick} 
              className="mr-2 text-white hover:text-blue-200 transition-colors"
              aria-label="Back to previous"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
          )}
          <img 
            src="/lovable-uploads/d2ab4876-9d6e-4ebd-86e4-df0252cdab35.png" 
            alt="Assistant" 
            className="w-6 h-6 object-contain mr-2"
          />
          <span className="text-white font-medium">{isMobile ? "IRFC Assistant: HR & Financials" : "IRFC Assistant: HR & Financials"}</span>
        </div>
        <button onClick={onClose} className="text-white hover:text-blue-200 transition-colors">
          <X className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
