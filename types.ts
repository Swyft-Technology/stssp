export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pin?: string;
}

export type PizzaSize = 'Small' | 'Medium' | 'Large' | 'Family';

export interface Topping {
  id: string;
  name: string;
  price: number; 
  type: 'TOPPING' | 'SAUCE_OPTION' | 'BASE_OPTION' | 'SIDE' | 'OPTION'; 
  available: boolean;
  availableSizes?: PizzaSize[];
}

export type MenuItemType = 'SINGLE' | 'HALF_AND_HALF' | 'BUNDLE';

export interface SubItemConfig {
  id: string;
  name: string; // e.g. "Left Half", "Choose Drink"
  allowCategories: string[]; // IDs of categories allowed to be selected
  forceSize?: PizzaSize; // e.g. Lunch special forces 'Small' pizza
  forceItemId?: string;
}

export interface MenuItem {
  id: string;
  name: string;
  categoryId: string;
  description?: string;
  image?: string; // Base64 string
  available: boolean;
  
  itemType: MenuItemType;

  // Configuration for Bundles/H&H
  subItemConfigs?: SubItemConfig[];
  
  allowModifiers: boolean;
  
  // Pricing Strategy
  pricingType: 'FIXED' | 'SIZE_BASED';
  price?: number; 
  sizePrices?: Partial<Record<PizzaSize, number>>;
  
  // Configuration
  availableSizes: PizzaSize[];
  defaultToppings: string[]; 
  
  // Generic Required Selections (Replaces allowedBaseSauces)
  requiredSelectionIds?: string[]; 
  requiredSelectionLabel?: string; 

  // Legacy/Compatibility (Can be deprecated if new ItemType handles all cases)
  allowHalfHalf?: boolean;
  excludedFromHalfHalf?: boolean;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  ticketPriority?: number;
  sortOrder: number;
}

export interface SubItemSelection {
  configId: string;
  item: MenuItem; // The selected menu item (e.g. the Margherita Pizza selected as Left Half)
  selectedSize?: PizzaSize;
}

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedSize?: PizzaSize;
  addedToppings: Topping[];
  removedToppings: string[];  
  selectedOption?: Topping; 
  subItems?: SubItemSelection[];
  totalPrice: number;
  notes?: string;
}

export interface ManualDiscount {
  type: 'PERCENTAGE' | 'FIXED';
  value: number;
}

export interface Order {
  id: string;
  timestamp: number;
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  staffId: string;
  status: 'completed' | 'synced' | 'queued';
  orderType: 'pickup' | 'delivery';
  customerName: string;
  deliveryAddress?: string;
  customerPhone?: string;
  manualDiscount?: ManualDiscount;
  autoDealsEnabled: boolean;
}

export interface TenantConfig {
  name: string;
  address?: string;
  abn?: string;
  currency: string;
  taxRate: number;
  activeDiscounts: DiscountRule[];
}

export interface ComboItemRequirement {
  categoryId: string; 
  quantity: number; 
  requiredSize?: PizzaSize;
  requiredItemId?: string;
}

export interface DiscountRule {
  id: string;
  name: string;
  type: 'BOGO' | 'PERCENTAGE' | 'COMBO';
  value: number; 
  targetCategoryId?: string;
  buyQuantity?: number;
  getQuantity?: number;
  comboRequirements?: ComboItemRequirement[];
}