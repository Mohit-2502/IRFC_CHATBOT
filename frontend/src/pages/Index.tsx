import React from 'react';
import ChatBot from '@/components/ChatBot';

const Index = () => {
  return (
    <div className="relative min-h-screen bg-gray-100" style={{ margin: 0, padding: 0 }}>
      {/* Main Header (Simplified) */}
      <div className="bg-[#1a2e5b] text-white py-3 border-b-4 border-red-600">
        <div className="w-full mx-auto flex items-center px-4">
          {/* Left section - Logo */}
          <div className="flex-shrink-0 mr-4">
            <img src="/irfclogo.png" alt="IRFC Logo" className="w-25 h-20 object-contain" />
          </div>

          {/* Center section - Text Block */}
          <div className="flex flex-col items-center flex-grow mx-auto">
            <div className="text-xl font-bold text-center">INDIAN RAILWAY FINANCE CORPORATION</div>
            <div className="text-xs text-center">(A Government of India Enterprise)</div>
            <div className="text-green-500 font-semibold text-center">Future on Track</div>
          </div>

          {/* Right section - Two Icons */}
          <div className="flex-shrink-0 ml-4 flex items-center space-x-4">
            {/* Icon 1 */}
            <img src="/G20.png" alt="G20 Logo" className="w-25 h-20 object-contain" />
            {/* Icon 2 */}
            <img src="/logo-right.png" alt="Azadi Logo" className="w-25 h-20 object-contain" />
          </div>
        </div>
      </div>

      {/* Entry Page Content - Full Width */}
      <div className="w-full py-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold mb-4 text-[#1a2e5b]">IRFC HR & Financials Chatbot</h1>
        <p className="text-lg text-gray-700 mb-8 text-center">Your assistant for HR-related and Financials queries at Indian Railway Finance Corporation.</p>

        {/* Dummy Login Form */}
        <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-sm">
          <h2 className="text-2xl font-bold mb-4 text-center text-[#1a2e5b]">Login</h2>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="username"
              type="text"
              placeholder="Username"
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              placeholder="********"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className="bg-[#1a2e5b] hover:bg-[#2a427a] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
              type="button"
            >
              Sign In
            </button>
          </div>
        </div>

        {/* ChatBot Component - Adjust styling if needed for centering/width */}
        <div className="w-full max-w-md px-4">
          <ChatBot />
        </div>
      </div>

    </div>
  );
};

export default Index;