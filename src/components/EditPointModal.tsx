
import React, { useState, useEffect } from 'react';
import type { Category, Point } from '../types';

interface EditPointModalProps {
  pointToEdit: Point;
  categories: Category[];
  onClose: () => void;
  onSavePoint: (id: string, categoryId: string, name?: string) => void;
  onDeletePoint: (id: string) => void;
}

const EditPointModal: React.FC<EditPointModalProps> = ({ pointToEdit, categories, onClose, onSavePoint, onDeletePoint }) => {
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');

  useEffect(() => {
    if (pointToEdit) {
      setName(pointToEdit.name || '');
      setCategoryId(pointToEdit.categoryId);
    }
  }, [pointToEdit]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pointToEdit) {
      onSavePoint(pointToEdit.id, categoryId, name.trim() || undefined);
    }
  };
  
  const handleDelete = () => {
    if (pointToEdit) {
      onDeletePoint(pointToEdit.id);
    }
  };

  if (!pointToEdit) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-30 p-4" aria-modal="true" role="dialog" aria-labelledby="editPointModalTitle">
      <div className="bg-slate-700 p-6 rounded-lg shadow-xl w-full max-w-md text-gray-200">
        <h2 id="editPointModalTitle" className="text-xl font-semibold mb-6 text-sky-300">Edit Point</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="editPointName" className="block text-sm font-medium text-slate-300 mb-1">Point Name (Optional):</label>
            <input
              type="text"
              id="editPointName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2.5 border border-slate-500 rounded bg-slate-600 text-white focus:ring-2 focus:ring-sky-500 outline-none"
              placeholder="e.g., My Future Home"
            />
          </div>
          <div>
            <label htmlFor="editCategorySelect" className="block text-sm font-medium text-slate-300 mb-1">Select Category:</label>
            <select
              id="editCategorySelect"
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
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
          <div className="flex justify-between items-center pt-4">
            <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-md text-white font-semibold transition-colors"
              >
                Delete Point
            </button>
            <div className="flex space-x-3">
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
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPointModal;
