import { Category, MenuItem, TenantConfig, Topping } from './types';

// These are now SEED DATA used only to initialize an empty database.
// Authentication is handled via Firebase Auth.

export const SEED_CATEGORIES: Category[] = [
  { 
    id: 'c1', 
    name: 'Traditional Pizzas', 
    icon: '',
    sortOrder: 0
  },
  { 
    id: 'c2', 
    name: 'Gourmet Pizzas', 
    icon: '',
    sortOrder: 1
  },
  { 
    id: 'c4', 
    name: 'Sides', 
    icon: '',
    sortOrder: 2
  },
  { 
    id: 'c3', 
    name: 'Drinks', 
    icon: '',
    sortOrder: 3
  },
];

export const SEED_TOPPINGS: Topping[] = [
  { id: 't_gf', name: 'Gluten Free Base', price: 4.00, type: 'BASE_OPTION', available: true, availableSizes: ['Medium'] },
  { id: 't1', name: 'Mozzarella', price: 2.00, type: 'TOPPING', available: true },
  { id: 't2', name: 'Tomato Base', price: 0, type: 'SAUCE_OPTION', available: true },
  { id: 't_bbq', name: 'BBQ Base', price: 0, type: 'SAUCE_OPTION', available: true },
  { id: 't3', name: 'Pepperoni', price: 2.50, type: 'TOPPING', available: true },
  { id: 't4', name: 'Ham', price: 2.00, type: 'TOPPING', available: true },
  { id: 't5', name: 'Mushrooms', price: 1.50, type: 'TOPPING', available: true },
  { id: 't6', name: 'Olives', price: 1.50, type: 'TOPPING', available: true },
  { id: 't7', name: 'Capsicum', price: 1.50, type: 'TOPPING', available: true },
  { id: 't8', name: 'Pineapple', price: 1.50, type: 'TOPPING', available: true },
  { id: 't9', name: 'Prawns', price: 3.50, type: 'TOPPING', available: true },
  { id: 't10', name: 'Bacon', price: 2.50, type: 'TOPPING', available: true },
  { id: 't11', name: 'Chicken', price: 3.00, type: 'TOPPING', available: true },
  { id: 't_aioli', name: 'Aioli Swirl', price: 1.00, type: 'SAUCE_OPTION', available: true },
  { id: 't_chili', name: 'Chili Flakes', price: 0.00, type: 'OPTION', available: true },
];

export const SEED_MENU: MenuItem[] = [
  // H&H and Bundle Examples
  {
    id: 'm_hh',
    name: 'Half & Half Pizza',
    categoryId: 'c1',
    available: true,
    itemType: 'HALF_AND_HALF',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Medium': 18, 'Large': 22, 'Family': 26 },
    availableSizes: ['Medium', 'Large', 'Family'],
    defaultToppings: [],
    allowModifiers: true,
    subItemConfigs: [
        { id: 'sc1', name: 'Left Half', allowCategories: ['c1', 'c2'] },
        { id: 'sc2', name: 'Right Half', allowCategories: ['c1', 'c2'] }
    ]
  },
  {
    id: 'm_lunch',
    name: 'Lunch Special',
    categoryId: 'c1', 
    available: true,
    itemType: 'BUNDLE',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80',
    pricingType: 'FIXED',
    price: 15.00,
    availableSizes: [],
    defaultToppings: [],
    allowModifiers: false,
    subItemConfigs: [
        { id: 'sc_pizza', name: 'Choose Pizza', allowCategories: ['c1'], forceSize: 'Small' },
        { id: 'sc_drink', name: 'Choose Drink', allowCategories: ['c3'] }
    ]
  },
  // Traditional
  {
    id: 'm1',
    name: 'Margherita',
    categoryId: 'c1',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 12, 'Medium': 16, 'Large': 20, 'Family': 24 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t2', 't1'],
    allowModifiers: true,
    allowHalfHalf: true, 
    excludedFromHalfHalf: false
  },
  {
    id: 'm2',
    name: 'Pepperoni',
    categoryId: 'c1',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 12, 'Medium': 16, 'Large': 20, 'Family': 24 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t2', 't1', 't3'],
    allowModifiers: true,
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  {
    id: 'm3',
    name: 'Hawaiian',
    categoryId: 'c1',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 12, 'Medium': 16, 'Large': 20, 'Family': 24 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t2', 't1', 't4', 't8'],
    allowModifiers: true,
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  {
    id: 'm4',
    name: 'Supreme',
    categoryId: 'c1',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 14, 'Medium': 18, 'Large': 22, 'Family': 26 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t2', 't1', 't3', 't4', 't5', 't6', 't7'],
    allowModifiers: true,
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  {
    id: 'm_bbq_chick',
    name: 'BBQ Chicken',
    categoryId: 'c1',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 14, 'Medium': 18, 'Large': 22, 'Family': 26 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t1', 't5', 't11'], 
    allowModifiers: true,
    requiredSelectionIds: ['t2', 't_bbq'],
    requiredSelectionLabel: 'Choose Base Sauce',
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  // Gourmet
  {
    id: 'm5',
    name: 'Garlic Prawn',
    categoryId: 'c2', 
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Medium': 18, 'Large': 23, 'Family': 28 }, 
    availableSizes: ['Medium', 'Large', 'Family'],
    defaultToppings: ['t2', 't1', 't9', 't7'],
    allowModifiers: true,
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  // Sides
  {
    id: 's1',
    name: 'Garlic Pizza',
    categoryId: 'c4',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1573145608825-d5a2d207d6c5?auto=format&fit=crop&w=500&q=80',
    pricingType: 'SIZE_BASED',
    sizePrices: { 'Small': 8, 'Medium': 10, 'Large': 12, 'Family': 15 },
    availableSizes: ['Small', 'Medium', 'Large', 'Family'],
    defaultToppings: ['t1'],
    allowModifiers: true,
    allowHalfHalf: true,
    excludedFromHalfHalf: false
  },
  {
    id: 's2',
    name: 'Wedges',
    categoryId: 'c4',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1581533276945-8c7c91c32729?auto=format&fit=crop&w=500&q=80',
    pricingType: 'FIXED',
    price: 8.50,
    availableSizes: [],
    defaultToppings: [],
    allowModifiers: false,
    allowHalfHalf: false,
    excludedFromHalfHalf: true
  },
  // Drinks
  {
    id: 'm6',
    name: 'Cola Can',
    categoryId: 'c3',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
    pricingType: 'FIXED',
    price: 3.50,
    availableSizes: [],
    defaultToppings: [],
    allowModifiers: false,
    allowHalfHalf: false,
    excludedFromHalfHalf: true
  },
  {
    id: 'm7',
    name: 'Cola 1.25L',
    categoryId: 'c3',
    available: true,
    itemType: 'SINGLE',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=500&q=80',
    pricingType: 'FIXED',
    price: 6.00,
    availableSizes: [],
    defaultToppings: [],
    allowModifiers: false,
    allowHalfHalf: false,
    excludedFromHalfHalf: true
  }
];

export const DEFAULT_CONFIG: TenantConfig = {
  name: 'Romanos Pizza',
  address: '123 Main St',
  abn: '',
  currency: '$',
  taxRate: 0.1,
  activeDiscounts: []
};