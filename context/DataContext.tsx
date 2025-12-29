import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, Category, Topping, TenantConfig } from '../types';
import { dataService } from '../services/dataService';
import { DEFAULT_CONFIG } from '../constants';

interface DataContextType {
  menu: MenuItem[];
  categories: Category[];
  toppings: Topping[];
  config: TenantConfig;
  isOnline: boolean;
  refreshData: () => Promise<void>;
  updateConfig: (config: TenantConfig) => Promise<void>;
  showImages: boolean;
  toggleImages: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [config, setConfig] = useState<TenantConfig>(DEFAULT_CONFIG);
  const [isOnline, setIsOnline] = useState(dataService.getNetworkStatus());
  const [showImages, setShowImages] = useState(false);

  useEffect(() => {
    refreshData();
    const unsubscribe = dataService.onNetworkChange((status) => {
      setIsOnline(status);
    });
    return () => unsubscribe();
  }, []);

  const refreshData = async () => {
    const [m, c, t, conf] = await Promise.all([
      dataService.getMenu(),
      dataService.getCategories(),
      dataService.getToppings(),
      dataService.getConfig()
    ]);
    
    setMenu(m);
    setCategories(c.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)));
    setToppings(t);
    setConfig(conf);
  };

  const updateConfig = async (newConfig: TenantConfig) => {
    await dataService.saveConfig(newConfig);
    setConfig(newConfig);
  };

  const toggleImages = () => setShowImages(prev => !prev);

  return (
    <DataContext.Provider value={{
      menu, categories, toppings, config, 
      isOnline, refreshData, updateConfig,
      showImages, toggleImages
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};