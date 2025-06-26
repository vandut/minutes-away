
import React from 'react';
import { MIN_TRAVEL_TIME_MINUTES, MAX_TRAVEL_TIME_MINUTES } from '../constants';

interface HeaderProps {
  travelTime: number; // Current value of the slider for display
  onTravelTimeDisplayChange: (time: number) => void; // Called while sliding
  onTravelTimeCommitChange: (time: number) => void; // Called when sliding stops
  onRefresh: () => void;
  isLoading: boolean;
  onOpenSettings: () => void; // Callback to open settings modal
  isApiKeyConfigured: boolean; // To disable refresh if key not set
}

const Header: React.FC<HeaderProps> = ({ 
  travelTime, 
  onTravelTimeDisplayChange, 
  onTravelTimeCommitChange, 
  onRefresh, 
  isLoading,
  onOpenSettings,
  isApiKeyConfigured
}) => {
  
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onTravelTimeDisplayChange(parseInt(e.target.value, 10));
  };

  const handleSliderCommit = (e: React.SyntheticEvent<HTMLInputElement>) => {
    onTravelTimeCommitChange(parseInt(e.currentTarget.value, 10));
  };

  const refreshDisabled = isLoading || !isApiKeyConfigured;

  return (
    <header className="bg-slate-700 text-white p-4 shadow-md flex items-center space-x-4 sticky top-0 z-20">
      <h1 className="text-xl font-semibold">MinutesAway</h1>
      <div className="flex items-center space-x-2 flex-grow">
        <span className="text-2xl" title="Mode of Transport: Pedestrian">🚶</span>
        <label htmlFor="travelTimeSlider" className="text-sm whitespace-nowrap">Travel time (min):</label>
        <input
          type="range"
          id="travelTimeSlider"
          min={MIN_TRAVEL_TIME_MINUTES}
          max={MAX_TRAVEL_TIME_MINUTES}
          value={travelTime}
          onChange={handleSliderChange}
          onMouseUp={handleSliderCommit}
          onTouchEnd={handleSliderCommit}
          className="w-full h-2 bg-slate-500 rounded-lg appearance-none cursor-pointer accent-sky-500"
          disabled={isLoading || !isApiKeyConfigured} // Also disable slider if API key not set
        />
        <span className="text-sm w-8 text-center">{travelTime}</span> 
      </div>
      <button
        onClick={onRefresh}
        disabled={refreshDisabled}
        className="p-2 bg-sky-600 hover:bg-sky-500 rounded-md flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={!isApiKeyConfigured ? "API Key required to refresh" : "Refresh Isochrones (bypass cache)"}
      >
        <span className="text-lg">🔄</span>
        <span>Refresh</span>
      </button>
      <button
        onClick={onOpenSettings}
        disabled={isLoading && isApiKeyConfigured} // Only disable if loading AND key is set (initial setup shouldn't disable this)
        className="p-2 bg-slate-600 hover:bg-slate-500 rounded-md flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Settings"
        aria-label="Open Settings"
      >
        <span className="text-xl">⚙️</span>
      </button>
    </header>
  );
};

export default Header;