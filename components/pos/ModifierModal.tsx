import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { MenuItem, Topping, PizzaSize, SubItemSelection, SubItemConfig } from '../../types';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/Button';
import { X, Minus, Plus, Check, ArrowRight, ArrowLeft, Image as ImageIcon } from 'lucide-react';

interface ModifierModalProps {
  item: MenuItem;
  onClose: () => void;
  onConfirm: (quantity: number, size: PizzaSize | undefined, addedToppings: Topping[], removedIds: string[], selectedOption: Topping | undefined, notes: string, subItems?: SubItemSelection[]) => void;
}

export const ModifierModal: React.FC<ModifierModalProps> = ({ item, onClose, onConfirm }) => {
  const { toppings, categories, menu, showImages } = useData();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<PizzaSize | null>(null);
  
  const [notes, setNotes] = useState('');
  const [imgError, setImgError] = useState(false);
  
  // Modifiers State
  const [removedDefaultToppings, setRemovedDefaultToppings] = useState<string[]>([]);
  const [addedExtras, setAddedExtras] = useState<Topping[]>([]);
  const [selectedOption, setSelectedOption] = useState<Topping | undefined>(undefined);
  
  // Manual Charge State
  const [extraChargeQty, setExtraChargeQty] = useState(0);
  const MANUAL_CHARGE_PRICE = 1.00;

  // Bundle State
  const [subSelections, setSubSelections] = useState<SubItemSelection[]>([]);
  
  // Logic Flags
  const isFixedPrice = item.pricingType === 'FIXED';
  const isComplexItem = item.itemType === 'HALF_AND_HALF' || item.itemType === 'BUNDLE';
  const hasRequiredOptions = item.requiredSelectionIds && item.requiredSelectionIds.length > 0;
  const subConfigs = item.subItemConfigs || [];

  // --- Helpers ---

  // UPDATED: Now respects the 'allowedItemIds' checkbox array
  const getAllowedItemsForConfig = useCallback((config: SubItemConfig) => {
      // 1. Filter by Category first
      let items = menu.filter(m => 
          config.allowCategories.includes(m.categoryId) && 
          m.itemType === 'SINGLE'
      );

      // 2. Filter by Specific Allowed Items (If user checked specific boxes)
      if (config.allowedItemIds && config.allowedItemIds.length > 0) {
          items = items.filter(m => config.allowedItemIds!.includes(m.id));
      }

      // 3. Fallback for legacy "Force Item" (Keep purely for backward compatibility)
      if (items.length > 1 && config.forceItemId) {
          const forced = items.find(m => m.id === config.forceItemId);
          if (forced) return [forced];
      }

      return items;
  }, [menu]);

  const isStepInteractive = useCallback((stepIndex: number) => {
      const hasSizeStep = !isFixedPrice;
      const totalSteps = (hasSizeStep ? 1 : 0) + subConfigs.length;

      if (stepIndex === totalSteps) return true; 
      if (hasSizeStep && stepIndex === 0) return true;

      const configIndex = hasSizeStep ? stepIndex - 1 : stepIndex;
      if (configIndex >= 0 && configIndex < subConfigs.length) {
          const config = subConfigs[configIndex];
          const allowed = getAllowedItemsForConfig(config);
          return allowed.length > 1;
      }
      return false;
  }, [isFixedPrice, subConfigs, getAllowedItemsForConfig]);

  // --- Initialization ---
  useEffect(() => {
    if (!isFixedPrice && item.availableSizes && item.availableSizes.length > 0) {
        setSelectedSize(item.availableSizes[0]);
    }
  }, [item, isFixedPrice]);

  useEffect(() => {
    if (hasRequiredOptions && item.requiredSelectionIds) {
        const defaultOption = toppings.find(t => item.defaultToppings.includes(t.id) && item.requiredSelectionIds?.includes(t.id));
        if (defaultOption) {
            setSelectedOption(defaultOption);
        } else if (item.requiredSelectionIds.length > 0) {
            const first = toppings.find(t => t.id === item.requiredSelectionIds![0]);
            setSelectedOption(first);
        }
    }
  }, [item, hasRequiredOptions, toppings]);

  useEffect(() => {
      if (isComplexItem) {
          const autoSelections: SubItemSelection[] = [];
          subConfigs.forEach(config => {
              const allowed = getAllowedItemsForConfig(config);
              if (allowed.length === 1) {
                  autoSelections.push({
                      configId: config.id,
                      item: allowed[0],
                      selectedSize: config.forceSize
                  });
              }
          });

          setSubSelections(prev => {
              const newSels = [...prev];
              autoSelections.forEach(auto => {
                  if (!newSels.find(s => s.configId === auto.configId)) {
                      newSels.push(auto);
                  }
              });
              return newSels;
          });
      }
  }, [isComplexItem, subConfigs, getAllowedItemsForConfig]);

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
      if (!hasInitialized) {
          const totalSteps = (!isFixedPrice ? 1 : 0) + subConfigs.length;
          let startStep = 0;
          while (startStep < totalSteps && !isStepInteractive(startStep)) {
              startStep++;
          }
          setCurrentStep(startStep);
          setHasInitialized(true);
      }
  }, [hasInitialized, isFixedPrice, subConfigs, isStepInteractive]);

  // --- Handlers ---
  const toggleDefaultTopping = (tId: string) => {
    if (removedDefaultToppings.includes(tId)) {
        setRemovedDefaultToppings(removedDefaultToppings.filter(id => id !== tId));
    } else {
        setRemovedDefaultToppings([...removedDefaultToppings, tId]);
    }
  };

  const toggleExtraTopping = (topping: Topping) => {
    const isAlreadyAdded = addedExtras.find(t => t.id === topping.id);

    if (isAlreadyAdded) {
        setAddedExtras(addedExtras.filter(t => t.id !== topping.id));
    } else {
        let newExtras = [...addedExtras];
        if (topping.type === 'BASE_OPTION') {
            newExtras = newExtras.filter(t => t.type !== 'BASE_OPTION');
        }
        setAddedExtras([...newExtras, topping]);
    }
  };

  const handleSubSelection = (configId: string, selectionItem: MenuItem, forcedSize?: PizzaSize) => {
      setSubSelections(prev => {
          const existing = prev.filter(s => s.configId !== configId);
          return [...existing, { configId, item: selectionItem, selectedSize: forcedSize }];
      });
  };

  const handleConfirm = () => {
    if (!isFixedPrice && !selectedSize) return;
    
    let finalExtras = [...addedExtras];
    if (extraChargeQty > 0) {
        const chargeItem: Topping = {
            id: `manual-charge-${Date.now()}`,
            name: `Extra Charge (x${extraChargeQty})`,
            price: extraChargeQty * MANUAL_CHARGE_PRICE,
            type: 'OPTION',
            available: true
        };
        finalExtras.push(chargeItem);
    }

    onConfirm(quantity, selectedSize || undefined, finalExtras, removedDefaultToppings, selectedOption, notes, subSelections);
  };

  // --- Pricing ---
  let unitPrice = 0;
  if (isFixedPrice) {
      unitPrice = item.price || 0;
  } else if (selectedSize && item.sizePrices) {
      unitPrice = item.sizePrices[selectedSize] || 0;
  }
  unitPrice += addedExtras.reduce((acc, t) => acc + t.price, 0);
  unitPrice += (extraChargeQty * MANUAL_CHARGE_PRICE);
  if (selectedOption) unitPrice += selectedOption.price;
  
  const total = unitPrice * quantity;

  // --- Renderers ---
  
  const renderSizeSelection = () => (
      <section className="mb-6">
         <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3 flex items-center gap-2">
            Choose Size <span className="text-red-500">*</span>
         </h3>
         <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {item.availableSizes.map(size => {
                const price = item.sizePrices?.[size] || 0;
                const isSelected = selectedSize === size;
                return (
                    <div 
                       key={size}
                       onClick={() => setSelectedSize(size)}
                       className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center transition-all ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-500' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                    >
                        <span className={`font-medium text-lg ${isSelected ? 'text-blue-800 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{size}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-500">${price.toFixed(2)}</span>
                    </div>
                );
            })}
         </div>
      </section>
  );

  const renderSingleItemModifiers = () => {
    const defaultToppingObjs = toppings.filter(t => item.defaultToppings.includes(t.id) && (!hasRequiredOptions || !item.requiredSelectionIds?.includes(t.id)));
    
    const allAvailableExtras = toppings
        .filter(t => 
            (!hasRequiredOptions || !item.requiredSelectionIds?.includes(t.id))
        )
        .filter(t => isFixedPrice 
            ? (!t.availableSizes || t.availableSizes.length === 0) 
            : (!t.availableSizes || (selectedSize && t.availableSizes.includes(selectedSize)))
        );

    const baseOptions = allAvailableExtras.filter(t => t.type === 'BASE_OPTION');
    
    const toppingOptions = allAvailableExtras.filter(t => t.type === 'TOPPING').sort((a, b) => {
        const aSelected = !!addedExtras.find(e => e.id === a.id);
        const bSelected = !!addedExtras.find(e => e.id === b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return a.name.localeCompare(b.name);
    });

    return (
        <div className="space-y-6">
            {!isFixedPrice && renderSizeSelection()}
            
            {hasRequiredOptions && (
              <section>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">
                      {item.requiredSelectionLabel || "Choose Option"} <span className="text-red-500">*</span>
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {item.requiredSelectionIds!.map(optId => {
                          const opt = toppings.find(t => t.id === optId);
                          if (!opt) return null;
                          const isSelected = selectedOption?.id === optId;
                          return (
                            <div key={opt.id} onClick={() => setSelectedOption(opt)} className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 dark:border-orange-500' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                <span className={`block font-medium ${isSelected ? 'text-orange-800 dark:text-orange-300' : 'text-gray-700 dark:text-gray-300'}`}>{opt.name}</span>
                                {opt.price > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">+${opt.price.toFixed(2)}</span>}
                            </div>
                          );
                      })}
                  </div>
              </section>
            )}

            {item.allowModifiers && baseOptions.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Base Options</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {baseOptions.map(t => {
                            const isAdded = !!addedExtras.find(extra => extra.id === t.id);
                            return (
                                <div 
                                    key={t.id} 
                                    onClick={() => toggleExtraTopping(t)} 
                                    className={`cursor-pointer border-2 rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all ${isAdded ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 dark:border-purple-500' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                >
                                    <span className={`block font-medium ${isAdded ? 'text-purple-800 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>{t.name}</span>
                                    {t.price > 0 && <span className="text-xs text-gray-500 dark:text-gray-400">+${t.price.toFixed(2)}</span>}
                                </div>
                            );
                        })}
                    </div>
                </section>
            )}

            {item.allowModifiers && defaultToppingObjs.length > 0 && (
                <section>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Included Ingredients</h3>
                    <div className="flex flex-wrap gap-2">
                        {defaultToppingObjs.map(t => (
                            <button key={t.id} onClick={() => toggleDefaultTopping(t.id)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all flex items-center gap-2 ${removedDefaultToppings.includes(t.id) ? 'bg-gray-50 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-700 line-through' : 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800'}`}>{!removedDefaultToppings.includes(t.id) && <Check size={14} />} {t.name}</button>
                        ))}
                    </div>
                </section>
            )}

            {item.allowModifiers && (
                <section>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Add Extras</h3>
                    
                    <div className="flex flex-wrap gap-2 mb-4">
                        {toppingOptions.map(t => {
                            const isAdded = !!addedExtras.find(extra => extra.id === t.id);
                            return (
                                <button 
                                    key={t.id} 
                                    onClick={() => toggleExtraTopping(t)} 
                                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all flex items-center gap-2 ${isAdded ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'}`}
                                >
                                    {t.name}
                                    {t.price > 0 && <span className={`text-xs ${isAdded ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}>+${t.price.toFixed(2)}</span>}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                        <div>
                            <span className="font-bold text-gray-800 dark:text-white">Extra Topping Charge</span>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Manual charge for customizations</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setExtraChargeQty(Math.max(0, extraChargeQty - 1))} className="w-8 h-8 rounded-full bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-white"><Minus size={16}/></button>
                            <span className="font-bold w-6 text-center text-gray-800 dark:text-white">{extraChargeQty}</span>
                            <button onClick={() => setExtraChargeQty(extraChargeQty + 1)} className="w-8 h-8 rounded-full bg-blue-600 border border-blue-600 flex items-center justify-center hover:bg-blue-700 text-white"><Plus size={16}/></button>
                        </div>
                    </div>
                </section>
            )}
            
            <section>
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-3">Instructions</h3>
              <textarea className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </section>
        </div>
    );
  };

  const isReviewStep = currentStep === ((!isFixedPrice ? 1 : 0) + subConfigs.length);
  const totalSteps = (!isFixedPrice ? 1 : 0) + subConfigs.length;

  const nextStep = () => {
    let next = currentStep + 1;
    while (next < totalSteps && !isStepInteractive(next)) {
        next++;
    }
    setCurrentStep(next);
  };

  const prevStep = () => {
    let prev = currentStep - 1;
    while (prev >= 0 && !isStepInteractive(prev)) {
        prev--;
    }
    setCurrentStep(prev);
  };

  const renderComplexItemFlow = () => {
    if (!isFixedPrice && currentStep === 0) {
        return renderSizeSelection();
    }
    
    // SubItem Config Steps
    const configIndex = !isFixedPrice ? currentStep - 1 : currentStep;
    
    if (configIndex < subConfigs.length) {
        const config = subConfigs[configIndex];
        const allowedItems = getAllowedItemsForConfig(config);
        const currentSelection = subSelections.find(s => s.configId === config.id);
        
        return (
            <div className="space-y-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Select {config.name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {allowedItems.map(m => {
                        const isSelected = currentSelection?.item.id === m.id;
                        return (
                            <div 
                                key={m.id} 
                                onClick={() => handleSubSelection(config.id, m, config.forceSize)}
                                className={`cursor-pointer p-3 rounded-xl border-2 flex flex-col items-center justify-center text-center transition-all ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-100 dark:border-gray-700 hover:border-gray-300'}`}
                            >
                                <span className="font-bold text-sm text-gray-800 dark:text-white">{m.name}</span>
                                {m.pricingType === 'FIXED' && m.price && <span className="text-xs text-gray-500">+${m.price}</span>}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    }

    // Final Review
    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Review Selection</h3>
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg space-y-2">
                {!isFixedPrice && (
                    <div className="flex justify-between font-medium">
                        <span className="text-gray-600 dark:text-gray-300">Size:</span>
                        <span className="text-gray-900 dark:text-white">{selectedSize}</span>
                    </div>
                )}
                {subConfigs.map(c => {
                    const sel = subSelections.find(s => s.configId === c.id);
                    return (
                        <div key={c.id} className="flex justify-between text-sm">
                            <span className="text-gray-500 dark:text-gray-400">{c.name}:</span>
                            <span className="text-gray-900 dark:text-white font-medium">{sel?.item.name || 'Not Selected'}</span>
                        </div>
                    )
                })}
            </div>
            
            <section className="mt-4">
              <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider mb-2">Instructions</h3>
              <textarea className="w-full border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" rows={2} placeholder="Add notes..." value={notes} onChange={(e) => setNotes(e.target.value)} />
            </section>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] transition-colors" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
             {showImages && (
                 <div className="w-10 h-10 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden border border-gray-300 dark:border-gray-600 flex items-center justify-center">
                    {item.image && !imgError ? <img src={item.image} className="w-full h-full object-cover" onError={() => setImgError(true)} alt="" /> : <ImageIcon size={16} className="text-gray-400" />}
                 </div>
             )}
             <div>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{item.name}</h2>
                <div className="flex items-center gap-2"><span className="text-sm text-gray-500 dark:text-gray-400">{isComplexItem ? (currentStep < totalSteps ? `Select Item ${(!isFixedPrice ? currentStep : currentStep + 1)}` : 'Review') : ''}</span></div>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
            {isComplexItem ? renderComplexItemFlow() : renderSingleItemModifiers()}
        </div>
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 flex justify-between items-center">
             {isComplexItem ? (
                 <>
                    {currentStep > 0 ? <Button variant="secondary" onClick={prevStep} className="flex gap-2"><ArrowLeft size={16}/> Back</Button> : <div />}
                    {isReviewStep ? (
                         <div className="flex items-center gap-4">
                            {!isFixedPrice && <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md"><Minus size={16}/></button><span className="font-bold w-4 text-center dark:text-white">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md"><Plus size={16}/></button></div>}
                            <Button onClick={handleConfirm} size="lg" className="flex gap-2">Add to Order - ${total.toFixed(2)}</Button>
                         </div>
                    ) : (
                        <Button onClick={nextStep} size="lg" className="flex gap-2" disabled={(!isFixedPrice && currentStep === 0 && !selectedSize) || (currentStep > (isFixedPrice ? -1 : 0) && !subSelections.find(s => s.configId === item.subItemConfigs![isFixedPrice ? currentStep : currentStep - 1].id))}>Next Step <ArrowRight size={16}/></Button>
                    )}
                 </>
             ) : (
                 <>
                    <div className="flex items-center gap-4"><span className="font-bold text-gray-700 dark:text-gray-200">Qty</span><div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1"><button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md"><Minus size={16}/></button><span className="font-bold w-4 text-center dark:text-white">{quantity}</span><button onClick={() => setQuantity(quantity + 1)} className="p-2 hover:bg-white dark:hover:bg-gray-600 rounded-md"><Plus size={16}/></button></div></div>
                    <Button onClick={handleConfirm} size="lg" disabled={(!isFixedPrice && !selectedSize) || (hasRequiredOptions && !selectedOption)}>Add to Order - ${total.toFixed(2)}</Button>
                 </>
             )}
        </div>
      </div>
    </div>
  );
};