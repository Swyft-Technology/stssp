import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { dataService } from '../../../services/dataService';
import { Button } from '../../ui/Button';
import { Edit2, Trash2, Plus, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { MenuItem } from '../../../types';
import { ItemFormModal } from './modals/ItemFormModal';

export const ItemsManager: React.FC = () => {
    // 1. Data Access
    const { menu, categories, toppings, refreshData } = useData();
    
    // 2. Local View State (Sorting & Pagination)
    const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'category' | 'type' | 'pricing', direction: 'asc' | 'desc' } | null>(null);

    // --- SORTING & PAGINATION LOGIC ---
    const handleSort = (key: 'name' | 'category' | 'type' | 'pricing') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedAndPaginatedMenu = useMemo(() => {
        let sorted = [...menu];
        if (sortConfig) {
            sorted.sort((a, b) => {
                let aVal = '';
                let bVal = '';
                switch (sortConfig.key) {
                    case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                    case 'category': aVal = categories.find(c => c.id === a.categoryId)?.name.toLowerCase() || ''; bVal = categories.find(c => c.id === b.categoryId)?.name.toLowerCase() || ''; break;
                    case 'type': aVal = a.itemType; bVal = b.itemType; break;
                    case 'pricing': aVal = a.pricingType; bVal = b.pricingType; break;
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        const start = (currentPage - 1) * itemsPerPage;
        return sorted.slice(start, start + itemsPerPage);
    }, [menu, sortConfig, currentPage, itemsPerPage, categories]);

    const totalPages = Math.ceil(menu.length / itemsPerPage);

    // --- ACTIONS ---
    const handleSaveItem = async (formData: Partial<MenuItem>) => {
        // Sanitize and prepare data
        const itemToSave = {
            ...formData,
            id: formData.id || crypto.randomUUID(),
            available: formData.available ?? true,
            image: formData.image || '',
            pricingType: formData.pricingType || 'FIXED', 
            itemType: formData.itemType || 'SINGLE',
            allowModifiers: formData.itemType === 'BUNDLE' ? false : (formData.allowModifiers ?? false),
            price: formData.pricingType === 'FIXED' ? Number(formData.price) : undefined,
            sizePrices: formData.pricingType === 'SIZE_BASED' ? (formData.sizePrices || {}) : undefined,
            availableSizes: formData.pricingType === 'SIZE_BASED' ? (formData.availableSizes || ['Small', 'Medium', 'Large', 'Family']) : [],
            defaultToppings: formData.defaultToppings || [],
            // Ensure allowedItemIds is saved for bundles
            subItemConfigs: formData.subItemConfigs?.map(c => ({
                ...c,
                allowedItemIds: c.allowedItemIds || [] 
            })) || [],
            requiredSelectionIds: (formData.requiredSelectionIds && formData.requiredSelectionIds.length > 0) ? formData.requiredSelectionIds : undefined,
            requiredSelectionLabel: formData.requiredSelectionLabel || 'Select Option',
            allowHalfHalf: false,
            excludedFromHalfHalf: formData.excludedFromHalfHalf ?? false
        } as MenuItem;

        await dataService.saveMenu([itemToSave]);
        await refreshData();
        setEditingItem(null);
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm("Delete this item?")) return;
        await dataService.deleteMenuItem(id);
        await refreshData();
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Menu Items</h3>
                <Button 
                    onClick={() => setEditingItem({ 
                        pricingType: 'FIXED', 
                        itemType: 'SINGLE', 
                        availableSizes: ['Small', 'Medium', 'Large', 'Family'], 
                        allowModifiers: false,
                        defaultToppings: []
                    })} 
                    className="flex gap-2"
                >
                    <Plus size={16}/> New Item
                </Button>
            </div>

            {/* Render Modal Only When Needed */}
            {editingItem && (
                <ItemFormModal 
                    item={editingItem}
                    categories={categories}
                    menu={menu}
                    toppings={toppings}
                    onClose={() => setEditingItem(null)}
                    onSave={handleSaveItem}
                />
            )}

            {/* Table View */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                                    <div className="flex items-center gap-1">Name <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('category')}>
                                    <div className="flex items-center gap-1">Category <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('type')}>
                                    <div className="flex items-center gap-1">Type <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('pricing')}>
                                    <div className="flex items-center gap-1">Pricing <ArrowUpDown size={14}/></div>
                                </th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {sortedAndPaginatedMenu.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{item.name}</td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {categories.find(c => c.id === item.categoryId)?.name}
                                    </td>
                                    <td className="px-4 py-3 text-xs">
                                        {item.itemType === 'BUNDLE' ? 
                                            <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded">Bundle</span> : 
                                            <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded">Single</span>
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                                        {item.pricingType === 'FIXED' 
                                            ? `$${item.price?.toFixed(2)}` 
                                            : `${item.availableSizes.length} Sizes`
                                        }
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <button 
                                            onClick={() => {
                                                // FIXED LOGIC: Checks for NULL, UNDEFINED, or EMPTY ARRAY
                                                // This ensures the box starts unchecked unless valid options exist.
                                                const itemToEdit = { ...item };
                                                if (!itemToEdit.requiredSelectionIds || itemToEdit.requiredSelectionIds.length === 0) {
                                                    itemToEdit.requiredSelectionIds = undefined;
                                                }
                                                setEditingItem(itemToEdit);
                                            }} 
                                            className="text-blue-600 dark:text-blue-400 mr-3"
                                        >
                                            <Edit2 size={16}/>
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} className="text-red-600 dark:text-red-400">
                                            <Trash2 size={16}/>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Show</span>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="border rounded p-1 text-xs dark:bg-gray-700 dark:border-gray-600"
                        >
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span>entries</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                            Page {currentPage} of {Math.max(1, totalPages)}
                        </span>
                        <button 
                            disabled={currentPage >= totalPages}
                            onClick={() => setCurrentPage(p => p + 1)}
                            className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};