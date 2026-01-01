import React, { useState } from 'react';
// REPLACE useApp with useData
import { useData } from '../../context/DataContext';
import { Button } from '../ui/Button';
import { Trash2, Plus, Tag, X, Edit2 } from 'lucide-react';
import { DiscountRule, ComboItemRequirement } from '../../types';

export const DealsManagement: React.FC = () => {
  // Update Hook
  const { config, updateConfig, categories, menu } = useData();
  const [showForm, setShowForm] = useState(false);
  
  // ... (Rest of the file remains exactly the same)
  // Just ensure the imports and the first line of the component are updated.
  // The rest of the logic below this line is safe to keep as-is.

  const defaultDealState: Partial<DiscountRule> = {
    type: 'PERCENTAGE',
    value: 10,
    buyQuantity: 2,
    getQuantity: 1,
    comboRequirements: []
  };

  const [formDeal, setFormDeal] = useState<Partial<DiscountRule>>(defaultDealState);

  const startEditing = (deal: DiscountRule) => {
      setFormDeal({
          ...deal,
          comboRequirements: deal.comboRequirements ? [...deal.comboRequirements] : []
      });
      setShowForm(true);
  };

  const startAdding = () => {
      setFormDeal(defaultDealState);
      setShowForm(true);
  };

  const handleSave = async () => {
    if (!formDeal.name || !formDeal.value) return;

    const dealId = formDeal.id || crypto.randomUUID();

    const deal: DiscountRule = {
        id: dealId,
        name: formDeal.name,
        type: formDeal.type as 'BOGO' | 'PERCENTAGE' | 'COMBO',
        value: Number(formDeal.value),
        targetCategoryId: formDeal.targetCategoryId,
        buyQuantity: formDeal.type === 'BOGO' ? Number(formDeal.buyQuantity) : undefined,
        getQuantity: formDeal.type === 'BOGO' ? Number(formDeal.getQuantity) : undefined,
        comboRequirements: formDeal.type === 'COMBO' ? formDeal.comboRequirements : undefined
    };

    let updatedDiscounts;
    if (formDeal.id) {
        updatedDiscounts = config.activeDiscounts.map(d => d.id === dealId ? deal : d);
    } else {
        updatedDiscounts = [...config.activeDiscounts, deal];
    }

    await updateConfig({ ...config, activeDiscounts: updatedDiscounts });
    setShowForm(false);
    setFormDeal(defaultDealState);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this deal?")) return;
    const updatedDiscounts = config.activeDiscounts.filter(d => d.id !== id);
    await updateConfig({ ...config, activeDiscounts: updatedDiscounts });
  };

  const addRequirement = () => {
     const current = formDeal.comboRequirements || [];
     setFormDeal({
         ...formDeal,
         comboRequirements: [...current, { categoryId: categories[0]?.id || '', quantity: 1, requiredItemId: '' }]
     });
  };

  const removeRequirement = (idx: number) => {
      const current = formDeal.comboRequirements || [];
      setFormDeal({
          ...formDeal,
          comboRequirements: current.filter((_, i) => i !== idx)
      });
  };

  const updateRequirement = (idx: number, field: keyof ComboItemRequirement, val: any) => {
      const current = [...(formDeal.comboRequirements || [])];
      
      if (field === 'categoryId') {
          current[idx] = { ...current[idx], [field]: val, requiredItemId: '', requiredSize: undefined };
      } 
      else if (field === 'requiredItemId') {
          current[idx] = { ...current[idx], [field]: val, requiredSize: undefined };
      }
      else {
          current[idx] = { ...current[idx], [field]: val };
      }
      
      setFormDeal({ ...formDeal, comboRequirements: current });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Active Deals</h2>
        {!showForm && (
            <Button onClick={startAdding} className="flex items-center gap-2">
            <Plus size={16} /> New Deal
            </Button>
        )}
      </div>

      {showForm && (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 mb-6 animate-fade-in">
          <h3 className="font-bold mb-4 text-lg border-b pb-2">
              {formDeal.id ? 'Edit Deal' : 'Create New Deal'}
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-600 mb-1">Deal Name</label>
              <input 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                placeholder="e.g. Summer Bundle"
                value={formDeal.name || ''} 
                onChange={e => setFormDeal({...formDeal, name: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Deal Type</label>
              <select 
                className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                value={formDeal.type}
                onChange={e => setFormDeal({...formDeal, type: e.target.value as any})}
              >
                <option value="PERCENTAGE">Percentage Off</option>
                <option value="BOGO">Buy X Get Y (BOGO)</option>
                <option value="COMBO">Fixed Price Combo</option>
              </select>
            </div>

            {formDeal.type === 'COMBO' ? (
                <div className="md:col-span-2 space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <label className="block text-sm font-bold text-gray-700 mb-2">Bundle Requirements</label>
                        {formDeal.comboRequirements?.map((req, idx) => {
                            const categoryItems = menu.filter(m => m.categoryId === req.categoryId);
                            
                            let showSizeSelector = false;
                            if (req.requiredItemId) {
                                const selectedItem = categoryItems.find(i => i.id === req.requiredItemId);
                                if (selectedItem && selectedItem.pricingType === 'SIZE_BASED') {
                                    showSizeSelector = true;
                                }
                            } else {
                                if (categoryItems.some(i => i.pricingType === 'SIZE_BASED')) {
                                    showSizeSelector = true;
                                }
                            }

                            return (
                                <div key={idx} className="flex flex-col sm:flex-row gap-2 mb-3 items-start sm:items-center bg-white p-2 rounded border">
                                    <input 
                                        type="number"
                                        className="w-16 border p-2 rounded"
                                        value={req.quantity}
                                        onChange={e => updateRequirement(idx, 'quantity', Number(e.target.value))}
                                        placeholder="Qty"
                                    />
                                    <select 
                                        className="flex-1 border p-2 rounded w-full sm:w-auto"
                                        value={req.categoryId}
                                        onChange={e => updateRequirement(idx, 'categoryId', e.target.value)}
                                    >
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>

                                    <select 
                                        className="flex-1 border p-2 rounded w-full sm:w-auto"
                                        value={req.requiredItemId || ''}
                                        onChange={e => updateRequirement(idx, 'requiredItemId', e.target.value)}
                                    >
                                        <option value="">Any {categories.find(c => c.id === req.categoryId)?.name || 'Item'}</option>
                                        {categoryItems.map(item => (
                                            <option key={item.id} value={item.id}>{item.name}</option>
                                        ))}
                                    </select>

                                    {showSizeSelector && (
                                        <select 
                                            className="flex-1 border p-2 rounded w-full sm:w-auto"
                                            value={req.requiredSize || ''}
                                            onChange={e => updateRequirement(idx, 'requiredSize', e.target.value || undefined)}
                                        >
                                            <option value="">Any Size</option>
                                            <option value="Small">Small</option>
                                            <option value="Medium">Medium</option>
                                            <option value="Large">Large</option>
                                            <option value="Family">Family</option>
                                        </select>
                                    )}

                                    <button onClick={() => removeRequirement(idx)} className="text-red-500 p-2 hover:bg-red-50 rounded"><X size={16}/></button>
                                </div>
                            );
                        })}
                        <Button variant="secondary" size="sm" onClick={addRequirement} className="mt-2"><Plus size={14}/> Add Requirement</Button>
                    </div>

                    <div>
                      <label className="block text-sm text-gray-600 mb-1">Total Bundle Price ($)</label>
                      <input 
                        type="number"
                        className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                        value={formDeal.value} 
                        onChange={e => setFormDeal({...formDeal, value: Number(e.target.value)})}
                      />
                    </div>
                </div>
            ) : (
                <>
                    <div>
                       <label className="block text-sm text-gray-600 mb-1">Target Category</label>
                       <select 
                          className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                          value={formDeal.targetCategoryId || ''}
                          onChange={e => setFormDeal({...formDeal, targetCategoryId: e.target.value})}
                       >
                         <option value="">All Categories</option>
                         {categories.map(c => (
                           <option key={c.id} value={c.id}>{c.name}</option>
                         ))}
                       </select>
                    </div>

                    {formDeal.type === 'PERCENTAGE' ? (
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">Percentage Off (%)</label>
                          <input 
                            type="number"
                            className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                            value={formDeal.value} 
                            onChange={e => setFormDeal({...formDeal, value: Number(e.target.value)})}
                          />
                        </div>
                    ) : (
                        <>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Buy Quantity</label>
                            <input 
                              type="number"
                              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                              value={formDeal.buyQuantity} 
                              onChange={e => setFormDeal({...formDeal, buyQuantity: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Get Quantity</label>
                            <input 
                              type="number"
                              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                              value={formDeal.getQuantity} 
                              onChange={e => setFormDeal({...formDeal, getQuantity: Number(e.target.value)})}
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-gray-600 mb-1">Discount on Free Item (%)</label>
                            <input 
                              type="number"
                              className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" 
                              value={formDeal.value} 
                              placeholder="100 for Free"
                              onChange={e => setFormDeal({...formDeal, value: Number(e.target.value)})}
                            />
                          </div>
                        </>
                    )}
                </>
            )}
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSave}>Save Deal</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {config.activeDiscounts.map(deal => {
            const categoryName = categories.find(c => c.id === deal.targetCategoryId)?.name || 'Any';
            
            return (
                <div key={deal.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between group">
                    <div>
                        <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded text-blue-700 bg-blue-100`}>
                                {deal.type}
                            </span>
                            <div className="flex gap-2">
                                <button onClick={() => startEditing(deal)} className="text-gray-400 hover:text-blue-500 transition-colors">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDelete(deal.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h4 className="font-bold text-gray-800 text-lg mb-1">{deal.name}</h4>
                        <div className="text-sm text-gray-500 space-y-1">
                            {deal.type === 'COMBO' ? (
                                <div>
                                    <p className="font-medium text-green-600">Fixed Price: ${deal.value.toFixed(2)}</p>
                                    <div className="mt-2 text-xs bg-gray-50 p-2 rounded border">
                                        {deal.comboRequirements?.map((r, i) => {
                                            const cat = categories.find(c => c.id === r.categoryId)?.name;
                                            const item = menu.find(m => m.id === r.requiredItemId)?.name;
                                            return (
                                                <div key={i}>
                                                    • {r.quantity}x {item || `Any ${cat}`} {r.requiredSize ? `(${r.requiredSize})` : ''}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ) : deal.type === 'BOGO' ? (
                                <p>Buy {deal.buyQuantity}, Get {deal.getQuantity} at {deal.value}% off</p>
                            ) : (
                                <p>{deal.value}% Discount</p>
                            )}
                            
                            {deal.type !== 'COMBO' && (
                                <p className="flex items-center gap-1"><Tag size={12}/> Applies to: {categoryName}</p>
                            )}
                        </div>
                    </div>
                </div>
            );
        })}
        {config.activeDiscounts.length === 0 && (
            <div className="col-span-full p-10 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
                No active deals. Create one to get started.
            </div>
        )}
      </div>
    </div>
  );
};