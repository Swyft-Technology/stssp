import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import { Order, CartItem, MenuItem, PizzaSize, Topping, ManualDiscount, SubItemSelection } from '../types';
import { dataService } from '../services/dataService';
import { calculateItemPrice, calculateOrderTotals } from '../services/pricingService';
import { printOrderReceipt } from '../services/receiptService';
import { useAuth } from './AuthContext';
import { useData } from './DataContext';

interface OrderDetails {
  orderType: 'pickup' | 'delivery';
  customerName: string;
  deliveryAddress?: string;
  customerPhone?: string;
}

interface OrderContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem, quantity: number, size: PizzaSize | undefined, addedToppings: Topping[], removedToppingIds: string[], selectedOption: Topping | undefined, notes?: string, subItems?: SubItemSelection[]) => void;
  removeFromCart: (cartItemId: string) => void;
  updateCartItemQuantity: (cartItemId: string, delta: number) => void;
  clearCart: () => void;
  
  cartTotal: number;
  cartDiscount: number;
  manualDiscount: ManualDiscount | null;
  setManualDiscount: (discount: ManualDiscount | null) => void;
  autoDealsEnabled: boolean;
  toggleAutoDeals: () => void;
  
  submitOrder: (details: OrderDetails) => Promise<Order | undefined>;
  todaysOrders: Order[];
  printReceipt: (order: Order) => void;
  
  showHistoryModal: boolean;
  setShowHistoryModal: (show: boolean) => void;
}

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const OrderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  // UPDATED: Now destructuring 'categories' as well
  const { config, toppings, isOnline, refreshData, categories } = useData();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [manualDiscount, setManualDiscount] = useState<ManualDiscount | null>(null);
  const [autoDealsEnabled, setAutoDealsEnabled] = useState(true);
  const [todaysOrders, setTodaysOrders] = useState<Order[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load today's orders on mount
  useEffect(() => {
    const loadOrders = async () => {
        const allOrders = await dataService.getOrders();
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        setTodaysOrders(allOrders.filter(o => o.timestamp >= startOfDay.getTime()));
    };
    loadOrders();
  }, []);

  // Sync logic moved here (where Orders live)
  useEffect(() => {
    if (isOnline) {
       syncOfflineOrders();
    }
  }, [isOnline]);

  const syncOfflineOrders = async () => {
    const pendingOrders = dataService.getOfflineOrders();
    if (pendingOrders.length === 0) return;

    let successCount = 0;
    for (const order of pendingOrders) {
      const success = await dataService.submitOrder({ ...order, status: 'synced' });
      if (success) successCount++;
    }

    if (successCount > 0) {
      dataService.clearOfflineQueue();
      alert(`System Back Online: Synced ${successCount} orders.`);
      refreshData(); // Refresh menu/config in DataContext
      // Refresh local order list
      const allOrders = await dataService.getOrders();
      setTodaysOrders(allOrders); 
    }
  };

  const addToCart = (item: MenuItem, quantity: number, size: PizzaSize | undefined, addedToppings: Topping[], removedToppingIds: string[], selectedOption: Topping | undefined, notes?: string, subItems?: SubItemSelection[]) => {
    const unitPrice = calculateItemPrice(item, size, addedToppings, selectedOption);
    const newItem: CartItem = {
      id: crypto.randomUUID(),
      menuItem: item,
      quantity,
      selectedSize: size,
      addedToppings,
      removedToppings: removedToppingIds,
      selectedOption,
      totalPrice: unitPrice * quantity,
      notes,
      subItems
    };
    setCart(prev => [...prev, newItem]);
  };

  const updateCartItemQuantity = (cartItemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === cartItemId) {
        const newQuantity = Math.max(1, item.quantity + delta);
        const unitPrice = calculateItemPrice(item.menuItem, item.selectedSize, item.addedToppings, item.selectedOption);
        return { ...item, quantity: newQuantity, totalPrice: unitPrice * newQuantity };
      }
      return item;
    }));
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(item => item.id !== id));
  const clearCart = () => { setCart([]); setManualDiscount(null); };
  const toggleAutoDeals = () => setAutoDealsEnabled(prev => !prev);

  const { discount, total } = useMemo(() => {
    return calculateOrderTotals(cart, config, manualDiscount, autoDealsEnabled);
  }, [cart, config, manualDiscount, autoDealsEnabled]);

  const printReceipt = (order: Order) => {
    // UPDATED: Now passing categories to the receipt service
    printOrderReceipt(order, config, toppings, categories);
  };

  const submitOrder = async (details: OrderDetails) => {
    if (!user) return;
    
    const order: Order = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      items: [...cart],
      subtotal: total + discount, // Reconstruct subtotal
      discount,
      total,
      staffId: user.id,
      status: isOnline ? 'synced' : 'queued',
      manualDiscount: manualDiscount || undefined,
      autoDealsEnabled,
      ...details
    };

    if (isOnline) {
      await dataService.submitOrder(order);
      setTodaysOrders(prev => [order, ...prev]);
    } else {
      dataService.saveOrderOffline(order);
      setTodaysOrders(prev => [order, ...prev]);
    }

    clearCart();
    return order;
  };

  return (
    <OrderContext.Provider value={{
      cart, addToCart, removeFromCart, updateCartItemQuantity, clearCart,
      cartTotal: total, cartDiscount: discount,
      manualDiscount, setManualDiscount,
      autoDealsEnabled, toggleAutoDeals,
      submitOrder, todaysOrders, printReceipt,
      showHistoryModal, setShowHistoryModal
    }}>
      {children}
    </OrderContext.Provider>
  );
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) throw new Error("useOrder must be used within OrderProvider");
  return context;
};