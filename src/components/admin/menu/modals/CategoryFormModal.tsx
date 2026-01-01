import React, { useState } from 'react';
import { Category } from '../../../../types';
import { Button } from '../../../ui/Button';
import { X } from 'lucide-react';

interface CategoryFormModalProps {
    category: Partial<Category> | null;
    onClose: () => void;
    onSave: (category: Partial<Category>) => void;
}

export const CategoryFormModal: React.FC<CategoryFormModalProps> = ({ category, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Category>>(category || {
        name: '',
        ticketPriority: 0,
        sortOrder: 999
    });

    const handleSave = () => {
        if (!formData.name) return;
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">
                        {formData.id ? 'Edit Category' : 'New Category'}
                    </h4>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500">
                        <X size={20}/>
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Category Name</label>
                        <input 
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.name || ''} 
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            placeholder="e.g. Pizzas"
                            autoFocus
                        />
                    </div>
                   
                    <div>
                        <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1">Kitchen Ticket Priority</label>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            Lower numbers appear at the top of the receipt (e.g. 1 for Starters, 10 for Drinks).
                        </p>
                        <input 
                            type="number" 
                            className="w-full border border-gray-300 dark:border-gray-600 p-2 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                            value={formData.ticketPriority || ''} 
                            placeholder="e.g. 1"
                            onChange={e => setFormData({...formData, ticketPriority: parseInt(e.target.value) || 0})} 
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Category</Button>
                </div>
            </div>
        </div>
    );
};