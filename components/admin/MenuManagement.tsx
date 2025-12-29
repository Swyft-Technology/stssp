import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { dataService } from '../../services/dataService';
import { Button } from '../ui/Button';
import { Edit2, Trash2, Plus, X, Utensils, Settings, List, GripVertical, Upload, Copy, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
import { MenuItem, Topping, Category, PizzaSize } from '../../types';

interface ModalProps {
    children?: React.ReactNode;
    onClose: () => void;
    title: string;
}

const Modal: React.FC<ModalProps> = ({ children, onClose, title }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                <h4 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h4>
                <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20}/></button>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    </div>
);

export const MenuManagement: React.FC = () => {
  const { menu, categories, toppings, refreshData } = useData();
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'toppings'>('items');
  
  // Editor State
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
  const [editingTopping, setEditingTopping] = useState<Partial<Topping> | null>(null);
  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, boolean>>({});

  // Items Table State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);
  const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'category' | 'type' | 'pricing', direction: 'asc' | 'desc' } | null>(null);
  const [extraSortConfig, setExtraSortConfig] = useState<{ key: 'name' | 'type' | 'price', direction: 'asc' | 'desc' } | null>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setEditingItem(prev => prev ? ({...prev, image: reader.result as string}) : null);
          };
          reader.readAsDataURL(file);
      }
  };

  const sanitizeForFirestore = (obj: any): any => {
    return JSON.parse(JSON.stringify(obj, (key, value) => {
        return value === undefined ? null : value;
    }));
  };

  const validateItemForm = () => {
      const errors: Record<string, boolean> = {};
      if (!editingItem?.name?.trim()) errors.name = true;
      if (!editingItem?.categoryId) errors.categoryId = true;
      
      setFormErrors(errors);
      return Object.keys(errors).length === 0;
  };

  const saveItem = async () => {
    if (!validateItemForm()) return;
    if (!editingItem) return;
    
    const baseItem = {
      ...editingItem,
      id: editingItem.id || crypto.randomUUID(),
      available: editingItem.available ?? true,
      image: editingItem.image || '',
      pricingType: editingItem.pricingType || 'FIXED', 
      itemType: editingItem.itemType || 'SINGLE',
      allowModifiers: editingItem.itemType === 'BUNDLE' ? false : (editingItem.allowModifiers ?? false),
      price: editingItem.pricingType === 'FIXED' ? Number(editingItem.price) : undefined,
      sizePrices: editingItem.pricingType === 'SIZE_BASED' ? (editingItem.sizePrices || {}) : undefined,
      availableSizes: editingItem.pricingType === 'SIZE_BASED' ? (editingItem.availableSizes || ['Small', 'Medium', 'Large', 'Family']) : [],
      defaultToppings: editingItem.defaultToppings || [],
      requiredSelectionIds: (editingItem.requiredSelectionIds && editingItem.requiredSelectionIds.length > 0) ? editingItem.requiredSelectionIds : undefined,
      requiredSelectionLabel: editingItem.requiredSelectionLabel || 'Select Option',
      subItemConfigs: editingItem.subItemConfigs || [],
      allowHalfHalf: false,
      excludedFromHalfHalf: editingItem.excludedFromHalfHalf ?? false
    };

    const newItem = sanitizeForFirestore(baseItem) as MenuItem;
    await dataService.saveMenu([newItem]); 
    await refreshData();
    setEditingItem(null);
    setFormErrors({});
  };

  const deleteItem = async (id: string) => {
    if(!window.confirm("Are you sure? This cannot be undone.")) return;
    await dataService.deleteMenuItem(id);
    await refreshData();
  };

  const saveTopping = async () => {
    if (!editingTopping || !editingTopping.name) return;

    const baseTopping = {
        ...editingTopping,
        id: editingTopping.id || crypto.randomUUID(),
        price: Number(editingTopping.price) || 0,
        available: editingTopping.available ?? true,
        type: editingTopping.type || 'TOPPING',
        availableSizes: editingTopping.availableSizes
    };

    const newTopping = sanitizeForFirestore(baseTopping) as Topping;
    await dataService.saveToppings([newTopping]);
    await refreshData();
    setEditingTopping(null);
  };

  const deleteTopping = async (id: string) => {
      if(!window.confirm("Delete this extra?")) return;
      await dataService.deleteTopping(id);
      await refreshData();
  };

  const saveCategory = async () => {
    if (!editingCategory || !editingCategory.name) return;
    const newCat = {
        ...editingCategory,
        id: editingCategory.id || crypto.randomUUID(),
        sortOrder: editingCategory.sortOrder || categories.length,
        icon: '',
        ticketPriority: editingCategory.ticketPriority // Save Priority
    } as Category;
    await dataService.saveCategories([newCat]);
    await refreshData();
    setEditingCategory(null);
  };

  const deleteCategory = async (id: string) => {
      if(!window.confirm("Delete this category?")) return;
      await dataService.deleteCategory(id);
      await refreshData();
  }

  const onDragStart = (index: number) => setDraggedCategoryIndex(index);
  const onDragOver = (e: React.DragEvent, index: number) => e.preventDefault();
  const onDrop = async (dropIndex: number) => {
    if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;
    const newCats = [...categories];
    const [movedItem] = newCats.splice(draggedCategoryIndex, 1);
    newCats.splice(dropIndex, 0, movedItem);
    const updatedCats = newCats.map((cat, idx) => ({ ...cat, sortOrder: idx }));
    await dataService.saveCategories(updatedCats);
    await refreshData();
    setDraggedCategoryIndex(null);
  };

  const inputClass = (hasError: boolean) => `w-full border p-2 rounded bg-white text-gray-900 ${hasError ? 'border-red-500 ring-1 ring-red-500' : 'border-gray-300'} dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none`;
  const labelClass = "block text-sm text-gray-600 dark:text-gray-300 mb-1";
  const optionToppings = toppings.filter(t => t.type === 'SAUCE_OPTION' || t.type === 'OPTION');

  const sortedIncludedToppings = useMemo(() => {
      if (!editingItem) return [];
      return toppings
        .filter(t => t.type !== 'BASE_OPTION' && t.type !== 'SAUCE_OPTION' && t.type !== 'SIDE') 
        .sort((a, b) => {
            const aSelected = editingItem.defaultToppings?.includes(a.id);
            const bSelected = editingItem.defaultToppings?.includes(b.id);
            if (aSelected && !bSelected) return -1;
            if (!aSelected && bSelected) return 1;
            return a.name.localeCompare(b.name);
        });
  }, [toppings, editingItem?.defaultToppings, editingItem?.id]);

  const updateSubItemConfig = (idx: number, field: string, value: any) => {
      if (!editingItem) return;
      const newConfigs = [...(editingItem.subItemConfigs || [])];
      newConfigs[idx] = { ...newConfigs[idx], [field]: value };
      setEditingItem({ ...editingItem, subItemConfigs: newConfigs });
  };

  const addSubItemConfig = () => {
      if (!editingItem) return;
      setEditingItem({
          ...editingItem,
          subItemConfigs: [
              ...(editingItem.subItemConfigs || []),
              { id: crypto.randomUUID(), name: 'Selection', allowCategories: [] }
          ]
      });
  };

  const removeSubItemConfig = (idx: number) => {
      if (!editingItem) return;
      const newConfigs = [...(editingItem.subItemConfigs || [])];
      newConfigs.splice(idx, 1);
      setEditingItem({ ...editingItem, subItemConfigs: newConfigs });
  };

  const applyPricingTemplate = (templateItemId: string) => {
      const template = menu.find(m => m.id === templateItemId);
      if (template && editingItem) {
          setEditingItem({
              ...editingItem,
              pricingType: template.pricingType,
              price: template.price,
              sizePrices: template.sizePrices,
              availableSizes: template.availableSizes
          });
      }
  };

  const handleSort = (key: 'name' | 'category' | 'type' | 'pricing') => {
      let direction: 'asc' | 'desc' = 'asc';
      if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
          direction = 'desc';
      }
      setSortConfig({ key, direction });
  };

  const sortedAndPaginatedMenu = useMemo(() => {
      let sorted = [...menu];
      if (sortConfig) {
          sorted.sort((a, b) => {
              let aVal = '';
              let bVal = '';
              switch (sortConfig.key) {
                  case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                  case 'category': aVal = categories.find(c => c.id === a.categoryId)?.name.toLowerCase() || ''; bVal = categories.find(c => c.id === b.categoryId)?.name.toLowerCase() || ''; break;
                  case 'type': aVal = a.itemType; bVal = b.itemType; break;
                  case 'pricing': aVal = a.pricingType; bVal = b.pricingType; break;
              }
              if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      const start = (currentPage - 1) * itemsPerPage;
      return sorted.slice(start, start + itemsPerPage);
  }, [menu, sortConfig, currentPage, itemsPerPage, categories]);

  const totalPages = Math.ceil(menu.length / itemsPerPage);

  const handleExtraSort = (key: 'name' | 'type' | 'price') => {
    let direction: 'asc' | 'desc' = 'asc';
    if (extraSortConfig && extraSortConfig.key === key && extraSortConfig.direction === 'asc') {
        direction = 'desc';
    }
    setExtraSortConfig({ key, direction });
  };

  const sortedExtras = useMemo(() => {
      let sorted = [...toppings];
      if (extraSortConfig) {
          sorted.sort((a, b) => {
              let aVal: any = '';
              let bVal: any = '';
              switch (extraSortConfig.key) {
                  case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                  case 'type': aVal = a.type; bVal = b.type; break;
                  case 'price': aVal = a.price; bVal = b.price; break;
              }
              if (aVal < bVal) return extraSortConfig.direction === 'asc' ? -1 : 1;
              if (aVal > bVal) return extraSortConfig.direction === 'asc' ? 1 : -1;
              return 0;
          });
      }
      return sorted;
  }, [toppings, extraSortConfig]);

  const renderItemsTab = () => (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <h3 className="text-lg font-bold text-gray-800 dark:text-white">Menu Items</h3>
         <Button 
            onClick={() => {
                setFormErrors({});
                setEditingItem({ 
                    pricingType: 'FIXED', 
                    itemType: 'SINGLE', 
                    availableSizes: ['Small', 'Medium', 'Large', 'Family'], 
                    allowModifiers: false,
                    defaultToppings: []
                })
            }} 
            className="flex gap-2"
         >
            <Plus size={16}/> New Item
         </Button>
       </div>

       {editingItem && (
         <Modal title={editingItem.id ? 'Edit Item' : 'New Item'} onClose={() => { setEditingItem(null); setFormErrors({}); }}>
            {/* ... Item Modal Content (No Changes needed here) ... */}
            {/* For brevity, I'm keeping the complex item modal structure implicitly same as your source */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className={labelClass}>Name <span className="text-red-500">*</span></label>
                  <input className={inputClass(!!formErrors.name)} value={editingItem.name || ''} onChange={e => setEditingItem({...editingItem, name: e.target.value})} />
                  {formErrors.name && <span className="text-xs text-red-500">Name is required</span>}
               </div>
               <div>
                  <label className={labelClass}>Category <span className="text-red-500">*</span></label>
                  <div className="flex gap-2">
                      <select className={inputClass(!!formErrors.categoryId)} value={editingItem.categoryId || ''} onChange={e => setEditingItem({...editingItem, categoryId: e.target.value})}>
                         <option value="">Select Category</option>
                         {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                      {editingItem.categoryId && (
                          <div className="relative group">
                              <select 
                                onChange={(e) => applyPricingTemplate(e.target.value)}
                                className="w-10 h-full border border-blue-200 bg-blue-50 text-blue-600 rounded p-1 opacity-0 absolute inset-0 cursor-pointer"
                                value=""
                              >
                                  <option value="" disabled>Copy Pricing...</option>
                                  {menu.filter(m => m.categoryId === editingItem.categoryId && m.id !== editingItem.id).map(m => (
                                      <option key={m.id} value={m.id}>Copy from {m.name}</option>
                                  ))}
                              </select>
                              <div className="w-10 h-full flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 pointer-events-none" title="Copy pricing from another item">
                                  <Copy size={16} className="text-gray-500"/>
                              </div>
                          </div>
                      )}
                  </div>
                  {formErrors.categoryId && <span className="text-xs text-red-500">Category is required</span>}
               </div>
               
               <div className="md:col-span-2">
                  <label className={labelClass}>Item Image</label>
                  <div className="flex items-center gap-4">
                      {editingItem.image && (
                          <img src={editingItem.image} alt="Preview" className="w-16 h-16 rounded object-cover border" />
                      )}
                      <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded flex items-center gap-2">
                          <Upload size={16} />
                          Upload Image
                          <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                  </div>
               </div>

               <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                 <h5 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Item Type</h5>
                 <div className="flex gap-2 mb-4">
                     <button 
                        onClick={() => {
                            setEditingItem({...editingItem, itemType: 'SINGLE', pricingType: 'SIZE_BASED'});
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${editingItem.itemType === 'SINGLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                     >
                         Standard Item
                     </button>
                     <button 
                        onClick={() => {
                            setEditingItem({
                                ...editingItem, 
                                itemType: 'BUNDLE', 
                                pricingType: 'FIXED',
                                subItemConfigs: editingItem.subItemConfigs?.length ? editingItem.subItemConfigs : [
                                    { id: crypto.randomUUID(), name: 'Step 1', allowCategories: [] }
                                ]
                            });
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border ${editingItem.itemType === 'BUNDLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                     >
                         Bundle
                     </button>
                 </div>

                 <div className="flex flex-col gap-2 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                    <h5 className="font-bold text-sm text-gray-800 dark:text-white">Pricing Strategy</h5>
                    <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input type="radio" checked={editingItem.pricingType === 'FIXED'} onChange={() => setEditingItem({...editingItem, pricingType: 'FIXED'})} />
                            <span className="text-sm font-medium">Fixed Price</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input type="radio" checked={editingItem.pricingType === 'SIZE_BASED'} onChange={() => setEditingItem({...editingItem, pricingType: 'SIZE_BASED'})} />
                            <span className="text-sm font-medium">Size Based</span>
                        </label>
                    </div>
                 </div>

                 {editingItem.itemType !== 'BUNDLE' && (
                     <div className="mt-4 flex flex-col md:flex-row gap-4 md:gap-6">
                         <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input 
                                type="checkbox" 
                                checked={editingItem.allowModifiers ?? false} 
                                onChange={(e) => setEditingItem({...editingItem, allowModifiers: e.target.checked})} 
                            />
                            <span className="text-sm font-medium">Allow Modifiers</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-gray-700 dark:text-gray-300">
                            <input 
                                type="checkbox" 
                                checked={editingItem.requiredSelectionIds !== undefined && editingItem.requiredSelectionIds !== null} 
                                onChange={(e) => {
                                    if (e.target.checked) {
                                        setEditingItem({...editingItem, requiredSelectionIds: []});
                                    } else {
                                        setEditingItem({...editingItem, requiredSelectionIds: undefined});
                                    }
                                }} 
                            />
                            <span className="text-sm font-medium">Require Option Selection</span>
                        </label>
                     </div>
                 )}
               </div>

               {/* ... Keep the rest of the Item Modal (Bundle, Pricing, Required, Modifiers) unchanged ... */}
               {/* Note to User: I am condensing this section because it is identical to your file. 
                   I am pasting the closing tags below to ensure valid JSX */}
               
               {editingItem.itemType === 'BUNDLE' && (
                   <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                       {/* Bundle Logic */}
                       <div className="flex justify-between items-center mb-2">
                           <label className={labelClass}>Bundle Items</label>
                           <Button size="sm" variant="secondary" onClick={addSubItemConfig}><Plus size={14}/> Add Step</Button>
                       </div>
                       <div className="space-y-3">
                           {editingItem.subItemConfigs?.map((config, idx) => (
                               <div key={config.id} className="border p-3 rounded bg-white dark:bg-gray-800">
                                   <div className="flex justify-between items-center mb-2">
                                       <input 
                                          className="font-bold text-sm border-b border-gray-300 focus:border-blue-500 outline-none w-1/2"
                                          value={config.name}
                                          onChange={e => updateSubItemConfig(idx, 'name', e.target.value)}
                                       />
                                       <button onClick={() => removeSubItemConfig(idx)} className="text-red-500"><Trash2 size={14}/></button>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4">
                                       <div>
                                           <label className="text-xs text-gray-500 block mb-1">Allowed Categories</label>
                                           <div className="max-h-24 overflow-y-auto border rounded p-1">
                                               {categories.map(cat => (
                                                   <label key={cat.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50">
                                                       <input 
                                                          type="checkbox"
                                                          checked={config.allowCategories.includes(cat.id)}
                                                          onChange={e => {
                                                              const current = config.allowCategories;
                                                              if(e.target.checked) updateSubItemConfig(idx, 'allowCategories', [...current, cat.id]);
                                                              else updateSubItemConfig(idx, 'allowCategories', current.filter(c => c !== cat.id));
                                                          }}
                                                       />
                                                       {cat.name}
                                                   </label>
                                               ))}
                                           </div>
                                       </div>
                                       <div className="space-y-2">
                                           <div>
                                               <label className="text-xs text-gray-500 block mb-1">Force Size (Optional)</label>
                                               <select 
                                                  className="w-full border p-1 rounded text-sm"
                                                  value={config.forceSize || ''}
                                                  onChange={e => updateSubItemConfig(idx, 'forceSize', e.target.value || undefined)}
                                               >
                                                   <option value="">User Selects Size</option>
                                                   <option value="Small">Small</option>
                                                   <option value="Medium">Medium</option>
                                                   <option value="Large">Large</option>
                                                   <option value="Family">Family</option>
                                               </select>
                                           </div>
                                           <div>
                                               <label className="text-xs text-gray-500 block mb-1">Force Item (Optional)</label>
                                               <select 
                                                  className="w-full border p-1 rounded text-sm"
                                                  value={config.forceItemId || ''}
                                                  onChange={e => updateSubItemConfig(idx, 'forceItemId', e.target.value || undefined)}
                                               >
                                                   <option value="">User Selects Item</option>
                                                   {menu
                                                    .filter(m => config.allowCategories.includes(m.categoryId)) 
                                                    .map(m => (
                                                       <option key={m.id} value={m.id}>{m.name}</option>
                                                    ))}
                                               </select>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
               )}
               
               {editingItem.pricingType === 'FIXED' ? (
                   <div>
                       <label className={labelClass}>Price ($)</label>
                       <input type="number" className={inputClass(false)} value={editingItem.price || ''} onChange={e => setEditingItem({...editingItem, price: parseFloat(e.target.value)})} />
                   </div>
               ) : (
                   <div className="md:col-span-2">
                       <label className={labelClass}>Available Sizes & Prices</label>
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {['Small', 'Medium', 'Large', 'Family'].map(size => (
                              <div key={size} className="border border-gray-200 dark:border-gray-600 p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                                  <label className="flex items-center gap-2 mb-2 text-gray-800 dark:text-gray-200">
                                     <input 
                                        type="checkbox" 
                                        checked={editingItem.availableSizes?.includes(size as PizzaSize)}
                                        onChange={e => {
                                            const current = editingItem.availableSizes || [];
                                            if(e.target.checked) setEditingItem({...editingItem, availableSizes: [...current, size as PizzaSize]});
                                            else setEditingItem({...editingItem, availableSizes: current.filter(s => s !== size)});
                                        }}
                                     />
                                     <span className="text-sm font-bold">{size}</span>
                                  </label>
                                  {editingItem.availableSizes?.includes(size as PizzaSize) && (
                                      <input 
                                         type="number"
                                         placeholder="Price"
                                         className={`${inputClass(false)} text-sm py-1`}
                                         value={editingItem.sizePrices?.[size as PizzaSize] || ''}
                                         onChange={e => {
                                            const prices = editingItem.sizePrices || {};
                                            setEditingItem({
                                                ...editingItem,
                                                sizePrices: { ...prices, [size]: parseFloat(e.target.value) }
                                            })
                                         }}
                                      />
                                  )}
                              </div>
                          ))}
                       </div>
                   </div>
               )}

               {editingItem.itemType === 'SINGLE' && editingItem.requiredSelectionIds !== undefined && editingItem.requiredSelectionIds !== null && (
                   <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                       <h5 className="font-bold text-sm text-orange-700 dark:text-orange-400 mb-2">Required Selection Configuration</h5>
                       <label className={labelClass}>Selection Label</label>
                       <input 
                          className={`${inputClass(false)} mb-2`}
                          placeholder="Label (e.g., 'Choose Pasta' or 'Choose Pizza Base')"
                          value={editingItem.requiredSelectionLabel || ''}
                          onChange={e => setEditingItem({...editingItem, requiredSelectionLabel: e.target.value})}
                       />
                       <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto border p-2 rounded">
                          {optionToppings.map(t => (
                              <label key={t.id} className="flex items-center gap-2 text-sm px-2 py-1 bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-800 rounded cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/40 text-gray-700 dark:text-gray-200">
                                  <input 
                                    type="checkbox"
                                    checked={editingItem.requiredSelectionIds?.includes(t.id)}
                                    onChange={e => {
                                        const current = editingItem.requiredSelectionIds || [];
                                        if (e.target.checked) setEditingItem({...editingItem, requiredSelectionIds: [...current, t.id]});
                                        else setEditingItem({...editingItem, requiredSelectionIds: current.filter(id => id !== t.id)});
                                    }}
                                  />
                                  {t.name}
                              </label>
                          ))}
                       </div>
                   </div>
               )}

               {editingItem.allowModifiers !== false && editingItem.itemType !== 'BUNDLE' && (
                   <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4 mt-2">
                       <h5 className="font-bold text-sm text-green-700 dark:text-green-400 mb-2">Included Ingredients</h5>
                       <div className="h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700/30">
                          {sortedIncludedToppings.map(t => (
                              <label key={t.id} className={`flex items-center gap-2 text-sm p-1 rounded cursor-pointer ${editingItem.defaultToppings?.includes(t.id) ? 'bg-green-100 dark:bg-green-900/40 font-medium' : 'hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'}`}>
                                  <input 
                                    type="checkbox"
                                    checked={editingItem.defaultToppings?.includes(t.id)}
                                    onChange={e => {
                                        const current = editingItem.defaultToppings || [];
                                        if (e.target.checked) setEditingItem({...editingItem, defaultToppings: [...current, t.id]});
                                        else setEditingItem({...editingItem, defaultToppings: current.filter(id => id !== t.id)});
                                    }}
                                  />
                                  {t.name}
                              </label>
                          ))}
                       </div>
                   </div>
               )}
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <Button variant="secondary" onClick={() => { setEditingItem(null); setFormErrors({}); }}>Cancel</Button>
                <Button onClick={saveItem}>Save Item</Button>
            </div>
         </Modal>
       )}
       
       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1">Name <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('category')}>
                        <div className="flex items-center gap-1">Category <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('type')}>
                        <div className="flex items-center gap-1">Type <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('pricing')}>
                        <div className="flex items-center gap-1">Pricing <ArrowUpDown size={14}/></div>
                    </th>
                    <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {sortedAndPaginatedMenu.map(item => (
                    <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{categories.find(c => c.id === item.categoryId)?.name}</td>
                        <td className="px-4 py-3 text-xs">
                            {item.itemType === 'BUNDLE' ? (
                                <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Bundle</span>
                            ) : (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Single</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">
                            {item.pricingType === 'FIXED' ? 'Fixed Price' : 'Size Based'}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <button 
                                onClick={() => {
                                    const itemToEdit = { ...item };
                                    if (Array.isArray(itemToEdit.requiredSelectionIds) && itemToEdit.requiredSelectionIds.length === 0) {
                                        itemToEdit.requiredSelectionIds = undefined;
                                    }
                                    setEditingItem(itemToEdit);
                                }} 
                                className="text-blue-600 dark:text-blue-400 mr-2"
                            >
                                <Edit2 size={16}/>
                            </button>
                            <button onClick={() => deleteItem(item.id)} className="text-red-600 dark:text-red-400"><Trash2 size={16}/></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>Show</span>
                  <select 
                    value={itemsPerPage} 
                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                    className="border rounded p-1 text-xs"
                  >
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                  </select>
                  <span>entries</span>
              </div>
              <div className="flex items-center gap-2">
                  <button 
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => p - 1)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                      <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                      Page {currentPage} of {Math.max(1, totalPages)}
                  </span>
                  <button 
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => p + 1)}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                  >
                      <ChevronRight size={20} />
                  </button>
              </div>
          </div>
       </div>
    </div>
  );

  const renderCategoriesTab = () => (
     <div className="space-y-6">
        <div className="flex justify-between items-center">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white">Categories</h3>
             <Button onClick={() => setEditingCategory({ sortOrder: categories.length })} className="flex gap-2"><Plus size={16}/> New Category</Button>
        </div>

        {editingCategory && (
            <Modal title={editingCategory.id ? 'Edit Category' : 'New Category'} onClose={() => setEditingCategory(null)}>
                <div className="grid grid-cols-1 gap-6 mb-4">
                   <div>
                      <label className={labelClass}>Category Name</label>
                      <input className={inputClass(false)} value={editingCategory.name || ''} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} />
                   </div>
                   
                   {/* UPDATED: Added Ticket Priority Input */}
                   <div>
                      <label className={labelClass}>Kitchen Ticket Priority</label>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Lower numbers appear at the top of the receipt (e.g. 1 for Starters, 10 for Drinks).
                      </p>
                      <input 
                          type="number" 
                          className={inputClass(false)} 
                          value={editingCategory.ticketPriority || ''} 
                          placeholder="e.g. 1"
                          onChange={e => setEditingCategory({...editingCategory, ticketPriority: parseInt(e.target.value) || 0})} 
                      />
                   </div>
                </div>
                <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="secondary" onClick={() => setEditingCategory(null)}>Cancel</Button>
                    <Button onClick={saveCategory}>Save Category</Button>
                </div>
            </Modal>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                     <tr>
                         <th className="px-4 py-3 w-16 text-gray-700 dark:text-gray-300">Sort</th>
                         <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Category Name</th>
                         <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Ticket Priority</th>
                         <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {categories.map((cat, idx) => (
                         <tr 
                            key={cat.id} 
                            draggable
                            onDragStart={() => onDragStart(idx)}
                            onDragOver={(e) => onDragOver(e, idx)}
                            onDrop={() => onDrop(idx)}
                            className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${draggedCategoryIndex === idx ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' : ''} cursor-move`}
                         >
                             <td className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                                 <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                             </td>
                             <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{cat.name}</td>
                             <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cat.ticketPriority ?? '-'}</td>
                             <td className="px-4 py-3 text-right">
                                 <button onClick={() => setEditingCategory(cat)} className="text-blue-600 dark:text-blue-400 mr-2"><Edit2 size={16}/></button>
                                 <button onClick={() => deleteCategory(cat.id)} className="text-red-600 dark:text-red-400"><Trash2 size={16}/></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
     </div>
  );

  // ... (renderToppingsTab remains unchanged) ...
  const renderToppingsTab = () => (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white">Extras / Options</h3>
            <Button onClick={() => setEditingTopping({ type: 'TOPPING', available: true })} className="flex gap-2"><Plus size={16}/> New Extra</Button>
        </div>

        {editingTopping && (
            <Modal title={editingTopping.id ? 'Edit Extra' : 'New Extra'} onClose={() => setEditingTopping(null)}>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                     <div>
                        <label className={labelClass}>Name</label>
                        <input className={inputClass(false)} value={editingTopping.name || ''} onChange={e => setEditingTopping({...editingTopping, name: e.target.value})} />
                     </div>
                     <div>
                        <label className={labelClass}>Type</label>
                        <select className={inputClass(false)} value={editingTopping.type} onChange={e => setEditingTopping({...editingTopping, type: e.target.value as any})}>
                            <option value="TOPPING">Topping</option>
                            <option value="BASE_OPTION">Base Option</option>
                            <option value="SAUCE_OPTION">Sauce Option</option>
                            <option value="OPTION">Generic Option</option>
                            <option value="SIDE">Side Choice</option>
                        </select>
                     </div>
                     <div>
                        <label className={labelClass}>Extra Price ($)</label>
                        <input type="number" className={inputClass(false)} value={editingTopping.price || ''} onChange={e => setEditingTopping({...editingTopping, price: Number(e.target.value)})} />
                     </div>
                     
                     <div className="md:col-span-3 mt-4 border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                         <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                             <Settings size={16} /> Size Availability Restrictions
                         </h4>
                         <p className="text-xs text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">
                             By default, this extra is available for <strong>ALL</strong> sizes. 
                             <br/>Select specific sizes below ONLY if you want to RESTRICT availability (e.g., Gluten Free Base only on Medium).
                         </p>
                         
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Small', 'Medium', 'Large', 'Family'].map(size => {
                                const isChecked = editingTopping.availableSizes?.includes(size as PizzaSize);
                                return (
                                    <label 
                                        key={size} 
                                        className={`
                                            flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all
                                            ${isChecked 
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                                                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'
                                            }
                                        `}
                                    >
                                        <input 
                                            type="checkbox" 
                                            checked={isChecked}
                                            onChange={e => {
                                                const current = editingTopping.availableSizes || [];
                                                if(e.target.checked) setEditingTopping({...editingTopping, availableSizes: [...current, size as PizzaSize]});
                                                else setEditingTopping({...editingTopping, availableSizes: current.filter(s => s !== size)});
                                            }}
                                            className="w-4 h-4 accent-white"
                                        />
                                        <span className="font-medium text-sm">{size}</span>
                                    </label>
                                );
                            })}
                         </div>
                         <div className="mt-2 text-right">
                             <button 
                                onClick={() => setEditingTopping({...editingTopping, availableSizes: []})}
                                className="text-xs text-blue-600 hover:underline"
                             >
                                Clear All (Available on All Sizes)
                             </button>
                         </div>
                     </div>
                 </div>
                 <div className="flex justify-end gap-2 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Button variant="secondary" onClick={() => setEditingTopping(null)}>Cancel</Button>
                    <Button onClick={saveTopping}>Save Extra</Button>
                </div>
            </Modal>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
             <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                     <tr>
                         <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleExtraSort('name')}>
                             <div className="flex items-center gap-1">Name <ArrowUpDown size={14}/></div>
                         </th>
                         <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleExtraSort('type')}>
                             <div className="flex items-center gap-1">Type <ArrowUpDown size={14}/></div>
                         </th>
                         <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleExtraSort('price')}>
                             <div className="flex items-center gap-1">Price <ArrowUpDown size={14}/></div>
                         </th>
                         <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Actions</th>
                     </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                     {sortedExtras.map(t => (
                         <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                             <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                             <td className="px-4 py-3"><span className="text-xs font-bold px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-gray-600 dark:text-gray-300">{t.type}</span></td>
                             <td className="px-4 py-3 text-gray-600 dark:text-gray-400">+${t.price.toFixed(2)}</td>
                             <td className="px-4 py-3 text-right">
                                 <button onClick={() => setEditingTopping(t)} className="text-blue-600 dark:text-blue-400 mr-2"><Edit2 size={16}/></button>
                                 <button onClick={() => deleteTopping(t.id)} className="text-red-600 dark:text-red-400"><Trash2 size={16}/></button>
                             </td>
                         </tr>
                     ))}
                 </tbody>
             </table>
        </div>
      </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border border-gray-200 dark:border-gray-700 inline-flex transition-colors">
          <button onClick={() => setActiveTab('items')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'items' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="flex items-center gap-2"><Utensils size={16}/> Items</div>
          </button>
          <button onClick={() => setActiveTab('categories')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'categories' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="flex items-center gap-2"><List size={16}/> Categories</div>
          </button>
          <button onClick={() => setActiveTab('toppings')} className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'toppings' ? 'bg-blue-600 text-white shadow' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>
              <div className="flex items-center gap-2"><Settings size={16}/> Extras</div>
          </button>
      </div>

      {activeTab === 'items' && renderItemsTab()}
      {activeTab === 'categories' && renderCategoriesTab()}
      {activeTab === 'toppings' && renderToppingsTab()}
    </div>
  );
};