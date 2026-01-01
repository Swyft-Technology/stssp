import React, { useState, useMemo } from 'react';
// NEW HOOKS
import { useOrder } from '../../context/OrderContext';
import { useData } from '../../context/DataContext';

import { Button } from '../ui/Button';
import { Trash2, ShoppingBag, Printer, User, MapPin, Phone, Tag, ToggleLeft, ToggleRight, X, Minus, Plus, Clock, Image as ImageIcon, Zap } from 'lucide-react';
import { DiscountModal } from './DiscountModal';
import { CartItem, MenuItem, PizzaSize } from '../../types';
import { AddressAutocomplete } from './AddressAutocomplete';

const CartItemThumbnail: React.FC<{ item: CartItem }> = ({ item }) => {
  const [imgError, setImgError] = useState(false);
  // Get image state from DataContext
  const { showImages } = useData();

  if (!showImages) return null;

  return (
    <div className="w-16 h-16 rounded-lg bg-white dark:bg-gray-600 overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600 flex items-center justify-center">
      {item.menuItem.image && !imgError ? (
        <img 
          src={item.menuItem.image} 
          className="w-full h-full object-cover" 
          alt={item.menuItem.name}
          onError={() => setImgError(true)}
        />
      ) : (
        <ImageIcon size={20} className="text-gray-300 dark:text-gray-500" />
      )}
    </div>
  );
};

export const CartSidebar: React.FC = () => {
  // Use OrderContext for Cart Logic
  const { 
    cart, removeFromCart, clearCart, updateCartItemQuantity,
    cartTotal, cartDiscount, 
    manualDiscount, setManualDiscount,
    autoDealsEnabled, toggleAutoDeals,
    submitOrder, printReceipt,
    setShowHistoryModal
  } = useOrder();

  // Use DataContext for Config (Pricing) and Toppings (Display)
  const { config, toppings } = useData();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [orderType, setOrderType] = useState<'pickup' | 'delivery'>('pickup');
  const [customerName, setCustomerName] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // --- Logic to Identify Applied Deals ---
  // Note: This matches the logic in pricingService, but is used here just for Visual Display
  const appliedDeals = useMemo(() => {
      if (!autoDealsEnabled || cart.length === 0) return [];

      const activeDeals: { name: string; amount: number }[] = [];
      let currentAutoDiscount = 0;

      interface CartUnit {
          unitPrice: number;
          menuItem: MenuItem;
          selectedSize?: PizzaSize;
          used: boolean;
      }

      let units: CartUnit[] = [];
      cart.forEach(item => {
          const unitPrice = item.totalPrice / item.quantity;
          for(let i=0; i<item.quantity; i++) {
              units.push({
                  unitPrice,
                  menuItem: item.menuItem,
                  selectedSize: item.selectedSize,
                  used: false
              });
          }
      });

      // 1. Check Combos
      const comboDeals = config.activeDiscounts.filter(d => d.type === 'COMBO');
      comboDeals.forEach(deal => {
          if (!deal.comboRequirements || deal.comboRequirements.length === 0) return;
          
          let combosFound = 0;
          let dealSaving = 0;

          while (true) {
              let dealPossible = true;
              let matchedIndices: number[] = [];
              
              for (const req of deal.comboRequirements) {
                  let foundCount = 0;
                  for (let i = 0; i < units.length; i++) {
                      if (foundCount >= req.quantity) break;
                      const u = units[i];
                      if (u.used || matchedIndices.includes(i)) continue;
                      
                      const catMatch = u.menuItem.categoryId === req.categoryId;
                      const itemMatch = !req.requiredItemId || u.menuItem.id === req.requiredItemId;
                      const sizeMatch = !req.requiredSize || u.selectedSize === req.requiredSize;
                      
                      if (catMatch && itemMatch && sizeMatch) {
                          matchedIndices.push(i);
                          foundCount++;
                      }
                  }
                  if (foundCount < req.quantity) {
                      dealPossible = false;
                      break;
                  }
              }

              if (dealPossible) {
                  let originalPrice = 0;
                  matchedIndices.forEach(idx => {
                      units[idx].used = true;
                      originalPrice += units[idx].unitPrice;
                  });
                  const saving = Math.max(0, originalPrice - deal.value);
                  dealSaving += saving;
                  currentAutoDiscount += saving;
                  combosFound++;
              } else {
                  break;
              }
          }
          if (combosFound > 0) {
              activeDeals.push({ name: `${deal.name} (x${combosFound})`, amount: dealSaving });
          }
      });

      // 2. Check BOGO
      const bogoRules = config.activeDiscounts.filter(d => d.type === 'BOGO');
      bogoRules.forEach(rule => {
          if (!rule.targetCategoryId || !rule.buyQuantity || !rule.getQuantity) return;
          const availableUnits = units.filter(u => !u.used && u.menuItem.categoryId === rule.targetCategoryId);
          availableUnits.sort((a, b) => a.unitPrice - b.unitPrice);
          
          const totalItems = availableUnits.length;
          const groupSize = rule.buyQuantity + rule.getQuantity;
          const groups = Math.floor(totalItems / groupSize);
          const itemsToDiscount = groups * rule.getQuantity;
          
          let bogoSaving = 0;
          for(let i=0; i < itemsToDiscount; i++) {
             const saving = availableUnits[i].unitPrice * (rule.value / 100);
             bogoSaving += saving;
             currentAutoDiscount += saving;
             availableUnits[i].used = true;
          }

          if (groups > 0) {
              activeDeals.push({ name: `${rule.name} (x${groups})`, amount: bogoSaving });
          }
      });

      // 3. Check Percentage
      const percentRules = config.activeDiscounts.filter(d => d.type === 'PERCENTAGE' && d.targetCategoryId);
      percentRules.forEach(rule => {
          let percentSaving = 0;
          let count = 0;
          const availableUnits = units.filter(u => !u.used && u.menuItem.categoryId === rule.targetCategoryId);
          
          availableUnits.forEach(u => {
              const saving = u.unitPrice * (rule.value / 100);
              percentSaving += saving;
              currentAutoDiscount += saving;
              u.used = true;
              count++;
          });

          if (count > 0) {
              activeDeals.push({ name: rule.name, amount: percentSaving });
          }
      });

      return activeDeals;
  }, [cart, config, autoDealsEnabled]);

  const handleSubmit = async () => {
    // 1. Basic Validation
    if (!customerName.trim()) { 
        alert("Please enter customer name"); 
        return; 
    }

    // 2. Delivery Validation
    if (orderType === 'delivery') {
        if (!deliveryAddress.trim()) {
            alert("Delivery address is required.");
            return;
        }
        if (!customerPhone.trim()) {
            alert("Phone number is required for delivery.");
            return;
        }
    }

    setIsProcessing(true);
    try {
      const orderDetails: any = { orderType, customerName };
      if (orderType === 'delivery') { 
          orderDetails.deliveryAddress = deliveryAddress; 
          orderDetails.customerPhone = customerPhone; 
      }
      const order = await submitOrder(orderDetails);
      if (order) { 
          printReceipt(order); 
          // Reset Fields
          setCustomerName(''); 
          setDeliveryAddress(''); 
          setCustomerPhone(''); 
          setOrderType('pickup'); 
      }
    } catch (err) { 
        console.error("Submit failed", err); 
        alert("Failed to submit order. Please try again."); 
    } finally { 
        setIsProcessing(false); 
    }
  };

  const getOptionLabel = (type?: string) => {
      if (type === 'BASE_OPTION') return 'Base: ';
      if (type === 'SAUCE_OPTION') return 'Sauce: ';
      return 'Option: ';
  };

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col h-full shadow-xl z-20 transition-colors">
      <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800">
        <div className="flex items-center gap-2"><ShoppingBag className="text-blue-600 dark:text-blue-400" size={20} /><h2 className="font-bold text-gray-800 dark:text-white text-lg">Current Order</h2></div>
        <div className="flex items-center gap-2">
            <button onClick={() => setShowHistoryModal(true)} className="text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors p-1" title="Daily History"><Clock size={18} /></button>
            {cart.length > 0 && <button onClick={clearCart} className="text-red-500 hover:text-red-600 transition-colors p-1" title="Clear Cart"><Trash2 size={18} /></button>}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {cart.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 opacity-60"><ShoppingBag size={48} className="mb-4" /><p>Cart is empty</p></div>
        ) : (
          cart.map(item => {
            const sortedSubItems = item.subItems ? [...item.subItems].sort((a, b) => {
                const idxA = item.menuItem.subItemConfigs?.findIndex(c => c.id === a.configId) ?? 0;
                const idxB = item.menuItem.subItemConfigs?.findIndex(c => c.id === b.configId) ?? 0;
                return idxA - idxB;
            }) : [];

            const baseOptions = item.addedToppings.filter(t => t.type === 'BASE_OPTION');
            const sauceOptions = item.addedToppings.filter(t => t.type === 'SAUCE_OPTION');
            const standardToppings = item.addedToppings.filter(t => t.type !== 'BASE_OPTION' && t.type !== 'SAUCE_OPTION');

            return (
                <div key={item.id} className="flex gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-100 dark:border-gray-700 animate-in fade-in slide-in-from-right-4">
                <CartItemThumbnail item={item} />
                <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0 mr-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100 text-sm line-clamp-1">{item.menuItem.name}</h4>
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase">{item.selectedSize}</p>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight space-y-0.5">
                            {sortedSubItems.map((s, i) => (
                                <span key={i} className="block text-gray-700 dark:text-gray-300 font-medium">
                                    • {s.item.name} {s.selectedSize && s.selectedSize !== item.selectedSize ? `(${s.selectedSize})` : ''}
                                </span>
                            ))}
                            {item.selectedOption && <span className="block text-purple-700 dark:text-purple-300 font-medium">{getOptionLabel(item.selectedOption.type)}{item.selectedOption.name}</span>}
                            {baseOptions.map(t => <span key={t.id} className="block text-purple-600 dark:text-purple-400 font-medium">Base: {t.name}</span>)}
                            {sauceOptions.map(t => <span key={t.id} className="block text-orange-600 dark:text-orange-400 font-medium">Sauce: {t.name}</span>)}
                            {standardToppings.map(t => <span key={t.id} className="block text-green-600 dark:text-green-400">+ {t.name}</span>)}
                            {item.removedToppings.map(id => {
                                // We need Toppings from DataContext to show names of removed items
                                const t = toppings.find(top => top.id === id);
                                return t ? <span key={id} className="block text-red-400 line-through decoration-red-400">No {t.name}</span> : null;
                            })}
                        </div>
                        {item.notes && <p className="text-xs text-amber-600 dark:text-amber-400 italic mt-1 bg-amber-50 dark:bg-amber-900/30 px-2 py-1 rounded">Note: {item.notes}</p>}
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white text-sm whitespace-nowrap">${item.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                    <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/60 transition-colors"><Trash2 size={16} /></button>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-500 px-1 py-0.5 shadow-sm">
                        <button onClick={() => updateCartItemQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 text-gray-600 dark:text-gray-200 disabled:opacity-30 disabled:hover:bg-transparent" disabled={item.quantity <= 1}><Minus size={16} /></button>
                        <span className="text-sm font-bold text-gray-800 dark:text-white w-8 text-center">{item.quantity}</span>
                        <button onClick={() => updateCartItemQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-gray-500 text-blue-600 dark:text-blue-300"><Plus size={16} /></button>
                    </div>
                    </div>
                </div>
                </div>
            )
          })
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex bg-gray-200 dark:bg-gray-700 p-1 rounded-lg mb-4">
          <button onClick={() => setOrderType('pickup')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderType === 'pickup' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Pickup</button>
          <button onClick={() => setOrderType('delivery')} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${orderType === 'delivery' ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'}`}>Delivery</button>
        </div>
        <div className="space-y-3 mb-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={16} /><input type="text" placeholder="Customer Name" className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          {orderType === 'delivery' && (
            <>
              <div className="relative animate-in fade-in slide-in-from-top-1">
                <MapPin className="absolute left-3 top-3 text-gray-400 z-10 pointer-events-none" size={16} />
                <AddressAutocomplete 
                  value={deliveryAddress}
                  onSelect={(address) => setDeliveryAddress(address)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="relative animate-in fade-in slide-in-from-top-1"><Phone className="absolute left-3 top-3 text-gray-400 z-10 pointer-events-none" size={16} /><input type="tel" placeholder="Phone Number" className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} /></div>
            </>
          )}
        </div>
        
        {/* DEALS SECTION */}
        <div className="flex flex-col gap-3 mb-4">
           {/* Auto Toggle */}
           <div className="flex items-center justify-between px-1">
              <span className="text-sm text-gray-600 dark:text-gray-400 font-medium">Automatic Deals</span>
              <button onClick={toggleAutoDeals} className="text-blue-600 hover:text-blue-700 transition-colors">
                 {autoDealsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} className="text-gray-400" />}
              </button>
           </div>

           {/* NEW: Applied Deals List */}
           {appliedDeals.length > 0 && (
               <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                   {appliedDeals.map((deal, idx) => (
                       <div key={idx} className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 px-3 py-2 rounded-lg">
                           <div className="flex items-center gap-2">
                               <Zap size={14} className="text-green-600 dark:text-green-400 fill-current" />
                               <span className="text-xs font-bold text-green-700 dark:text-green-300">{deal.name}</span>
                           </div>
                           <span className="text-xs font-bold text-green-700 dark:text-green-300">-${deal.amount.toFixed(2)}</span>
                       </div>
                   ))}
               </div>
           )}
           
           {/* Manual Discount */}
           {manualDiscount ? (
             <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 px-3 py-2.5 rounded-lg">
                <div className="flex items-center gap-2">
                   <Tag size={16} className="text-blue-600 dark:text-blue-400" />
                   <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                     Manual: {manualDiscount.type === 'PERCENTAGE' ? `${manualDiscount.value}%` : `$${manualDiscount.value.toFixed(2)}`}
                   </span>
                </div>
                <button onClick={() => setManualDiscount(null)} className="p-1 hover:bg-blue-100 dark:hover:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400">
                  <X size={16} />
                </button>
             </div>
           ) : (
             <Button variant="secondary" size="md" onClick={() => setShowDiscountModal(true)} className="flex items-center justify-center gap-2 border-dashed py-2.5 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300">
                <Tag size={16} /> Add Discount
             </Button>
           )}
        </div>

        <div className="space-y-2 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700 border-dashed">
          <div className="flex justify-between text-gray-600 dark:text-gray-400 text-sm"><span>Subtotal</span><span>${(cartTotal + cartDiscount).toFixed(2)}</span></div>
          {cartDiscount > 0 && (<div className="flex justify-between text-green-600 dark:text-green-400 text-sm font-medium"><span>Discount</span><span>-${cartDiscount.toFixed(2)}</span></div>)}
          <div className="flex justify-between text-xl font-bold text-gray-900 dark:text-white pt-2"><span>Total</span><span>${cartTotal.toFixed(2)}</span></div>
        </div>
        <Button fullWidth size="lg" disabled={cart.length === 0 || isProcessing} onClick={handleSubmit} className="flex items-center justify-center gap-2 py-4 text-lg"><Printer size={20} /> Submit & Print</Button>
      </div>
      {showDiscountModal && <DiscountModal onClose={() => setShowDiscountModal(false)} currentDiscount={manualDiscount} onApply={setManualDiscount} />}
    </div>
  );
};