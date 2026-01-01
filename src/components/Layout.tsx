import React from 'react';
// REPLACE useApp with split hooks
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Wifi, WifiOff, LogOut, Image, ImageOff } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Auth State
  const { user, logout, currentView, setView } = useAuth();
  // 2. Data/Config State
  const { isOnline, config, showImages, toggleImages } = useData();

  if (currentView === 'login') return <>{children}</>;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Top Header */}
      <div className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shrink-0 z-30 transition-colors">
        <div className="flex items-center gap-3">
          
          {/* Dynamic Business Name */}
          <span className="font-bold text-gray-800 dark:text-white hidden md:block">
            {config.name || 'SwyftPOS'}
          </span>
          
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-2"></div>

          {/* Role Switcher for Demo */}
          {user?.role === 'ADMIN' && (
             <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
               <button 
                 onClick={() => setView('pos')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentView === 'pos' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
               >
                 POS
               </button>
               <button 
                 onClick={() => setView('admin')}
                 className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${currentView === 'admin' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
               >
                 Admin
               </button>
             </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          
          {/* Image Toggle Switch */}
          <button 
            onClick={toggleImages}
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            title={showImages ? "Hide Images" : "Show Images"}
          >
            {showImages ? <Image size={14} /> : <ImageOff size={14} />}
            <span className="hidden sm:inline">{showImages ? 'Images On' : 'Images Off'}</span>
          </button>

          <div 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              isOnline ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
            }`}
          >
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="hidden sm:inline">{isOnline ? 'System Online' : 'Offline Mode'}</span>
          </div>

          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-gray-700">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">{user?.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.role}</p>
            </div>
            <button 
              onClick={logout}
              className="p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
};