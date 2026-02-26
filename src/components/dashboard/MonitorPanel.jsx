import React from 'react';
import { AlertTriangle, Clock, DollarSign, Megaphone, Monitor, CheckSquare } from 'lucide-react';

const MonitorPanel = ({ groupedItems, onResolveAlert, onQuickUpdate }) => {
    
    // 共用渲染列表函式
    const renderList = (items, type) => {
        if (!items || items.length === 0) {
            return <p className="text-sm text-gray-400 py-4 text-center italic">目前無待辦事項</p>;
        }
        
        return items.map((item, idx) => {
            const isUrgent = item.days <= 3;
            const isExpired = item.days < 0;
            
            return (
                // ★★★ 修正這裡：加上 type 與 idx 確保 Key 絕對唯一 ★★★
                <div key={`${type}-${item.id || ''}-${idx}`} className="flex justify-between items-center p-3 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div>
                        <div className="font-bold text-sm text-gray-800 dark:text-white flex items-center gap-2">
                            {isUrgent && type !== 'alerts' && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse flex-shrink-0"></span>}
                            {item.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">期限: {item.endDate || item.date}</div>
                    </div>
                    <div className="flex items-center gap-3">
                        {type !== 'alerts' && (
                            <span className={`text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap ${isExpired ? 'bg-red-100 text-red-600' : isUrgent ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                {isExpired ? '已過期' : `剩 ${item.days} 天`}
                            </span>
                        )}
                        
                        {/* 勾選完成按鈕 */}
                        <button 
                            onClick={() => {
                                if (type === 'alerts') {
                                    onResolveAlert(item.id);
                                } else {
                                    if (window.confirm(`確定要將「${item.name}」標示為完成/清除嗎？`)) {
                                        onQuickUpdate({ 
                                            id: item.id, 
                                            type: type, 
                                            itemIndex: item.itemIndex,
                                            projectName: item.projectName 
                                        });
                                    }
                                }
                            }} 
                            className="p-1.5 text-gray-400 hover:text-green-500 bg-gray-100 dark:bg-slate-800 hover:bg-green-50 rounded-lg transition-colors cursor-pointer" 
                            title="標示為完成/清除"
                        >
                            <CheckSquare className="w-5 h-5"/>
                        </button>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[400px]">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500"/> 系統警示
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{renderList(groupedItems.alerts, 'alerts')}</div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[400px]">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500"/> 委託到期 (30天內)
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{renderList(groupedItems.commission, 'commission')}</div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[400px]">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-green-500"/> 待收付款 (30天內)
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{renderList(groupedItems.payment, 'payment')}</div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[400px]">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-500"/> 廣告到期 (30天內)
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{renderList(groupedItems.ads, 'ads')}</div>
             </div>
             
             <div className="md:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex flex-col max-h-[400px]">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-purple-500"/> 廣告牆合約到期 (30天內)
                </h3>
                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">{renderList(groupedItems.adWalls, 'adWalls')}</div>
             </div>
        </div>
    );
}

export default MonitorPanel;