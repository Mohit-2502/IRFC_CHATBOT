import React, { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react'; // Removed FileText, Upload, X, FileImage, FileAudio, FileVideo
import { Input } from './ui/input';
// Button component might not be needed if only the inline send button is used.
// If the send button is a <Button>, keep it. It's currently a <button>.
import ChatMessage from './ChatMessage';
import { Message } from '@/hooks/useChatState'; // Removed UploadedFile
import { cn } from '@/lib/utils';

interface FinancialsSectionProps {
  messages: Message[];
  onSubmit: (text: string) => void;
  setHasInteraction?: (value: boolean) => void;
  // Removed props related to file uploads:
  // uploadedFiles: UploadedFile[];
  // onFileUpload: (file: File) => void;
  // onFileRemove: (fileId: string) => void;
  // hasFirstMessageSent: boolean;
}

const FinancialsSection: React.FC<FinancialsSectionProps> = ({
  messages,
  onSubmit,
  setHasInteraction,
  // Removed destructured props for file uploads
}) => {
  const [financialDocument, setFinancialDocument] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Removed fileInputRef as it's no longer needed

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Removed handleFileUpload and handleFileChange methods

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFinancialDocument(e.target.value);
  };

  // Removed formatFileSize, truncateFileName, and getFileIcon helper functions

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Submit if there's text
    if (financialDocument.trim()) {
      if (setHasInteraction) setHasInteraction(true);
      onSubmit(financialDocument);
      setFinancialDocument('');
    }
    // Removed logic for submitting based on uploadedFiles
  };

  return (
    <div className="p-4 h-full flex flex-col">
      {/* The title can be changed if "Upload your documents here" is no longer appropriate */}
      {/* For now, keeping it as per "keeping rest of things same" */}
      <h2 className="text-xl font-bold text-center mb-6">How can I help with your financial queries?</h2>
      
      {messages.length > 0 ? (
        <div className="flex-1 overflow-y-auto space-y-3 mb-3">
          {messages.map(message => (
            <ChatMessage 
              key={message.id} 
              text={message.text} 
              isUser={message.isUser} 
            />
          ))}
          <div ref={messagesEndRef} />
        </div>
      ) : (
        <div className="flex-1"></div> // This ensures content above is pushed up
      )}
      
      <form onSubmit={handleSubmit} className="mt-auto">
        {/* The main div for input is now simpler */}
        <div className="flex flex-col gap-3"> 
          {/* Removed the section that displayed uploaded files */}
          
          <div className="relative">
            <Input
              value={financialDocument}
              onChange={handleDocumentChange}
              // Updated placeholder
              placeholder="Ask a question..." 
              className="py-6 pr-12 pl-4 text-base" // Ensure padding accommodates text size and send button
            />
            <button
              type="submit"
              className={cn(
                "absolute right-2 top-1/2 transform -translate-y-1/2 w-9 h-9 rounded-md flex items-center justify-center transition-all duration-200",
                "bg-gradient-to-r from-[#2a427a] to-[#1a2e5b] hover:from-[#1a2e5b] hover:to-[#2a427a]"
              )}
            >
              <Send className="h-4 w-4 text-white" />
            </button>
          </div>
          
          {/* Removed the "Upload File" and "Submit" buttons and the !hasFirstMessageSent condition */}
        </div>
      </form>
    </div>
  );
};

export default FinancialsSection;