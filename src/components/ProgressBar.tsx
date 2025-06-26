
import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ current, total }) => {
  if (total === 0 || current >= total) return null; // Hide if no items or loading complete
  const percentage = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-3 bg-slate-800 bg-opacity-90 shadow-lg z-40 text-white">
      <div className="flex justify-between mb-1 text-sm">
        <span>Loading Isochrones...</span>
        <span>{current} / {total}</span>
      </div>
      <div className="w-full bg-slate-600 rounded-full h-2.5">
        <div
          className="bg-sky-500 h-2.5 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar;