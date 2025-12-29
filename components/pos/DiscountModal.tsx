import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { X, Percent, DollarSign } from 'lucide-react';
import { ManualDiscount } from '../../types';

interface DiscountModalProps {
  onClose: () => void;
  onApply: (discount: ManualDiscount) => void;
  currentDiscount: ManualDiscount | null;
}

export const DiscountModal: React.FC<DiscountModalProps> = ({ onClose, onApply, currentDiscount }) => {
  const [type, setType] = useState<'PERCENTAGE' | 'FIXED'>(currentDiscount?.type || 'PERCENTAGE');
  const [value, setValue] = useState<string>(currentDiscount?.value.toString() || '');

  const handleApply = () => {
    const numVal = parseFloat(value);
    if (isNaN(numVal) || numVal < 0) return;
    onApply({ type, value: numVal });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-bold text-gray-800">Apply Discount</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setType('PERCENTAGE')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                type === 'PERCENTAGE' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Percent size={18} /> Percentage
            </button>
            <button
              onClick={() => setType('FIXED')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg border transition-all ${
                type === 'FIXED' 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              <DollarSign size={18} /> Fixed Amount
            </button>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {type === 'PERCENTAGE' ? 'Discount Percentage' : 'Discount Amount'}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-400">
                {type === 'PERCENTAGE' ? '%' : '$'}
              </span>
              <input
                type="number"
                className="w-full pl-8 pr-4 py-3 text-lg border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder={type === 'PERCENTAGE' ? '10' : '5.00'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
              />
            </div>
            
            {/* Quick Presets for Percentage */}
            {type === 'PERCENTAGE' && (
              <div className="flex gap-2 mt-3">
                {[10, 15, 20, 50].map(pct => (
                  <button
                    key={pct}
                    onClick={() => setValue(pct.toString())}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-md text-xs font-medium text-gray-600 transition-colors"
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleApply} fullWidth size="lg">
            Apply Discount
          </Button>
        </div>
      </div>
    </div>
  );
};