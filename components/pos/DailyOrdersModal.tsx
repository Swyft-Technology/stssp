import React from 'react';
// REPLACE useApp with useOrder
import { useOrder } from '../../context/OrderContext';
import { X, Printer, Clock, ShoppingBag } from 'lucide-react';
import { Button } from '../ui/Button';

interface DailyOrdersModalProps {
  onClose: () => void;
}

export const DailyOrdersModal: React.FC<DailyOrdersModalProps> = ({ onClose }) => {
  // Update Hook
  const { todaysOrders, printReceipt } = useOrder();

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-3xl max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            <div>
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">Today's Orders</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-600 dark:text-gray-300">
            <X size={24} />
          </button>
        </div>

        <div className="p-0 overflow-y-auto flex-1 bg-white dark:bg-gray-800">
          {todaysOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p>No orders placed today.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-700/50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {todaysOrders.sort((a,b) => b.timestamp - a.timestamp).map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(order.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-medium">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.orderType === 'pickup' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                          : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
                      }`}>
                        {order.orderType.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 font-bold">
                      ${order.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => printReceipt(order)}
                        className="flex items-center gap-2"
                      >
                        <Printer size={16} /> Reprint
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};