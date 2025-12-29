import React, { useEffect, useState } from 'react';
import { dataService } from '../../services/dataService';
import { Order } from '../../types';
import { Search, ChevronLeft, ChevronRight, Filter, Calendar, Clock } from 'lucide-react'; // Added Clock icon
import { Button } from '../ui/Button';

export const OrderHistory: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setHours(0,0,0,0);
    return d.toISOString().split('T')[0]; // Today by default
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setHours(23,59,59,999);
    return d.toISOString().split('T')[0];
  });

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Initial Load
  useEffect(() => {
    handleSearch();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = async () => {
    setIsLoading(true);
    try {
      // Convert string dates to timestamps for DB query
      const start = new Date(startDate).getTime();
      // Ensure end date covers the full day
      const endObj = new Date(endDate);
      endObj.setHours(23, 59, 59, 999);
      const end = endObj.getTime();
      
      const data = await dataService.getOrdersByDate(start, end);
      setOrders(data);
      setCurrentPage(1); // Reset to page 1 on new search
    } finally {
      setIsLoading(false);
    }
  };

  // --- Quick Filter Logic ---
  const applyQuickFilter = (days: number) => {
      const end = new Date();
      const start = new Date();
      
      if (days === 0) {
          // Today
          start.setHours(0,0,0,0);
      } else {
          // Last X Days
          start.setDate(end.getDate() - days);
          start.setHours(0,0,0,0);
      }

      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      
      // We need to wait for state to update, or pass values directly. 
      // Ideally use useEffect or pass params to a function.
      // For simplicity, we'll trigger the search with these new values directly.
      triggerSearchWithDates(start, end);
  };

  const triggerSearchWithDates = async (startObj: Date, endObj: Date) => {
      setIsLoading(true);
      try {
          const start = startObj.getTime();
          endObj.setHours(23, 59, 59, 999);
          const end = endObj.getTime();
          
          const data = await dataService.getOrdersByDate(start, end);
          setOrders(data);
          setCurrentPage(1);
      } finally {
          setIsLoading(false);
      }
  };

  // Client-side filtering (Search Query)
  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const currentData = filteredOrders.slice(startIndex, startIndex + rowsPerPage);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
        setCurrentPage(page);
    }
  };

  return (
    <div className="space-y-4 h-[calc(100vh-140px)] flex flex-col"> {/* Reduced space-y-6 to 4 for compactness */}
      
      {/* Top Bar: Filters */}
      <div className="flex flex-col gap-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        
        {/* Row 1: Date Range & Search */}
        <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
            <div className="flex items-center gap-2">
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="date" 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>
                <span className="text-gray-400">-</span>
                <div className="relative">
                    <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                    <input 
                        type="date" 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <Button onClick={handleSearch} size="md" className="flex items-center gap-2">
                    <Filter size={16} /> Filter
                </Button>
            </div>

            {/* Text Search */}
            <div className="relative w-full md:w-64">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Search customer" 
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                />
            </div>
        </div>

        {/* Row 2: Quick Filters */}
        <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
            <button 
                onClick={() => applyQuickFilter(0)}
                className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors border border-transparent hover:border-blue-200"
            >
                Today
            </button>
            <button 
                onClick={() => applyQuickFilter(7)}
                className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors border border-transparent hover:border-blue-200"
            >
                Last 7 Days
            </button>
            <button 
                onClick={() => applyQuickFilter(30)}
                className="px-3 py-1 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-600 rounded-full transition-colors border border-transparent hover:border-blue-200"
            >
                Last 30 Days
            </button>
        </div>
      </div>
      
      {/* Table Container - Flex grow to fill space */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto relative">
            <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200 sticky top-0 z-10 shadow-sm">
                <tr>
                    <th className="px-6 py-4 whitespace-nowrap bg-gray-50">Date & Time</th>
                    <th className="px-6 py-4 whitespace-nowrap bg-gray-50">Customer</th>
                    <th className="px-6 py-4 whitespace-nowrap bg-gray-50">Total</th>
                    <th className="px-6 py-4 whitespace-nowrap bg-gray-50">Type</th>
                    <th className="px-6 py-4 whitespace-nowrap bg-gray-50">Status</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {isLoading ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">Loading orders...</td>
                    </tr>
                ) : currentData.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                            No orders found for this period.
                        </td>
                    </tr>
                ) : (
                    currentData.map(order => (
                        <tr key={order.id} className="hover:bg-blue-50 transition-colors group">
                        <td className="px-6 py-3 text-gray-600">
                            <div className="font-medium text-gray-900">
                                {new Date(order.timestamp).toLocaleDateString()}
                            </div>
                            <div className="text-xs text-gray-500">
                                {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                        </td>
                        
                        <td className="px-6 py-3">
                            <span className="font-medium text-gray-900 block">{order.customerName}</span>
                            {order.customerPhone && <span className="text-xs text-gray-400">{order.customerPhone}</span>}
                        </td>

                        <td className="px-6 py-3 text-gray-900 font-bold">
                            ${order.total.toFixed(2)}
                        </td>
                        
                        <td className="px-6 py-3 text-gray-600 capitalize">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                order.orderType === 'delivery' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                                {order.orderType}
                            </span>
                        </td>
                        
                        <td className="px-6 py-3">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            order.status === 'synced' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                            {order.status.toUpperCase()}
                            </span>
                        </td>
                        </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>

        {/* Footer Pagination */}
        <div className="bg-gray-50 border-t border-gray-200 p-4 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>Rows per page:</span>
                <select 
                    className="border border-gray-300 rounded p-1 bg-white outline-none focus:border-blue-500"
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                </select>
                <span className="ml-2">
                    Showing {startIndex + 1}-{Math.min(startIndex + rowsPerPage, filteredOrders.length)} of {filteredOrders.length}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronLeft size={20} />
                </button>
                
                {/* Simple Page Numbers */}
                <div className="flex gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        // Logic to show pages around current page
                        let p = i + 1;
                        if (totalPages > 5 && currentPage > 3) {
                            p = currentPage - 3 + i;
                            if (p > totalPages) p = totalPages - (4 - i);
                        }
                        
                        return (
                            <button
                                key={p}
                                onClick={() => goToPage(p)}
                                className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                                    currentPage === p 
                                        ? 'bg-blue-600 text-white' 
                                        : 'hover:bg-gray-200 text-gray-600'
                                }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages || totalPages === 0}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
                >
                    <ChevronRight size={20} />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};