import React, { useState } from 'react';
import { LayoutDashboard, List, History, Tag } from 'lucide-react';
import { AnalyticsDashboard } from './AnalyticsDashboard';
import { MenuManagement } from './menu/MenuManagement';
import { OrderHistory } from './OrderHistory';
import { DealsManagement } from './DealsManagement';

export const AdminLayout: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'menu' | 'dashboard' | 'history' | 'deals'>('menu');

  const tabs = [
    { id: 'menu', label: 'Menu Management', icon: <List size={20} /> },
    { id: 'dashboard', label: 'Reports', icon: <LayoutDashboard size={20} /> },
    { id: 'deals', label: 'Deals & Offers', icon: <Tag size={20} /> },
    { id: 'history', label: 'Order History', icon: <History size={20} /> },
  ];

  return (
    <div className="flex flex-col h-full bg-gray-100">
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-800">Admin Console</h1>
        <p className="text-gray-500 text-sm">Manage your store settings and view reports</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Tabs */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <nav className="p-4 space-y-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8">
          {activeTab === 'dashboard' && <AnalyticsDashboard />}
          {activeTab === 'menu' && <MenuManagement />}
          {activeTab === 'deals' && <DealsManagement />}
          {activeTab === 'history' && <OrderHistory />}
        </div>
      </div>
    </div>
  );
};