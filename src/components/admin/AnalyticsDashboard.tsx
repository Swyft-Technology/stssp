import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { dataService } from '../../services/dataService';

export const AnalyticsDashboard: React.FC = () => {
  // 1. Updated Filter Options
  const [timeFilter, setTimeFilter] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  
  const [stats, setStats] = useState({ 
      todaySales: 0, yesterdaySales: 0, monthSales: 0, yearSales: 0,
      todayOrders: 0, avgOrder: 0,
      deliveries: 0, pickups: 0, garlicBreads: 0
  });
  
  const [dailySalesData, setDailySalesData] = useState<any[]>([]);
  const [itemSalesData, setItemSalesData] = useState<any[]>([]);

  // State to delay chart rendering until layout is computed
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    loadData();

    return () => clearTimeout(timer);
  }, [timeFilter]);

  const loadData = async () => {
    const orders = await dataService.getOrders();
    const now = new Date();
    
    // Timestamps for KPI calculations (Stats)
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfYesterday = startOfToday - 86400000;
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();

    // 1. Calculate KPIs (Static Stats - Unchanged by filter)
    let todayTotal = 0;
    let yestTotal = 0;
    let monthTotal = 0;
    let yearTotal = 0;
    let todayCount = 0;
    let deliveries = 0;
    let pickups = 0;
    let garlicBreads = 0;

    orders.forEach(o => {
        if (o.timestamp >= startOfToday) {
            todayTotal += o.total;
            todayCount++;
            if (o.orderType === 'delivery') deliveries++;
            else pickups++;

            o.items.forEach(i => {
                if (i.menuItem.name.toLowerCase().includes('garlic bread') || i.menuItem.name.toLowerCase().includes('garlic pizza')) {
                    garlicBreads += i.quantity;
                }
            });
        }
        if (o.timestamp >= startOfYesterday && o.timestamp < startOfToday) {
            yestTotal += o.total;
        }
        if (o.timestamp >= startOfMonth) {
            monthTotal += o.total;
        }
        if (o.timestamp >= startOfYear) {
            yearTotal += o.total;
        }
    });

    setStats({
        todaySales: todayTotal,
        yesterdaySales: yestTotal,
        monthSales: monthTotal,
        yearSales: yearTotal,
        todayOrders: todayCount,
        avgOrder: todayCount > 0 ? todayTotal / todayCount : 0,
        deliveries,
        pickups,
        garlicBreads
    });

    // 2. Prepare Graph Data based on Filter
    let filteredOrders = orders;
    let startTime = 0;
    const ONE_DAY = 86400000;

    if (timeFilter === 'daily') {
        // Last 7 Days
        startTime = now.getTime() - (7 * ONE_DAY);
    } else if (timeFilter === 'weekly') {
        // Last 8 Weeks (approx 56 days)
        startTime = now.getTime() - (56 * ONE_DAY);
    } else {
        // Last 12 Months
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        startTime = d.getTime();
    }

    filteredOrders = orders.filter(o => o.timestamp >= startTime);

    // Graph 1: Sales Overview (With Sort Logic)
    const salesMap = new Map<string, { sales: number, sortValue: number }>();
    
    filteredOrders.forEach(o => {
        const date = new Date(o.timestamp);
        let key = '';
        let sortValue = 0;

        if (timeFilter === 'daily') {
            // Group by Day (e.g., "Mon 12")
            key = date.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric' });
            // Sort by raw timestamp of midnight that day
            const d = new Date(date); d.setHours(0,0,0,0);
            sortValue = d.getTime();
        } 
        else if (timeFilter === 'weekly') {
            // Group by Start of Week (Monday)
            const day = date.getDay();
            const diff = date.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
            const monday = new Date(date.setDate(diff));
            monday.setHours(0,0,0,0);
            
            key = `Wk ${monday.getDate()}/${monday.getMonth()+1}`;
            sortValue = monday.getTime();
        } 
        else {
            // Group by Month (e.g., "Jan 24")
            key = date.toLocaleDateString('en-AU', { month: 'short', year: '2-digit' });
            const d = new Date(date.getFullYear(), date.getMonth(), 1);
            sortValue = d.getTime();
        }
        
        const existing = salesMap.get(key) || { sales: 0, sortValue };
        salesMap.set(key, { sales: existing.sales + o.total, sortValue });
    });

    // Convert to Array and Sort Chronologically
    const salesChartData = Array.from(salesMap.entries())
        .map(([name, data]) => ({ name, sales: data.sales, sortValue: data.sortValue }))
        .sort((a, b) => a.sortValue - b.sortValue);

    setDailySalesData(salesChartData);

    // Graph 2: Item Breakdown (Horizontal Bar - Top 5)
    const itemMap = new Map<string, number>();
    filteredOrders.forEach(o => {
        o.items.forEach(i => {
            itemMap.set(i.menuItem.name, (itemMap.get(i.menuItem.name) || 0) + i.quantity);
        });
    });
    
    // Top 5 Items
    const itemChartData = Array.from(itemMap.entries())
        .map(([name, count]) => ({ name, count }))
        .sort((a,b) => b.count - a.count)
        .slice(0, 5);
    
    setItemSalesData(itemChartData);
  };

  return (
    <div className="space-y-6">
      {/* Top Level KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
           <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Today's Sales</p>
           <h3 className="text-2xl font-bold text-blue-900 dark:text-blue-100">${stats.todaySales.toFixed(2)}</h3>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
           <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Yesterday</p>
           <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">${stats.yesterdaySales.toFixed(2)}</h3>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
           <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">This Month</p>
           <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">${stats.monthSales.toFixed(2)}</h3>
        </div>
        <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
           <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">This Year</p>
           <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300">${stats.yearSales.toFixed(2)}</h3>
        </div>
      </div>

      {/* Daily Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
             <span className="text-4xl font-bold text-gray-800 dark:text-white">{stats.deliveries}</span>
             <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Deliveries Today</span>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
             <span className="text-4xl font-bold text-gray-800 dark:text-white">{stats.pickups}</span>
             <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Pickups Today</span>
         </div>
         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center">
             <span className="text-4xl font-bold text-orange-600 dark:text-orange-400">{stats.garlicBreads}</span>
             <span className="text-sm text-gray-500 dark:text-gray-400 mt-1">Garlic Breads Sold</span>
         </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-gray-800 dark:text-white">Sales Overview</h3>
               <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  {[
                      { id: 'daily', label: 'Daily' }, 
                      { id: 'weekly', label: 'Weekly' }, 
                      { id: 'monthly', label: 'Monthly' }
                  ].map((t) => (
                      <button 
                        key={t.id}
                        onClick={() => setTimeFilter(t.id as any)}
                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${timeFilter === t.id ? 'bg-white dark:bg-gray-600 shadow text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                          {t.label}
                      </button>
                  ))}
               </div>
           </div>
           
           {/* Chart Container */}
           <div className="h-64 w-full min-w-0">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    <BarChart data={dailySalesData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#6b7280'}} />
                    <YAxis axisLine={false} tickLine={false} tickFormatter={(val) => `$${val}`} tick={{fontSize: 12, fill: '#6b7280'}} />
                    <Tooltip 
                        cursor={{ fill: 'transparent' }}
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                    />
                    <Bar dataKey="sales" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">Loading Chart...</div>
              )}
           </div>
        </div>

        {/* Item Breakdown (Horizontal Bar) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-6">Top 5 Items</h3>
           
           {/* Chart Container */}
           <div className="h-64 w-full min-w-0">
              {isMounted ? (
                <ResponsiveContainer width="100%" height="100%" minHeight={200}>
                    {/* UPDATED: Vertical Layout for Horizontal Bars */}
                    <BarChart layout="vertical" data={itemSalesData} margin={{ left: 10, right: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            axisLine={false} 
                            tickLine={false} 
                            width={100}
                            tick={{fontSize: 11, fill: '#4b5563'}} 
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20}>
                             {itemSalesData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : '#8b5cf6'} />
                             ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-gray-400">Loading Chart...</div>
              )}
           </div>
        </div>
      </div>
    </div>
  );
};