
import React, { useState, useEffect } from 'react';
import { LOCALSTORAGE_ORS_API_KEY } from '../constants';

interface SettingsModalProps {
  onClose: () => void;
  minuteCount: number;
  dailyCount: number;
  minuteLimit: number;
  dailyLimit: number;
  isInitialSetup: boolean; // True if API key is not yet set
  onApiKeySaved: () => void; // Callback after API key is successfully saved
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  onClose, 
  minuteCount, 
  dailyCount, 
  minuteLimit, 
  dailyLimit,
  isInitialSetup,
  onApiKeySaved
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [saveMessage, setSaveMessage] = useState<string>('');

  useEffect(() => {
    const storedApiKey = localStorage.getItem(LOCALSTORAGE_ORS_API_KEY);
    if (storedApiKey) {
      setApiKeyInput(storedApiKey);
    }
  }, []);

  const handleSaveApiKey = () => {
    if (apiKeyInput.trim() === '') {
      setSaveMessage('API Key cannot be empty.');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    localStorage.setItem(LOCALSTORAGE_ORS_API_KEY, apiKeyInput.trim());
    setSaveMessage('API Key saved successfully!');
    onApiKeySaved(); // Notify App.tsx
    setTimeout(() => {
      setSaveMessage('');
      if (isInitialSetup) {
        // App.tsx will handle closing the modal via onApiKeySaved effect
      } else {
        // For non-initial setup, we might keep it open or close it.
        // Let's keep it simple: App.tsx will close it if it was initial setup.
        // Otherwise, user can close manually.
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" aria-modal="true" role="dialog">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-lg text-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-sky-300">
            {isInitialSetup ? 'Configuration Required' : 'Settings'}
          </h2>
          {!isInitialSetup && (
            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 text-2xl" 
              aria-label="Close settings modal"
            >
              &times;
            </button>
          )}
        </div>
        
        {isInitialSetup && (
          <p className="mb-4 text-amber-300 bg-amber-900 bg-opacity-50 p-3 rounded-md border border-amber-700">
            Please enter your Openrouteservice API key to enable mapping features.
            You can obtain a free key from{' '}
            <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-300">
              openrouteservice.org
            </a>.
          </p>
        )}

        <div className="space-y-6">
          <div>
            <h3 className="text-md font-medium text-slate-300 mb-2">API Key</h3>
            <div className="p-3 bg-slate-600 rounded">
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Enter your API key"
                className="w-full p-2.5 border border-slate-500 rounded bg-slate-800 text-white focus:ring-2 focus:ring-sky-500 outline-none"
                aria-label="API Key"
              />
              {!isInitialSetup && (
                 <p className="text-xs text-slate-400 mt-2">
                    Manage your API key here. Get your key from{' '}
                    <a href="https://openrouteservice.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-sky-300">
                    openrouteservice.org
                    </a>.
                </p>
              )}
              <button
                onClick={handleSaveApiKey}
                className="mt-3 px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-white font-semibold transition-colors w-full sm:w-auto"
              >
                Save API Key
              </button>
              {saveMessage && <p className={`text-sm mt-2 ${saveMessage.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>{saveMessage}</p>}
            </div>
          </div>

          {!isInitialSetup && (
            <div>
              <h3 className="text-md font-medium text-slate-300 mb-2">API Usage Statistics</h3>
              <div className="p-3 bg-slate-600 rounded mb-2">
                <p className="flex justify-between text-sm">
                  <span>Current Minute Requests:</span>
                  <span className="font-semibold">{minuteCount} / {minuteLimit}</span>
                </p>
              </div>
              <div className="p-3 bg-slate-600 rounded">
                <p className="flex justify-between text-sm">
                  <span>Today's Requests:</span>
                  <span className="font-semibold">{dailyCount} / {dailyLimit}</span>
                </p>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Usage counts reflect requests made by this browser session. Daily limit resets at midnight UTC.
              </p>
            </div>
          )}
        </div>

        {!isInitialSetup && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-400 rounded-md text-white font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsModal;