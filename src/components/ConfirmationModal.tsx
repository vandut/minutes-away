
import React from 'react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  title, 
  message, 
  onConfirm, 
  onCancel 
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" 
      aria-modal="true" 
      role="dialog"
      aria-labelledby="confirmationModalTitle"
      aria-describedby="confirmationModalMessage"
    >
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
        <h2 id="confirmationModalTitle" className="text-xl font-semibold mb-4 text-sky-300">{title}</h2>
        <p id="confirmationModalMessage" className="mb-6 text-slate-300 whitespace-pre-wrap">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-slate-500 hover:bg-slate-400 rounded-md text-white transition-colors"
            aria-label="Cancel action"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-white font-semibold transition-colors"
            aria-label="Confirm action"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;