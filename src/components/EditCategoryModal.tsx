
import React, { useState, useEffect } from 'react';
import type { Category } from '../types';
import { COMMON_EMOJIS } from './AddCategoryModal'; // Reuse common emojis

interface EditCategoryModalProps {
  categoryToEdit: Category;
  onClose: () => void;
  onSaveCategory: (id: string, name: string, color: string, icon: string, generateIsochrones: boolean) => void;
}

const EditCategoryModal: React.FC<EditCategoryModalProps> = ({ categoryToEdit, onClose, onSaveCategory }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [icon, setIcon] = useState('');
  const [generateIsochrones, setGenerateIsochrones] = useState(true);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name);
      setColor(categoryToEdit.color);
      setIcon(categoryToEdit.icon);
      setGenerateIsochrones(categoryToEdit.generateIsochrones === undefined ? true : categoryToEdit.generateIsochrones);
    }
  }, [categoryToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && icon.trim() && categoryToEdit) {
      onSaveCategory(categoryToEdit.id, name.trim(), color, icon.trim(), generateIsochrones);
    }
  };

  const handleEmojiClick = (selectedEmoji: string) => {
    setIcon(selectedEmoji);
  };

  if (!categoryToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4" aria-modal="true" role="dialog" aria-labelledby="editCategoryModalTitle">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
        <h2 id="editCategoryModalTitle" className="text-xl font-semibold mb-6 text-sky-300">Edit Category</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editCategoryName" className="block text-sm font-medium text-slate-300 mb-1">Category Name:</label>
            <input
              type="text"
              id="editCategoryName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="e.g., Apartments, Shops"
            />
          </div>
          <div className="flex space-x-4 items-end">
            <div className="flex-1">
              <label htmlFor="editCategoryColor" className="block text-sm font-medium text-slate-300 mb-1">Color:</label>
              <input
                type="color"
                id="editCategoryColor"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-full h-10 p-1 border border-slate-500 rounded bg-slate-600 cursor-pointer"
                title="Select category color"
              />
            </div>
            <div className="flex-1">
                <label htmlFor="editCategoryIcon" className="block text-sm font-medium text-slate-300 mb-1">Icon (Emoji):</label>
                <input
                type="text"
                id="editCategoryIcon"
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
              id="editGenerateIsochrones"
              checked={generateIsochrones}
              onChange={(e) => setGenerateIsochrones(e.target.checked)}
              className="h-4 w-4 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
            />
            <label htmlFor="editGenerateIsochrones" className="text-sm font-medium text-slate-300">
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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCategoryModal;