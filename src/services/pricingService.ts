import { CartItem, MenuItem, PizzaSize, Topping, TenantConfig, ManualDiscount } from '../types';

// 1. Calculate the price of a single item (with modifiers)
export const calculateItemPrice = (
  item: MenuItem, 
  size: PizzaSize | undefined, 
  addedToppings: Topping[], 
  selectedOption: Topping | undefined
): number => {
  let basePrice = 0;
  
  if (item.pricingType === 'FIXED') {
    basePrice = item.price || 0;
  } else if (item.pricingType === 'SIZE_BASED' && size && item.sizePrices) {
    basePrice = item.sizePrices[size] || 0;
  }
  
  const toppingsPrice = addedToppings.reduce((sum, t) => sum + t.price, 0);
  const optionPrice = selectedOption ? selectedOption.price : 0;
  
  return basePrice + toppingsPrice + optionPrice;
};

// 2. Calculate the total for the entire cart (Deals + Manual Discount)
export const calculateOrderTotals = (
  cart: CartItem[], 
  config: TenantConfig, 
  manualDiscount: ManualDiscount | null,
  autoDealsEnabled: boolean
) => {
  let subtotal = 0;
  cart.forEach(item => subtotal += item.totalPrice);

  let autoDiscountAmount = 0;

  // Helper interface for the discount engine
  interface CartUnit {
      cartItemId: string;
      unitPrice: number;
      menuItem: MenuItem;
      selectedSize?: PizzaSize;
      used: boolean;
  }

  // Flatten cart into individual units for "mixed" deal calculation
  let units: CartUnit[] = [];
  cart.forEach(item => {
      const unitPrice = item.totalPrice / item.quantity;
      for(let i=0; i<item.quantity; i++) {
          units.push({
              cartItemId: item.id,
              unitPrice,
              menuItem: item.menuItem,
              selectedSize: item.selectedSize,
              used: false
          });
      }
  });

  if (autoDealsEnabled) {
    // A. Check Combos
    const comboDeals = config.activeDiscounts.filter(d => d.type === 'COMBO');
    comboDeals.forEach(deal => {
        if (!deal.comboRequirements || deal.comboRequirements.length === 0) return;
        
        while (true) {
            let dealPossible = true;
            let matchedUnitsIndices: number[] = [];
            
            for (const req of deal.comboRequirements) {
                let foundCount = 0;
                for (let i = 0; i < units.length; i++) {
                    if (foundCount >= req.quantity) break;
                    const u = units[i];
                    if (u.used || matchedUnitsIndices.includes(i)) continue;
                    
                    const catMatch = u.menuItem.categoryId === req.categoryId;
                    const itemMatch = !req.requiredItemId || u.menuItem.id === req.requiredItemId;
                    const sizeMatch = !req.requiredSize || u.selectedSize === req.requiredSize;
                    
                    if (catMatch && itemMatch && sizeMatch) {
                        matchedUnitsIndices.push(i);
                        foundCount++;
                    }
                }
                if (foundCount < req.quantity) {
                    dealPossible = false;
                    break;
                }
            }

            if (dealPossible) {
                let originalPriceOfComboItems = 0;
                matchedUnitsIndices.forEach(idx => {
                    units[idx].used = true;
                    originalPriceOfComboItems += units[idx].unitPrice;
                });
                const dealDiscount = Math.max(0, originalPriceOfComboItems - deal.value);
                autoDiscountAmount += dealDiscount;
            } else {
                break; 
            }
        }
    });

    // B. Check BOGO
    const bogoRules = config.activeDiscounts.filter(d => d.type === 'BOGO');
    bogoRules.forEach(rule => {
      if (!rule.targetCategoryId || !rule.buyQuantity || !rule.getQuantity) return;
      
      const availableUnits = units.filter(u => !u.used && u.menuItem.categoryId === rule.targetCategoryId);
      availableUnits.sort((a, b) => a.unitPrice - b.unitPrice); // Discount cheapest items
      
      const totalItems = availableUnits.length;
      const groupSize = rule.buyQuantity + rule.getQuantity;
      const groups = Math.floor(totalItems / groupSize);
      const itemsToDiscount = groups * rule.getQuantity;
      
      for(let i=0; i < itemsToDiscount; i++) {
         autoDiscountAmount += availableUnits[i].unitPrice * (rule.value / 100);
         availableUnits[i].used = true;
      }
    });

    // C. Check Percentage
    const percentRules = config.activeDiscounts.filter(d => d.type === 'PERCENTAGE' && d.targetCategoryId);
    percentRules.forEach(rule => {
        const availableUnits = units.filter(u => !u.used && u.menuItem.categoryId === rule.targetCategoryId);
        availableUnits.forEach(u => {
            autoDiscountAmount += u.unitPrice * (rule.value / 100);
            u.used = true;
        });
    });
  }

  // D. Manual Discounts (applied to the remainder)
  let currentTotal = subtotal - autoDiscountAmount;
  let manualDiscountAmount = 0;
  
  if (manualDiscount) {
    if (manualDiscount.type === 'PERCENTAGE') {
      manualDiscountAmount = currentTotal * (manualDiscount.value / 100);
    } else {
      manualDiscountAmount = manualDiscount.value;
    }
  }

  const totalDiscount = autoDiscountAmount + manualDiscountAmount;
  const finalTotal = Math.max(0, subtotal - totalDiscount);

  return { subtotal, discount: totalDiscount, total: finalTotal };
};