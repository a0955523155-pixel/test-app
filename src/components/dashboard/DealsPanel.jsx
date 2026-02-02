import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import DealForm from '../DealForm'; // 假設 DealForm 在 components 根目錄

const DealsPanel = ({ deals, allUsers, scrivenerOptions, onSave, onDelete }) => {
    const [editingDeal, setEditingDeal] = useState(null);
    const [showDealForm, setShowDealForm] = useState(false);

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            {(showDealForm || editingDeal) && (
                <DealForm 
                    deal={editingDeal} 
                    allUsers={allUsers} 
                    scrivenerOptions={scrivenerOptions} 
                    onSave={(data) => { onSave(data); setShowDealForm(false); setEditingDeal(null); }} 
                    onCancel={() => { setShowDealForm(false); setEditingDeal(null); }} 
                    onDelete={(id) => { onDelete(id); setShowDealForm(false); setEditingDeal(null); }} 
                />
            )}

            <div className="flex justify-end">
                <button onClick={() => setShowDealForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors">
                    <Plus className="w-4 h-4"/> 新增成交報告
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {deals.length === 0 ? <p className="col-span-full text-center py-10 text-gray-400">尚無成交報告</p> : deals.map(deal => (
                    <div key={deal.id} className="p-4 rounded-2xl border cursor-pointer hover:border-blue-400 transition-all bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700" onClick={() => setEditingDeal(deal)}>
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg line-clamp-1 dark:text-white">{deal.caseName || '未命名案件'}</h3>
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{deal.dealDate}</span>
                        </div>
                        <div className="text-sm text-gray-500 mb-2">成交總價: <span className="font-bold text-blue-500">{deal.totalPrice}</span></div>
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>賣: {deal.sellerName}</span>
                            <span>買: {deal.buyerName}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DealsPanel;