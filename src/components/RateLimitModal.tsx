
import React from 'react';

interface RateLimitModalProps {
  message: string;
  onClose: () => void;
}

const RateLimitModal: React.FC<RateLimitModalProps> = ({ message, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-red-700 p-6 rounded-lg shadow-xl w-full max-w-md text-white">
        <div className="flex items-center mb-4">
          <span className="text-3xl mr-3">⚠️</span>
          <h2 className="text-xl font-semibold">API Alert</h2>
        </div>
        <p className="mb-6 text-red-100">{message}</p>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-red-500 hover:bg-red-400 rounded-md text-white font-semibold transition-colors"
          >
            Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateLimitModal;