import { useState } from 'react';
import { chatService } from '@/lib/api';

// Define types for our state
export type Message = {
  id: string;
  text: string;
  isUser: boolean;
};

export type Section = 'hr' | 'financials' | null;

export type UploadedFile = {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
};

export const useChatState = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [showOptions, setShowOptions] = useState(true);
  const [showBackButton, setShowBackButton] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showGreeting, setShowGreeting] = useState(true);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showEntryPage, setShowEntryPage] = useState(true);
  const [currentSection, setCurrentSection] = useState<Section>(null);
  const [pageTransition, setPageTransition] = useState(false);
  const [hasInteraction, setHasInteraction] = useState(false);
  const [hasFirstMessageSent, setHasFirstMessageSent] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [hasFileSubmitted, setHasFileSubmitted] = useState(false);
  const [waitingForQuery, setWaitingForQuery] = useState(false);
  const [selectedOptionText, setSelectedOptionText] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Handle toggle chatbot
  const toggleChatbot = () => {
    setIsOpen(!isOpen);
    setShouldScrollToBottom(false);
  };
  
  // Handle closing transition
  const handleClosing = () => {
    setIsClosing(true);
    const timer = setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
      setShowEntryPage(true);
      setCurrentSection(null);
      setHasInteraction(false);
      setHasFirstMessageSent(false);
      setUploadedFiles([]);
      setHasFileSubmitted(false);
    }, 300);
    return timer;
  };
  
  // Handle page transition with enhanced animation
  const handlePageTransition = (section: Section) => {
    setPageTransition(true);
    setTimeout(() => {
      setShowEntryPage(false);
      setCurrentSection(section);
      setShowBackButton(true);
      setPageTransition(false);
      setHasInteraction(false);
      setHasFirstMessageSent(false);
      setHasFileSubmitted(false);
    }, 300);
  };
  
  // Handle back button with improved logic
  const handleBackButton = () => {
    if (hasInteraction) {
      setShowConfirmation(true);
    } else {
      // If no interaction, go back directly with transition
      handleBackToEntryPage();
    }
  };
  
  // Handle back confirmation
  const handleConfirmBack = () => {
    setPageTransition(true);
    setTimeout(() => {
      setMessages([]);
      setShowOptions(true);
      setShowBackButton(false);
      setShowConfirmation(false);
      setShowGreeting(true);
      setShouldScrollToBottom(false);
      setShowEntryPage(true);
      setCurrentSection(null);
      setHasInteraction(false);
      setHasFirstMessageSent(false);
      setUploadedFiles([]);
      setHasFileSubmitted(false);
      setPageTransition(false);
    }, 300);
  };
  
  // Handle back cancellation
  const handleCancelBack = () => {
    setShowConfirmation(false);
  };
  
  // Handle option click with transition
  const handleOptionClick = (optionText: string) => {
    setHasInteraction(true);
    setShowGreeting(false);
    setShouldScrollToBottom(true);
    
    // Set waiting state and display demo message
    setWaitingForQuery(true);
    setSelectedOptionText(optionText);
    
    const demoMessage: Message = {
      id: Date.now().toString() + '-demo',
      text: `Ask your queries regarding ${optionText.toLowerCase()}.`,
      isUser: false,
    };
    
    setMessages(prev => [...prev, demoMessage]);
    setShowOptions(false);
    setShowBackButton(true);
  };
  
  // Handle send message with transition
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    
    if (showGreeting) {
      setShowGreeting(false);
    }
    
    setHasInteraction(true);
    
    // Only add transition animation for first message
    if (!hasFirstMessageSent) {
      setHasFirstMessageSent(true);
      
      // Only set hasFileSubmitted to true if we have files and this is a file submission
      if (uploadedFiles.length > 0 && text === "I've uploaded some files for analysis.") {
        setHasFileSubmitted(true);
      }
    }
    
    const newUserMessage = {
      id: Date.now().toString(),
      text,
      isUser: true
    };
    
    // If waiting for query after option click, this is the actual query
    if (waitingForQuery && selectedOptionText !== null) {
      setMessages(prev => [...prev, newUserMessage]); // Add user message
      setShouldScrollToBottom(true);
      setWaitingForQuery(false); // Reset waiting state
      setSelectedOptionText(null); // Clear selected option

      // Add thinking message and set loading state
      const thinkingMessage: Message = {
        id: 'thinking-message',
        text: 'Thinking...',
        isUser: false,
      };
      setMessages(prev => [...prev, thinkingMessage]);
      setIsLoading(true);
      setShouldScrollToBottom(true);

      try {
        // Call the API with the user's query and context
        const response = await chatService.sendMessage({
          query: `${selectedOptionText}: ${text}`, // Include context in query
          domain: currentSection === 'financials' ? 'finance' : 'hr'
        });
  
        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false
        };
        
        // Remove thinking message and add bot response
        setMessages(prev => prev.filter(msg => msg.id !== 'thinking-message').concat(botResponse));
        setShouldScrollToBottom(true);
        setIsLoading(false); // Reset loading state

      } catch (error) {
        console.error('Error sending message:', error);
        const errorResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I encountered an error while processing your request. Please try again.",
          isUser: false
        };
        // Remove thinking message and add error response
        setMessages(prev => prev.filter(msg => msg.id !== 'thinking-message').concat(errorResponse));
        setShouldScrollToBottom(true);
        setIsLoading(false); // Reset loading state
      }

    } else {
      // Normal message handling
      setMessages(prev => [...prev, newUserMessage]);
      setShowOptions(false);
      setShowBackButton(true);
      setShouldScrollToBottom(true);
      
      // Add thinking message and set loading state
      const thinkingMessage: Message = {
        id: 'thinking-message',
        text: 'Thinking...',
        isUser: false,
      };
      setMessages(prev => [...prev, thinkingMessage]);
      setIsLoading(true);
      setShouldScrollToBottom(true);
      
      try {
        // Call the API
        const response = await chatService.sendMessage({
          query: text,
          domain: currentSection === 'financials' ? 'finance' : 'hr'
        });

        const botResponse = {
          id: (Date.now() + 1).toString(),
          text: response.response,
          isUser: false
        };
        
        // Remove thinking message and add bot response
        setMessages(prev => prev.filter(msg => msg.id !== 'thinking-message').concat(botResponse));
        setShouldScrollToBottom(true);
        setIsLoading(false); // Reset loading state

      } catch (error) {
        console.error('Error sending message:', error);
        const errorResponse = {
          id: (Date.now() + 1).toString(),
          text: "I'm sorry, I encountered an error while processing your request. Please try again.",
          isUser: false
        };
        // Remove thinking message and add error response
        setMessages(prev => prev.filter(msg => msg.id !== 'thinking-message').concat(errorResponse));
        setShouldScrollToBottom(true);
        setIsLoading(false); // Reset loading state
      }
    }
  };
  
  // Handle back to entry page with transition
  const handleBackToEntryPage = () => {
    setPageTransition(true);
    setTimeout(() => {
      setShowEntryPage(true);
      setCurrentSection(null);
      setShowBackButton(false);
      setPageTransition(false);
      setMessages([]);
      setHasInteraction(false);
      setHasFirstMessageSent(false);
      setUploadedFiles([]);
      setHasFileSubmitted(false);
    }, 300);
  };

  // Handle file upload
  const handleFileUpload = (file: File) => {
    const newFile: UploadedFile = {
      id: Date.now().toString(),
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    };
    
    setUploadedFiles(prev => [...prev, newFile]);
    setHasInteraction(true);
  };
  
  // Handle file removal
  const handleFileRemove = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(file => file.id !== fileId));
  };
  
  return {
    state: {
      isOpen,
      isVisible,
      messages,
      showOptions,
      showBackButton,
      showConfirmation,
      showGreeting,
      shouldScrollToBottom,
      isClosing,
      showEntryPage,
      currentSection,
      pageTransition,
      hasInteraction,
      hasFirstMessageSent,
      uploadedFiles,
      hasFileSubmitted,
      waitingForQuery,
      selectedOptionText,
      isLoading,
    },
    actions: {
      setIsOpen,
      setIsVisible,
      setShowBackButton,
      toggleChatbot,
      handleClosing,
      handlePageTransition,
      handleBackButton,
      handleConfirmBack,
      handleCancelBack,
      handleOptionClick,
      handleSendMessage,
      handleBackToEntryPage,
      setShouldScrollToBottom,
      setHasInteraction,
      handleFileUpload,
      handleFileRemove
    }
  };
};
