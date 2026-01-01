import React, { useState } from 'react';
import { Utensils, List, Settings } from 'lucide-react';
import { ItemsManager } from './ItemsManager';
import { CategoriesManager } from './CategoriesManager'; 
import { ExtrasManager } from './ExtrasManager';

export const MenuManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'toppings'>('items');

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex">
          <button 
            onClick={() => setActiveTab('items')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'items' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              <div className="flex items-center gap-2"><Utensils size={16}/> Items</div>
          </button>
          <button 
            onClick={() => setActiveTab('categories')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              <div className="flex items-center gap-2"><List size={16}/> Categories</div>
          </button>
          <button 
            onClick={() => setActiveTab('toppings')} 
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'toppings' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
              <div className="flex items-center gap-2"><Settings size={16}/> Extras</div>
          </button>
      </div>

      {/* Render Active Tab */}
      {activeTab === 'items' && <ItemsManager />}
      {activeTab === 'categories' && <CategoriesManager />}
      {activeTab === 'toppings' && <ExtrasManager />}
    </div>
  );
};