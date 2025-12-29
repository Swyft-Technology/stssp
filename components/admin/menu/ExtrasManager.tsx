import React, { useState, useMemo } from 'react';
import { useData } from '../../../context/DataContext';
import { dataService } from '../../../services/dataService';
import { Button } from '../../ui/Button';
import { Edit2, Trash2, Plus, ArrowUpDown, X, Settings } from 'lucide-react';
import { Topping, PizzaSize } from '../../../types';

export const ExtrasManager: React.FC = () => {
    const { toppings, refreshData } = useData();
    const [editingTopping, setEditingTopping] = useState<Partial<Topping> | null>(null);
    const [sortConfig, setSortConfig] = useState<{ key: 'name' | 'type' | 'price', direction: 'asc' | 'desc' } | null>(null);

    const handleSaveTopping = async (formData: Partial<Topping>) => {
        const newTopping = {
            ...formData,
            id: formData.id || crypto.randomUUID(),
            price: Number(formData.price) || 0,
            available: formData.available ?? true,
            type: formData.type || 'TOPPING',
            availableSizes: formData.availableSizes || [] // Empty array means ALL sizes
        } as Topping;

        await dataService.saveToppings([newTopping]);
        await refreshData();
        setEditingTopping(null);
    };

    const handleDelete = async (id: string) => {
        if(!window.confirm("Delete this extra?")) return;
        await dataService.deleteTopping(id);
        await refreshData();
    };

    const handleSort = (key: 'name' | 'type' | 'price') => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedExtras = useMemo(() => {
        let sorted = [...toppings];
        if (sortConfig) {
            sorted.sort((a, b) => {
                let aVal: any = '';
                let bVal: any = '';
                switch (sortConfig.key) {
                    case 'name': aVal = a.name.toLowerCase(); bVal = b.name.toLowerCase(); break;
                    case 'type': aVal = a.type; bVal = b.type; break;
                    case 'price': aVal = a.price; bVal = b.price; break;
                }
                if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
                if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
                return 0;
            });
        }
        return sorted;
    }, [toppings, sortConfig]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Extras / Options</h3>
                <Button onClick={() => setEditingTopping({ type: 'TOPPING', available: true, availableSizes: [] })} className="flex gap-2">
                    <Plus size={16}/> New Extra
                </Button>
            </div>

            {editingTopping && (
                <ExtraFormModal 
                    topping={editingTopping} 
                    onClose={() => setEditingTopping(null)} 
                    onSave={handleSaveTopping} 
                />
            )}

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1">Name <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('type')}>
                                <div className="flex items-center gap-1">Type <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700" onClick={() => handleSort('price')}>
                                <div className="flex items-center gap-1">Price <ArrowUpDown size={14}/></div>
                            </th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {sortedExtras.map(t => (
                            <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{t.name}</td>
                                <td className="px-4 py-3">
                                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                                        t.type === 'TOPPING' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                                        t.type === 'SAUCE_OPTION' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                                        'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                    }`}>
                                        {t.type.replace('_', ' ')}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">+${t.price.toFixed(2)}</td>
                                <td className="px-4 py-3 text-right">
                                    <button onClick={() => setEditingTopping(t)} className="text-blue-600 dark:text-blue-400 mr-2 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded">
                                        <Edit2 size={16}/>
                                    </button>
                                    <button onClick={() => handleDelete(t.id)} className="text-red-600 dark:text-red-400 p-1 hover:bg-red-50 dark:hover:bg-red-900/30 rounded">
                                        <Trash2 size={16}/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// --- INTERNAL MODAL COMPONENT ---
interface ExtraFormModalProps {
    topping: Partial<Topping>;
    onClose: () => void;
    onSave: (t: Partial<Topping>) => void;
}

const ExtraFormModal: React.FC<ExtraFormModalProps> = ({ topping, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<Topping>>(topping);

    const handleSave = () => {
        if (!formData.name) return;
        onSave(formData);
    };

    const inputClass = "w-full border p-2 rounded bg-white text-gray-900 border-gray-300 dark:bg-gray-700 dark:text-white dark:border-gray-600 focus:ring-2 focus:ring-blue-500 outline-none";
    const labelClass = "block text-sm text-gray-600 dark:text-gray-300 mb-1";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800 rounded-t-xl">
                    <h4 className="font-bold text-lg text-gray-900 dark:text-white">{formData.id ? 'Edit Extra' : 'New Extra'}</h4>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full text-gray-500"><X size={20}/></button>
                </div>

                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className={labelClass}>Name</label>
                        <input className={inputClass} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus />
                    </div>
                    <div>
                        <label className={labelClass}>Type</label>
                        <select className={inputClass} value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                            <option value="TOPPING">Topping</option>
                            <option value="BASE_OPTION">Base Option</option>
                            <option value="SAUCE_OPTION">Sauce Option</option>
                            <option value="OPTION">Generic Option</option>
                            {/* REMOVED SIDE CHOICE OPTION HERE */}
                        </select>
                    </div>
                    <div>
                        <label className={labelClass}>Extra Price ($)</label>
                        <input type="number" className={inputClass} value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
                    </div>

                    <div className="md:col-span-3 mt-4 border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/10 rounded-lg p-4">
                        <h4 className="text-sm font-bold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                            <Settings size={16} /> Size Availability Restrictions
                        </h4>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mb-4 leading-relaxed">
                            By default, this extra is available for <strong>ALL</strong> sizes. 
                            <br/>Select specific sizes below ONLY if you want to RESTRICT availability (e.g., Gluten Free Base only on Medium).
                        </p>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['Small', 'Medium', 'Large', 'Family'].map(size => {
                                const isChecked = formData.availableSizes?.includes(size as PizzaSize);
                                return (
                                    <label key={size} className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border transition-all ${isChecked ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-blue-400'}`}>
                                        <input 
                                            type="checkbox" 
                                            checked={isChecked}
                                            onChange={e => {
                                                const current = formData.availableSizes || [];
                                                if(e.target.checked) setFormData({...formData, availableSizes: [...current, size as PizzaSize]});
                                                else setFormData({...formData, availableSizes: current.filter(s => s !== size)});
                                            }}
                                            className="w-4 h-4 accent-white"
                                        />
                                        <span className="font-medium text-sm">{size}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <div className="mt-2 text-right">
                             <button 
                                onClick={() => setFormData({...formData, availableSizes: []})}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                             >
                                Clear All (Available on All Sizes)
                             </button>
                         </div>
                    </div>
                </div>

                <div className="flex justify-end gap-2 p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-xl">
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button onClick={handleSave}>Save Extra</Button>
                </div>
            </div>
        </div>
    );
};