
import React, { useState } from 'react';
import type { Category } from '../types';

interface AddPointModalProps {
  categories: Category[];
  onClose: () => void;
  onAddPoint: (categoryId: string, pointName?: string) => void;
}

const AddPointModal: React.FC<AddPointModalProps> = ({ categories, onClose, onAddPoint }) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [pointName, setPointName] = useState<string>('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCategoryId) {
      onAddPoint(selectedCategoryId, pointName.trim() || undefined);
    }
  };

  if (categories.length === 0) {
    return (
       <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4">
        <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
          <h2 className="text-xl font-semibold mb-4 text-sky-300">Add New Point</h2>
          <p className="text-slate-300 mb-4">You need to create a category first before adding points.</p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-500 hover:bg-slate-400 rounded-md text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
        <h2 className="text-xl font-semibold mb-6 text-sky-300">Add New Point</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="pointName" className="block text-sm font-medium text-slate-300 mb-1">Point Name (Optional):</label>
            <input
              type="text"
              id="pointName"
              value={pointName}
              onChange={(e) => setPointName(e.target.value)}
              className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="e.g., My Future Home"
            />
          </div>
          <div>
            <label htmlFor="categorySelect" className="block text-sm font-medium text-slate-300 mb-1">Select Category:</label>
            <select
              id="categorySelect"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
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
              Add Point
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddPointModal;