import React, { useState, useMemo } from 'react';
import { MenuItem, Category, Topping, PizzaSize } from '../../../../types';
import { Button } from '../../../ui/Button';
import { X, Copy, Upload, Plus, Trash2 } from 'lucide-react';

interface ItemFormModalProps {
    item: Partial<MenuItem> | null;
    categories: Category[];
    menu: MenuItem[]; 
    toppings: Topping[];
    onClose: () => void;
    onSave: (item: Partial<MenuItem>) => void;
}

export const ItemFormModal: React.FC<ItemFormModalProps> = ({ item, categories, menu, toppings, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<MenuItem>>(item || {
        pricingType: 'FIXED',
        itemType: 'SINGLE',
        availableSizes: ['Small', 'Medium', 'Large', 'Family'],
        allowModifiers: false,
        defaultToppings: []
    });
    
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    // --- Helpers ---
    const handleSave = () => {
        if (!formData.name || !formData.categoryId) {
            setErrors({ name: !formData.name, categoryId: !formData.categoryId });
            return;
        }
        onSave(formData);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setFormData(prev => ({ ...prev, image: reader.result as string }));
            reader.readAsDataURL(file);
        }
    };

    const applyPricingTemplate = (templateItemId: string) => {
        const template = menu.find(m => m.id === templateItemId);
        if (template) {
            setFormData(prev => ({
                ...prev,
                pricingType: template.pricingType,
                price: template.price,
                sizePrices: template.sizePrices,
                availableSizes: template.availableSizes
            }));
        }
    };

    // --- Bundle Helpers ---
    const addSubItemConfig = () => {
        setFormData(prev => ({
            ...prev,
            subItemConfigs: [...(prev.subItemConfigs || []), { id: crypto.randomUUID(), name: 'Selection', allowCategories: [], allowedItemIds: [] }]
        }));
    };

    const updateSubItemConfig = (idx: number, field: string, value: any) => {
        const newConfigs = [...(formData.subItemConfigs || [])];
        newConfigs[idx] = { ...newConfigs[idx], [field]: value };
        setFormData(prev => ({ ...prev, subItemConfigs: newConfigs }));
    };

    const removeSubItemConfig = (idx: number) => {
        const newConfigs = [...(formData.subItemConfigs || [])];
        newConfigs.splice(idx, 1);
        setFormData(prev => ({ ...prev, subItemConfigs: newConfigs }));
    };

    // --- Derived Data ---
    const optionToppings = useMemo(() => toppings.filter(t => t.type === 'SAUCE_OPTION' || t.type === 'OPTION'), [toppings]);
    
    const sortedIncludedToppings = useMemo(() => {
        return toppings
            .filter(t => t.type !== 'BASE_OPTION' && t.type !== 'SAUCE_OPTION' && t.type !== 'SIDE') 
            .sort((a, b) => {
                const aSelected = formData.defaultToppings?.includes(a.id);
                const bSelected = formData.defaultToppings?.includes(b.id);
                if (aSelected && !bSelected) return -1;
                if (!aSelected && bSelected) return 1;
                return a.name.localeCompare(b.name);
            });
    }, [toppings, formData.defaultToppings]);

    const inputClass = (err: boolean) => `w-full border p-2 rounded bg-white text-gray-900 ${err ? 'border-red-500' : 'border-gray-300'} dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none`;
    const labelClass = "block text-sm text-gray-600 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] overflow-y-auto flex flex-col" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{formData.id ? 'Edit Item' : 'New Item'}</h4>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20}/></button>
                </div>

                {/* Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Basic Info */}
                    <div>
                        <label className={labelClass}>Name *</label>
                        <input className={inputClass(!!errors.name)} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                    </div>
                    <div>
                         <label className={labelClass}>Category *</label>
                         <div className="flex gap-2">
                             <select className={inputClass(!!errors.categoryId)} value={formData.categoryId || ''} onChange={e => setFormData({...formData, categoryId: e.target.value})}>
                                <option value="">Select Category</option>
                                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                             </select>
                             {/* Restore Copy Pricing Feature */}
                             {formData.categoryId && (
                                <div className="relative group">
                                    <select 
                                        onChange={(e) => applyPricingTemplate(e.target.value)}
                                        className="w-10 h-full opacity-0 absolute inset-0 cursor-pointer"
                                        value=""
                                    >
                                        <option value="" disabled>Copy...</option>
                                        {menu.filter(m => m.categoryId === formData.categoryId && m.id !== formData.id).map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <div className="w-10 h-full flex items-center justify-center border border-gray-300 dark:border-gray-600 rounded bg-gray-50 dark:bg-gray-700 pointer-events-none">
                                        <Copy size={16} className="text-gray-500"/>
                                    </div>
                                </div>
                             )}
                         </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className={labelClass}>Image</label>
                        <div className="flex items-center gap-4">
                            {formData.image && <img src={formData.image} className="w-16 h-16 rounded object-cover border"/>}
                            <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded flex items-center gap-2 text-sm">
                                <Upload size={16}/> Upload
                                <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                            </label>
                        </div>
                    </div>

                    {/* Item Type & Configuration */}
                    <div className="md:col-span-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                        <h5 className="font-bold text-sm text-gray-800 dark:text-white mb-3">Item Type</h5>
                        <div className="flex gap-2 mb-4">
                            <button 
                                onClick={() => setFormData({...formData, itemType: 'SINGLE', pricingType: 'SIZE_BASED'})}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${formData.itemType === 'SINGLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                            >Standard Item</button>
                            <button 
                                onClick={() => setFormData({...formData, itemType: 'BUNDLE', pricingType: 'FIXED', subItemConfigs: formData.subItemConfigs?.length ? formData.subItemConfigs : [{ id: crypto.randomUUID(), name: 'Step 1', allowCategories: [], allowedItemIds: [] }]})}
                                className={`px-4 py-2 rounded-lg text-sm font-medium border ${formData.itemType === 'BUNDLE' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-200'}`}
                            >Bundle</button>
                        </div>

                        {/* Bundle Configuration */}
                        {formData.itemType === 'BUNDLE' && (
                           <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700 mb-4">
                               <div className="flex justify-between items-center mb-2">
                                   <label className={labelClass}>Bundle Steps</label>
                                   <Button size="sm" variant="secondary" onClick={addSubItemConfig}><Plus size={14}/> Add Step</Button>
                               </div>
                               <div className="space-y-3">
                                   {formData.subItemConfigs?.map((config, idx) => (
                                       <div key={config.id} className="border p-3 rounded bg-white dark:bg-gray-800">
                                           <div className="flex justify-between items-center mb-2">
                                               <input 
                                                  className="font-bold text-sm border-b border-gray-300 focus:border-blue-500 outline-none w-1/2 dark:bg-transparent dark:text-white"
                                                  value={config.name}
                                                  onChange={e => updateSubItemConfig(idx, 'name', e.target.value)}
                                               />
                                               <button onClick={() => removeSubItemConfig(idx)} className="text-red-500"><Trash2 size={14}/></button>
                                           </div>
                                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                               {/* Col 1: Categories */}
                                               <div>
                                                   <label className="text-xs text-gray-500 block mb-1">1. Filter by Category</label>
                                                   <div className="max-h-32 overflow-y-auto border rounded p-1">
                                                       {categories.map(cat => (
                                                           <label key={cat.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                               <input 
                                                                  type="checkbox"
                                                                  checked={config.allowCategories.includes(cat.id)}
                                                                  onChange={e => {
                                                                      const current = config.allowCategories;
                                                                      // Reset allowed Items when categories change to avoid orphans
                                                                      updateSubItemConfig(idx, 'allowedItemIds', []); 
                                                                      
                                                                      if(e.target.checked) updateSubItemConfig(idx, 'allowCategories', [...current, cat.id]);
                                                                      else updateSubItemConfig(idx, 'allowCategories', current.filter(c => c !== cat.id));
                                                                  }}
                                                               />
                                                               <span className="dark:text-gray-300">{cat.name}</span>
                                                           </label>
                                                       ))}
                                                   </div>
                                               </div>

                                               {/* Col 2: Specific Items (New) */}
                                               <div>
                                                   <label className="text-xs text-gray-500 block mb-1">2. Restrict Items (Optional)</label>
                                                   <div className="max-h-32 overflow-y-auto border rounded p-1 bg-white dark:bg-gray-800">
                                                       {menu
                                                           .filter(m => config.allowCategories.includes(m.categoryId)) 
                                                           .map(m => (
                                                           <label key={m.id} className="flex items-center gap-2 text-xs p-1 hover:bg-gray-50 dark:hover:bg-gray-700">
                                                               <input 
                                                                   type="checkbox"
                                                                   checked={config.allowedItemIds?.includes(m.id)}
                                                                   onChange={e => {
                                                                       const current = config.allowedItemIds || [];
                                                                       if(e.target.checked) updateSubItemConfig(idx, 'allowedItemIds', [...current, m.id]);
                                                                       else updateSubItemConfig(idx, 'allowedItemIds', current.filter(id => id !== m.id));
                                                                   }}
                                                               />
                                                               <span className="truncate dark:text-gray-300">{m.name}</span>
                                                           </label>
                                                       ))}
                                                       {config.allowCategories.length === 0 && <span className="text-xs text-gray-400 p-1">Select category first</span>}
                                                   </div>
                                                   <p className="text-[10px] text-gray-400 mt-1">Leave all unchecked to allow entire category</p>
                                               </div>

                                               {/* Col 3: Force Size */}
                                               <div>
                                                   <label className="text-xs text-gray-500 block mb-1">3. Force Size (Optional)</label>
                                                   <select 
                                                      className="w-full border p-1 rounded text-sm dark:bg-gray-700 dark:border-gray-600"
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
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                        )}

                        {/* Pricing Strategy */}
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                            <h5 className="font-bold text-sm text-gray-800 dark:text-white mb-2">Pricing Strategy</h5>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                    <input type="radio" checked={formData.pricingType === 'FIXED'} onChange={() => setFormData({...formData, pricingType: 'FIXED'})} />
                                    <span className="text-sm">Fixed Price</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                    <input type="radio" checked={formData.pricingType === 'SIZE_BASED'} onChange={() => setFormData({...formData, pricingType: 'SIZE_BASED'})} />
                                    <span className="text-sm">Size Based</span>
                                </label>
                            </div>
                        </div>

                        {/* Dynamic Pricing Inputs */}
                        <div className="mt-4">
                            {formData.pricingType === 'FIXED' ? (
                                <div>
                                     <label className={labelClass}>Price ($)</label>
                                     <input type="number" className={inputClass(false)} value={formData.price || ''} onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})} />
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {['Small', 'Medium', 'Large', 'Family'].map(size => (
                                        <div key={size} className="border p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                                            <label className="flex items-center gap-2 mb-2">
                                                <input type="checkbox" checked={formData.availableSizes?.includes(size as PizzaSize)} 
                                                    onChange={e => {
                                                        const current = formData.availableSizes || [];
                                                        if(e.target.checked) setFormData({...formData, availableSizes: [...current, size as PizzaSize]});
                                                        else setFormData({...formData, availableSizes: current.filter(s => s !== size)});
                                                    }} 
                                                />
                                                <span className="text-sm font-bold dark:text-gray-200">{size}</span>
                                            </label>
                                            {formData.availableSizes?.includes(size as PizzaSize) && (
                                                <input type="number" placeholder="Price" className="w-full border p-1 rounded text-sm" 
                                                    value={formData.sizePrices?.[size as PizzaSize] || ''}
                                                    onChange={e => {
                                                        const prices = formData.sizePrices || {};
                                                        setFormData({ ...formData, sizePrices: { ...prices, [size]: parseFloat(e.target.value) } });
                                                    }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Pizza Specific Logic (Modifiers, Default Toppings, Required Options) */}
                        {formData.itemType !== 'BUNDLE' && (
                            <div className="mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                        <input type="checkbox" checked={formData.allowModifiers ?? false} onChange={(e) => setFormData({...formData, allowModifiers: e.target.checked})} />
                                        <span className="text-sm font-medium">Allow Modifiers</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer dark:text-gray-300">
                                        <input 
                                            type="checkbox" 
                                            checked={formData.requiredSelectionIds !== undefined} 
                                            onChange={(e) => setFormData({...formData, requiredSelectionIds: e.target.checked ? [] : undefined})} 
                                        />
                                        <span className="text-sm font-medium">Require Option (e.g. Choose Sauce)</span>
                                    </label>
                                </div>

                                {formData.requiredSelectionIds !== undefined && (
                                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded border border-orange-100 dark:border-orange-800">
                                        <label className={labelClass}>Selection Label</label>
                                        <input 
                                            className={`${inputClass(false)} mb-2`}
                                            placeholder="Label (e.g., 'Choose Pasta')"
                                            value={formData.requiredSelectionLabel || ''}
                                            onChange={e => setFormData({...formData, requiredSelectionLabel: e.target.value})}
                                        />
                                        <div className="flex flex-wrap gap-2">
                                            {optionToppings.map(t => (
                                                <label key={t.id} className="flex items-center gap-2 text-sm px-2 py-1 bg-white dark:bg-gray-700 border rounded cursor-pointer">
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.requiredSelectionIds?.includes(t.id)}
                                                        onChange={e => {
                                                            const current = formData.requiredSelectionIds || [];
                                                            if (e.target.checked) setFormData({...formData, requiredSelectionIds: [...current, t.id]});
                                                            else setFormData({...formData, requiredSelectionIds: current.filter(id => id !== t.id)});
                                                        }}
                                                    />
                                                    <span className="dark:text-gray-200">{t.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {formData.allowModifiers !== false && (
                                    <div>
                                        <label className={labelClass}>Included Ingredients (Default Toppings)</label>
                                        <div className="h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 grid grid-cols-2 md:grid-cols-3 gap-2 bg-gray-50 dark:bg-gray-700/30">
                                            {sortedIncludedToppings.map(t => (
                                                <label key={t.id} className={`flex items-center gap-2 text-sm p-1 rounded cursor-pointer ${formData.defaultToppings?.includes(t.id) ? 'bg-green-100 dark:bg-green-900/40' : 'hover:bg-gray-200 dark:hover:bg-gray-600'}`}>
                                                    <input 
                                                        type="checkbox"
                                                        checked={formData.defaultToppings?.includes(t.id)}
                                                        onChange={e => {
                                                            const current = formData.defaultToppings || [];
                                                            if (e.target.checked) setFormData({...formData, defaultToppings: [...current, t.id]});
                                                            else setFormData({...formData, defaultToppings: current.filter(id => id !== t.id)});
                                                        }}
                                                    />
                                                    <span className="dark:text-gray-200">{t.name}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700 mt-auto bg-gray-50 dark:bg-gray-800 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Item</Button>
                </div>
            </div>
        </div>
    );
};