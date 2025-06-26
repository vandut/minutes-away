
import React, { useState } from 'react';

interface AddCategoryModalProps {
  onClose: () => void;
  onAddCategory: (name: string, color: string, icon: string, generateIsochrones: boolean) => void;
}

// Export this array so it can be reused
export const COMMON_EMOJIS = [
  '📍', '🚌', '🚆', 
  '🏠', '🏢', '🏨', '🏪', 
  '🛍️', '🛒', '🍽️', '☕', '🍹',
  '🍕', '🍔', '🌳', '🏞️', '🏛️',
  '🏦', '🏥', '💊', '🏫', 
  '🚗', '🚲', '🚶', '⭐'
];


const AddCategoryModal: React.FC<AddCategoryModalProps> = ({ onClose, onAddCategory }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('#FF0000');
  const [icon, setIcon] = useState('📍'); 
  const [generateIsochrones, setGenerateIsochrones] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && icon.trim()) {
      onAddCategory(name.trim(), color, icon.trim(), generateIsochrones);
    }
  };

  const handleEmojiClick = (selectedEmoji: string) => {
    setIcon(selectedEmoji);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4" aria-modal="true" role="dialog" aria-labelledby="addCategoryModalTitle">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
        <h2 id="addCategoryModalTitle" className="text-xl font-semibold mb-6 text-sky-300">Add New Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="categoryName" className="block text-sm font-medium text-slate-300 mb-1">Category Name:</label>
            <input
              type="text"
              id="categoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="e.g., Apartments, Shops"
            />
          </div>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label htmlFor="categoryColor" className="block text-sm font-medium text-slate-300 mb-1">Color:</label>
              <input
                type="color"
                id="categoryColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 p-1 border border-slate-500 rounded bg-slate-600 cursor-pointer"
                title="Select category color"
              />
            </div>
            <div className="flex-1">
                <label htmlFor="categoryIcon" className="block text-sm font-medium text-slate-300 mb-1">Icon (Emoji):</label>
                <input
                type="text"
                id="categoryIcon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4} 
                required
                className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none text-center text-2xl h-10"
                placeholder="🏠"
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Or pick one:</label>
            <div className="grid grid-cols-5 gap-2 p-2 border border-slate-600 rounded bg-slate-800 max-h-32 overflow-y-auto">
              {COMMON_EMOJIS.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className={`p-1 rounded text-2xl hover:bg-sky-600 focus:bg-sky-500 transition-colors ${icon === emoji ? 'bg-sky-700 ring-2 ring-sky-400' : 'bg-slate-700'}`}
                  title={emoji}
                  aria-label={`Select emoji ${emoji}`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center space-x-2 mt-4">
            <input
              type="checkbox"
              id="generateIsochrones"
              checked={generateIsochrones}
              onChange={(e) => setGenerateIsochrones(e.target.checked)}
              className="h-4 w-4 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
            />
            <label htmlFor="generateIsochrones" className="text-sm font-medium text-slate-300">
              Generate Isochrones for this category
            </label>
          </div>
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-400 rounded-md text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-sky-600 hover:bg-sky-500 rounded-md text-white font-semibold transition-colors"
            >
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddCategoryModal;
