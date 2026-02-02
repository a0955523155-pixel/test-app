import React, { useState, useMemo } from 'react';
import { BellRing, X, Eye, CheckCircle, ChevronDown, ChevronRight } from 'lucide-react';

const NotificationModal = ({ notifications, onClose, onQuickUpdate, onView }) => {
    if (!notifications || notifications.length === 0) return null;

    const [expandB, setExpandB] = useState(false);
    const [expandC, setExpandC] = useState(false);

    const processedGroups = useMemo(() => {
        const groups = { A: [], B: [], C: [] };
        notifications.forEach(item => {
            if (item.type === 'contact') {
                if (item.level === 'A') groups.A.push(item);
                else if (item.level === 'B') groups.B.push(item);
                else groups.C.push(item);
            } else {
                groups.A.push(item); // 急件類歸在 A
            }
        });
        const sortItems = (items) => items.sort((a, b) => b.days - a.days);
        return { A: sortItems(groups.A), B: sortItems(groups.B), C: sortItems(groups.C) };
    }, [notifications]);

    const renderItem = (item, idx) => (
        <div key={`${item.id}-${idx}`} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 mb-2 last:mb-0">
            <div>
                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    {item.type === 'contact' ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${item.level==='A'?'bg-red-100 text-red-600':item.level==='B'?'bg-yellow-100 text-yellow-600':'bg-gray-200 text-gray-600'}`}>
                            {item.level || 'C'}級
                        </span>
                    ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-600">急件</span>
                    )}
                    {item.type === 'contact' ? item.reason || '需聯繫' : (item.type === 'commission' ? '委託即將到期' : '代書款項期限')}
                </h4>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-bold">
                    {item.name} <span className="font-normal text-xs">({item.category})</span>
                </div>
                {item.type === 'payment' && <div className="text-xs text-blue-500 font-bold">項目: {item.itemName}</div>}
                
                {item.type === 'contact' ? (
                    <div className="text-xs text-red-500 mt-1 font-bold">上次聯繫：{item.lastDate} (已過 {item.days} 天)</div>
                ) : (
                    <div className="text-xs text-orange-500 mt-1 font-bold">期限：{item.date} (剩 {item.days} 天)</div>
                )}
            </div>
            <div className="flex flex-col gap-2">
                <button onClick={() => onView(item.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                    <Eye className="w-3 h-3"/> 查看
                </button>
                <button onClick={() => { if(confirm("確認標記為完成？")) onQuickUpdate(item); }} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                    <CheckCircle className="w-3 h-3"/> 完成
                </button>
            </div>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500 flex flex-col max-h-[85vh]">
                <div className="bg-red-500 p-4 text-white flex justify-between items-center flex-shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2"><BellRing className="w-6 h-6"/> 待辦與聯繫提醒 ({notifications.length})</h3>
                    <button onClick={onClose} className="p-1 hover:bg-red-600 rounded-full"><X/></button>
                </div>
                <div className="p-4 overflow-y-auto custom-scrollbar flex-1 space-y-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2 pb-1 border-b border-gray-200 dark:border-slate-700"><span className="bg-red-100 text-red-600 font-black px-2 py-0.5 rounded text-sm">A</span><h4 className="font-bold text-gray-700 dark:text-gray-300">重要與 A 級 ({processedGroups.A.length})</h4></div>
                        {processedGroups.A.length > 0 ? (processedGroups.A.map((item, idx) => renderItem(item, idx))) : (<div className="text-center text-gray-400 text-xs py-2">無待辦事項</div>)}
                    </div>
                    {processedGroups.B.length > 0 && (<div><button onClick={() => setExpandB(!expandB)} className="w-full flex justify-between items-center gap-2 mb-2 pb-1 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded px-1 transition-colors"><div className="flex items-center gap-2"><span className="bg-yellow-100 text-yellow-700 font-black px-2 py-0.5 rounded text-sm">B</span><h4 className="font-bold text-gray-700 dark:text-gray-300">B 級客戶 ({processedGroups.B.length})</h4></div>{expandB ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}</button>{expandB && (<div className="animate-in slide-in-from-top-2 fade-in duration-200 pl-1">{processedGroups.B.map((item, idx) => renderItem(item, idx))}</div>)}</div>)}
                    {processedGroups.C.length > 0 && (<div><button onClick={() => setExpandC(!expandC)} className="w-full flex justify-between items-center gap-2 mb-2 pb-1 border-b border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-800 rounded px-1 transition-colors"><div className="flex items-center gap-2"><span className="bg-gray-200 text-gray-600 font-black px-2 py-0.5 rounded text-sm">C</span><h4 className="font-bold text-gray-700 dark:text-gray-300">C 級客戶 ({processedGroups.C.length})</h4></div>{expandC ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}</button>{expandC && (<div className="animate-in slide-in-from-top-2 fade-in duration-200 pl-1">{processedGroups.C.map((item, idx) => renderItem(item, idx))}</div>)}</div>)}
                </div>
            </div>
        </div>
    );
};

export default NotificationModal;