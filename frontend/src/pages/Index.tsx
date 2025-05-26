import React from 'react';
import ChatBot from '@/components/ChatBot';
const Index = () => {
  return <div className="min-h-screen p-4 rounded-none bg-white/0">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-indigo-600">Indian Railway finance Corporation</h1>
        <p className="text-gray-600 mb-8">Welcome to the dummy website of IRFC</p>
      </div>
      <ChatBot />
    </div>;
};
export default Index;