
import React from 'react';

interface ConfirmationPromptProps {
  onConfirm: () => void;
  onCancel: () => void;
  isVisible: boolean;
}

const ConfirmationPrompt = ({ onConfirm, onCancel, isVisible }: ConfirmationPromptProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white p-6 rounded-t-2xl border-t shadow-lg animate-fade-in z-10">
      <p className="text-center text-gray-700 font-medium text-lg mb-6">
        Are you sure want to go back? This will clear all the chat.
      </p>
      <div className="flex gap-4">
        <button 
          onClick={onConfirm}
          className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-medium transition-all duration-300 hover:bg-blue-600 hover:shadow-md transform hover:scale-[1.02]"
        >
          Yes
        </button>
        <button 
          onClick={onCancel}
          className="flex-1 bg-black text-white py-3 rounded-lg font-medium transition-all duration-300 hover:bg-gray-800 hover:shadow-md transform hover:scale-[1.02]"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};

export default ConfirmationPrompt;
