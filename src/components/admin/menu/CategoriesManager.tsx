import React, { useState } from 'react';
import { useData } from '../../../context/DataContext';
import { dataService } from '../../../services/dataService';
import { Button } from '../../ui/Button';
import { Edit2, Trash2, Plus, GripVertical } from 'lucide-react';
import { Category } from '../../../types';
import { CategoryFormModal } from './modals/CategoryFormModal';

export const CategoriesManager: React.FC = () => {
    const { categories, refreshData } = useData();
    const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
    const [draggedCategoryIndex, setDraggedCategoryIndex] = useState<number | null>(null);

    const handleSaveCategory = async (formData: Partial<Category>) => {
        const newCat = {
            ...formData,
            id: formData.id || crypto.randomUUID(),
            sortOrder: formData.sortOrder ?? categories.length,
            icon: formData.icon || '',
            ticketPriority: formData.ticketPriority || 0
        } as Category;
        
        await dataService.saveCategories([newCat]);
        await refreshData();
        setEditingCategory(null);
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm("Delete this category? Items in this category will remain but may be hidden.")) return;
        await dataService.deleteCategory(id);
        await refreshData();
    };

    // Drag and Drop Handlers
    const onDragStart = (index: number) => setDraggedCategoryIndex(index);
    const onDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault(); // Necessary to allow dropping
    };
    
    const onDrop = async (dropIndex: number) => {
        if (draggedCategoryIndex === null || draggedCategoryIndex === dropIndex) return;
        
        const newCats = [...categories];
        const [movedItem] = newCats.splice(draggedCategoryIndex, 1);
        newCats.splice(dropIndex, 0, movedItem);
        
        // Reassign sortOrder based on new index
        const updatedCats = newCats.map((cat, idx) => ({ ...cat, sortOrder: idx }));
        
        // Optimistic UI update could happen here, but we'll wait for server
        await dataService.saveCategories(updatedCats);
        await refreshData();
        setDraggedCategoryIndex(null);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Categories</h3>
                <Button onClick={() => setEditingCategory({ sortOrder: categories.length })} className="flex gap-2">
                    <Plus size={16}/> New Category
                </Button>
            </div>

            {editingCategory && (
                <CategoryFormModal 
                    category={editingCategory} 
                    onClose={() => setEditingCategory(null)} 
                    onSave={handleSaveCategory} 
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 w-16 text-gray-700 dark:text-gray-300">Sort</th>
                            <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Category Name</th>
                            <th className="px-4 py-3 text-gray-700 dark:text-gray-300">Ticket Priority</th>
                            <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {categories.map((cat, idx) => (
                            <tr 
                                key={cat.id} 
                                draggable
                                onDragStart={() => onDragStart(idx)}
                                onDragOver={(e) => onDragOver(e, idx)}
                                onDrop={() => onDrop(idx)}
                                className={`
                                    hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-move
                                    ${draggedCategoryIndex === idx ? 'opacity-50 bg-blue-50 dark:bg-blue-900/20' : ''}
                                `}
                            >
                                <td className="px-4 py-3 font-medium text-gray-500 dark:text-gray-400">
                                    <GripVertical size={16} className="text-gray-400 cursor-grab active:cursor-grabbing" />
                                </td>
                                <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">{cat.name}</td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{cat.ticketPriority ?? '-'}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditingCategory(cat)} className="text-blue-600 dark:text-blue-400 mr-2 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => handleDelete(cat.id)} className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {categories.length === 0 && (
                    <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                        No categories found. Create one to get started.
                    </div>
                )}
            </div>
        </div>
    );
};