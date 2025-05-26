
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { useChatState } from '@/hooks/useChatState';

// Import Components
import ChatHeader from './ChatHeader';
import ChatInput from './ChatInput';
import ChatButton from './ChatButton';
import ConfirmationPrompt from './ConfirmationPrompt';
import EntryPage from './EntryPage';
import HRSection from './HRSection';
import FinancialsSection from './FinancialsSection';

const ChatBot = () => {
  const { state, actions } = useChatState();
  const {
    isOpen, isVisible, messages, showOptions, showBackButton,
    showConfirmation, shouldScrollToBottom,
    isClosing, showEntryPage, currentSection, pageTransition,
    uploadedFiles, hasFirstMessageSent, hasFileSubmitted
  } = state;
  
  const isMobile = useIsMobile();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // Handle smooth transitions
  useEffect(() => {
    if (isOpen) {
      actions.setIsVisible(true);
    } else {
      const timer = actions.handleClosing();
      return () => clearTimeout(timer);
    }
  }, [isOpen]);
  
  // Reset scroll position when chatbot is opened
  useEffect(() => {
    if (isOpen && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = 0;
    }
  }, [isOpen]);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (shouldScrollToBottom && chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  // Prevent scroll propagation to the main window
  const handleChatboxScroll = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col">
      <ChatButton 
        onClick={actions.toggleChatbot} 
        isVisible={isVisible}
      />

      <div 
        className={cn(
          "flex flex-col bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 transform origin-bottom-right",
          isOpen && !isClosing ? "scale-100 opacity-100 animate-scale-in" : 
          isClosing ? "scale-0 opacity-0 animate-scale-out" : "scale-0 opacity-0 pointer-events-none",
          isMobile ? "fixed inset-0 w-full h-full m-0 rounded-none" : "w-[380px] h-[560px]"
        )}
        onWheel={handleChatboxScroll}
      >
        <ChatHeader 
          onClose={actions.toggleChatbot} 
          showBackButton={showBackButton} 
          onBackClick={actions.handleBackButton}
        />
        
        <div className={cn(
          "flex-1 overflow-y-auto pb-0 transition-opacity duration-300",
          pageTransition ? "opacity-0" : "opacity-100"
        )} ref={chatContainerRef}>
          {showEntryPage ? (
            <EntryPage 
              pageTransition={pageTransition}
              onSelectHR={() => actions.handlePageTransition('hr')}
              onSelectFinancials={() => actions.handlePageTransition('financials')}
            />
          ) : currentSection === 'hr' ? (
            <HRSection 
              messages={messages}
              showOptions={showOptions}
              onOptionClick={actions.handleOptionClick}
            />
          ) : currentSection === 'financials' && (
            <FinancialsSection
              messages={messages}
              onSubmit={actions.handleSendMessage}
              setHasInteraction={actions.setHasInteraction}
              uploadedFiles={uploadedFiles}
              onFileUpload={actions.handleFileUpload}
              onFileRemove={actions.handleFileRemove}
              hasFirstMessageSent={hasFileSubmitted}
            />
          )}
        </div>
        
        {currentSection === 'hr' && (
          <ChatInput onSendMessage={actions.handleSendMessage} />
        )}
        
        <ConfirmationPrompt 
          isVisible={showConfirmation} 
          onConfirm={actions.handleConfirmBack} 
          onCancel={actions.handleCancelBack} 
        />
      </div>
    </div>
  );
};

export default ChatBot;
