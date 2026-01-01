import React, { useState, useMemo, useRef, useEffect } from 'react';
// NEW HOOKS
import { useData } from '../../context/DataContext';
import { useOrder } from '../../context/OrderContext';

import { MenuItem, Category } from '../../types';
import { Search, X, Image as ImageIcon } from 'lucide-react';
import { ModifierModal } from './ModifierModal';
import { DailyOrdersModal } from './DailyOrdersModal';

// --- Helper Component for Individual Cards ---
const MenuItemCard: React.FC<{ item: MenuItem; onClick: (i: MenuItem) => void }> = ({ item, onClick }) => {
  // Get image toggle state from DataContext
  const { showImages } = useData(); 
  const [imageError, setImageError] = useState(false);
  
  return (
    <div 
      onClick={() => onClick(item)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden cursor-pointer hover:shadow-md transition-all active:scale-95 duration-100 flex flex-col group h-full"
    >
      {showImages && (
        <div className="h-32 w-full bg-gray-100 dark:bg-gray-700 relative overflow-hidden shrink-0 flex items-center justify-center">
          
          {item.image && !imageError ? (
            <img 
              src={item.image} 
              alt={item.name} 
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
              loading="lazy" 
              onError={() => {
                console.warn(`Failed to load image for ${item.name}`);
                setImageError(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
               <ImageIcon size={32} />
            </div>
          )}

          {!item.available && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-[1px] z-10">
              <span className="text-white font-bold text-xs bg-red-500 px-2 py-1 rounded shadow-sm">SOLD OUT</span>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-3 flex-1 flex flex-col justify-between">
        <h3 className="font-semibold text-gray-800 dark:text-gray-100 text-sm leading-tight mb-1">{item.name}</h3>
        <div className="flex justify-between items-center mt-2">
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {item.pricingType !== 'FIXED' && `${item.availableSizes.length} Sizes`}
            </div>
            
            {item.pricingType === 'FIXED' ? (
              <span className="text-blue-600 dark:text-blue-400 font-bold text-sm bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                  ${item.price?.toFixed(2)}
              </span>
            ) : (
              item.availableSizes.length > 0 && item.sizePrices && (
                  <span className="text-blue-600 dark:text-blue-400 font-bold text-xs bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">
                      From ${item.sizePrices[item.availableSizes[0]]?.toFixed(0)}
                  </span>
              )
            )}
        </div>
      </div>
    </div>
  );
};

// --- Main Screen ---
export const POSScreen: React.FC = () => {
  // Use specific hooks
  const { menu, categories } = useData();
  const { addToCart, showHistoryModal, setShowHistoryModal } = useOrder();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      if (isSearchExpanded && searchInputRef.current) {
          searchInputRef.current.focus();
      }
  }, [isSearchExpanded]);

  const groupedItems = useMemo(() => {
    const result: { category: Category; items: MenuItem[] }[] = [];
    const categoriesToShow = selectedCategory === 'all' 
      ? categories 
      : categories.filter(c => c.id === selectedCategory);

    categoriesToShow.forEach(cat => {
      let catItems = menu.filter(item => item.categoryId === cat.id);
      
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        catItems = catItems.filter(i => i.name.toLowerCase().includes(q));
      }

      catItems.sort((a, b) => {
          const isMiscA = a.name.toLowerCase() === 'misc' || a.name.toLowerCase() === 'miscellaneous';
          const isMiscB = b.name.toLowerCase() === 'misc' || b.name.toLowerCase() === 'miscellaneous';

          if (isMiscA && !isMiscB) return 1;
          if (!isMiscA && isMiscB) return -1;

          const aIsBundle = a.itemType === 'BUNDLE';
          const bIsBundle = b.itemType === 'BUNDLE';

          if (aIsBundle && !bIsBundle) return 1;
          if (!aIsBundle && bIsBundle) return -1;

          return a.name.localeCompare(b.name);
      });

      if (catItems.length > 0) {
        result.push({ category: cat, items: catItems });
      }
    });
    return result;
  }, [menu, categories, selectedCategory, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-50 dark:bg-gray-900 transition-colors">
      {/* Top Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 shadow-sm z-10 transition-colors">
        <div className="flex items-center justify-between gap-4">
          
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 flex-1">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === 'all' 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              All Items
            </button>
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.id 
                    ? 'bg-blue-600 text-white shadow-md' 
                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className={`flex items-center transition-all duration-300 ease-in-out ${isSearchExpanded ? 'w-64' : 'w-10'}`}>
             {isSearchExpanded ? (
                 <div className="relative w-full animate-in fade-in zoom-in-95 duration-200">
                    <Search className="absolute left-3 top-2.5 text-gray-400 dark:text-gray-500" size={18} />
                    <input 
                      ref={searchInputRef}
                      type="text" 
                      placeholder="Search..." 
                      className="w-full pl-10 pr-8 py-2 rounded-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onBlur={() => !searchQuery && setIsSearchExpanded(false)}
                    />
                    <button 
                        onClick={() => { setSearchQuery(''); setIsSearchExpanded(false); }}
                        className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500"
                    >
                        <X size={16} />
                    </button>
                 </div>
             ) : (
                 <button 
                    onClick={() => setIsSearchExpanded(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                 >
                     <Search size={20} />
                 </button>
             )}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8">
        {groupedItems.length === 0 ? (
           <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
             <p className="text-lg">No items found</p>
           </div>
        ) : (
          groupedItems.map(group => (
            <div key={group.category.id} className="animate-in fade-in duration-500 slide-in-from-bottom-2">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2 sticky top-0 bg-gray-50/95 dark:bg-gray-900/95 backdrop-blur-sm py-2 z-10 transition-colors">
                {group.category.name}
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400 bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded-full ml-2">
                  {group.items.length}
                </span>
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {group.items.map(item => (
                  <MenuItemCard 
                    key={item.id} 
                    item={item} 
                    onClick={setSelectedItem} 
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {selectedItem && (
        <ModifierModal 
          item={selectedItem} 
          onClose={() => setSelectedItem(null)} 
          onConfirm={(qty, size, addedToppings, removedToppings, selectedBaseSauce, notes, subItems) => {
            addToCart(selectedItem, qty, size, addedToppings, removedToppings, selectedBaseSauce, notes, subItems);
            setSelectedItem(null);
          }}
        />
      )}

      {showHistoryModal && (
        <DailyOrdersModal onClose={() => setShowHistoryModal(false)} />
      )}
    </div>
  );
};