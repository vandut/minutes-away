
import React, { useState } from 'react';
import type { Category, Point } from '../types';
import AddCategoryModal from './AddCategoryModal';

interface SidebarProps {
  categories: Category[];
  points: Point[];
  onAddCategory: (name: string, color: string, icon: string, generateIsochrones: boolean) => void;
  onToggleCategoryVisibility: (id: string) => void;
  onToggleCategoryCollapse: (id: string) => void;
  onTogglePointVisibility: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onDeletePoint: (id: string) => void;
  onOpenEditCategoryModal: (category: Category) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  categories,
  points,
  onAddCategory,
  onToggleCategoryVisibility,
  onToggleCategoryCollapse,
  onTogglePointVisibility,
  onDeleteCategory,
  onDeletePoint,
  onOpenEditCategoryModal
}) => {
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);

  return (
    <aside className="w-[350px] bg-slate-800 text-gray-200 p-4 h-full flex flex-col">
      {/* Sticky Header */}
      <h2 className="text-lg font-semibold mb-3 border-b border-slate-700 pb-2 shrink-0">
        Categories & Points
      </h2>

      {/* Scrollable Content Area */}
      <div className="flex-grow overflow-y-auto space-y-3 pr-1"> {/* pr-1 for scrollbar */}
        {categories.length === 0 && (
          <p className="text-sm text-slate-400 py-2">No categories yet. Add one below!</p>
        )}
        {categories.map(category => {
          const categoryPoints = points.filter(p => p.categoryId === category.id);
          return (
            <div key={category.id} className="bg-slate-700 rounded-lg shadow overflow-hidden">
              <div 
                className="flex items-center justify-between p-3 cursor-pointer select-none"
                onClick={() => onToggleCategoryCollapse(category.id)}
                aria-expanded={!category.isCollapsed}
              >
                <div className="flex items-center space-x-2 flex-grow min-w-0">
                  <span className={`inline-block text-2xl text-slate-400 transform transition-transform duration-200 ${category.isCollapsed ? '' : 'rotate-90'}`}>
                    ›
                  </span>
                  <input
                    type="checkbox"
                    checked={category.isVisible}
                    onClick={(e) => e.stopPropagation()}
                    onChange={() => onToggleCategoryVisibility(category.id)}
                    className="form-checkbox h-5 w-5 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
                    aria-label={`Toggle visibility for category ${category.name}`}
                  />
                  <span className="text-2xl" aria-hidden="true">{category.icon}</span>
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} aria-hidden="true"></div>
                  <span className="font-medium text-sky-300 flex-grow truncate" title={category.name}>{category.name}</span>
                </div>
                <div className="flex items-center space-x-2 flex-shrink-0 pl-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onOpenEditCategoryModal(category); }} 
                    className="text-sky-400 hover:text-sky-300 text-lg"
                    title={`Edit category ${category.name}`}
                    aria-label={`Edit category ${category.name}`}
                  >
                    ✏️
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onDeleteCategory(category.id); }} 
                    className="text-red-400 hover:text-red-300 text-lg"
                    title={`Delete category ${category.name}`}
                    aria-label={`Delete category ${category.name}`}
                  >
                    🗑️ 
                  </button>
                </div>
              </div>
              
              <div className={`transition-all duration-300 ease-in-out ${category.isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[500px] opacity-100'}`}>
                <div className="pl-5 pr-3 pb-3">
                    <ul className="pl-6 space-y-1 mt-1">
                      {categoryPoints.map(point => (
                        <li key={point.id} className="flex items-center justify-between text-sm text-slate-300">
                          <div className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={point.isVisible}
                              onChange={() => onTogglePointVisibility(point.id)}
                              className="form-checkbox h-4 w-4 text-sky-500 bg-slate-600 border-slate-500 rounded focus:ring-sky-500"
                              aria-label={`Toggle visibility for point ${point.name || `Point ${point.id.substring(0, 4)}`}`}
                            />
                            <span className="truncate" title={point.name || `Point ${point.id.substring(0, 4)}`}>{point.name || `Point ${point.id.substring(0, 4)}`}</span>
                          </div>
                          <button 
                            onClick={() => onDeletePoint(point.id)} 
                            className="text-red-400 hover:text-red-300 text-lg"
                            title={`Delete point ${point.name || `Point ${point.id.substring(0, 4)}`}`}
                            aria-label={`Delete point ${point.name || `Point ${point.id.substring(0, 4)}`}`}
                          >
                            🗑️
                          </button>
                        </li>
                      ))}
                      {categoryPoints.length === 0 && (
                        <li className="text-xs text-slate-500 italic list-none">No points in this category. Click on the map to add.</li>
                      )}
                    </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sticky Button */}
      <button
        onClick={() => setIsAddCategoryModalOpen(true)}
        className="w-full mt-4 p-2.5 bg-sky-600 hover:bg-sky-500 rounded-md font-semibold transition-colors shrink-0"
      >
        + Add New Category
      </button>

      {isAddCategoryModalOpen && (
        <AddCategoryModal
          onClose={() => setIsAddCategoryModalOpen(false)}
          onAddCategory={(name, color, icon, generateIsochrones) => {
            onAddCategory(name, color, icon, generateIsochrones);
            setIsAddCategoryModalOpen(false);
          }}
        />
      )}
    </aside>
  );
};

export default Sidebar;
