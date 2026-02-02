import React, { useState } from 'react';
import { AlertTriangle, Megaphone, Monitor, FileText, DollarSign, ChevronDown } from 'lucide-react';

const MonitorSection = ({ title, count, icon: Icon, children, defaultOpen = false, colorClass = "text-gray-700" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <div className={`flex items-center gap-2 font-bold ${colorClass}`}><Icon className="w-5 h-5"/>{title}{count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{count}</span>}</div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 rotate-180 transition-transform"/> : <ChevronDown className="w-4 h-4 text-gray-400 transition-transform"/>}
            </button>
            {isOpen && <div className="p-3 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">{children}</div>}
        </div>
    );
};

const MonitorPanel = ({ groupedItems, onResolveAlert }) => {
    return (
        <div className="space-y-2 animate-in fade-in duration-300">
            <MonitorSection title="系統警示" count={groupedItems.alerts.length} icon={AlertTriangle} defaultOpen={true} colorClass="text-red-600">
                {groupedItems.alerts.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無警示</p> : groupedItems.alerts.map(alert => (
                    <div key={alert.id} className="flex justify-between items-start p-3 border-b border-red-100 last:border-0 bg-red-50 dark:bg-red-900/10 rounded mb-1">
                        <div><p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.desc}</p><p className="text-xs text-gray-500">{alert.date}</p></div>
                        <button onClick={() => onResolveAlert(alert.id)} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100">消除</button>
                    </div>
                ))}
            </MonitorSection>
            
            <MonitorSection title="廣告時效 (591/FB...)" count={groupedItems.ads.length} icon={Megaphone} colorClass="text-blue-600">
                {groupedItems.ads.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期廣告</p> : groupedItems.ads.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                        <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div><div className="text-xs text-gray-500">{item.desc}</div></div>
                        <div className="text-right"><div className={`text-sm font-bold ${item.days < 0 ? 'text-red-600' : item.days <= 7 ? 'text-orange-500' : 'text-green-600'}`}>{item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}</div><div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div></div>
                    </div>
                ))}
            </MonitorSection>

            <MonitorSection title="廣告牆時效 (看板)" count={groupedItems.adWalls.length} icon={Monitor} colorClass="text-purple-600">
                {groupedItems.adWalls.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期看板</p> : groupedItems.adWalls.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                         <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div><div className="text-xs text-gray-500">{item.desc}</div></div>
                        <div className="text-right"><div className={`text-sm font-bold ${item.days < 0 ? 'text-red-600' : item.days <= 7 ? 'text-orange-500' : 'text-green-600'}`}>{item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}</div><div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div></div>
                    </div>
                ))}
            </MonitorSection>

            <MonitorSection title="委託及斡旋期限" count={groupedItems.commission.length} icon={FileText} defaultOpen={true} colorClass="text-orange-600">
                {groupedItems.commission.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期項目</p> : groupedItems.commission.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                         <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div><div className="text-xs text-gray-500">{item.desc}</div></div>
                        <div className="text-right"><div className={`text-sm font-bold ${item.days < 0 ? 'text-red-600' : item.days <= 7 ? 'text-orange-500' : 'text-green-600'}`}>{item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}</div><div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div></div>
                    </div>
                ))}
            </MonitorSection>

            <MonitorSection title="代書付款期限" count={groupedItems.payment.length} icon={DollarSign} colorClass="text-green-600">
                {groupedItems.payment.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期款項</p> : groupedItems.payment.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800">
                         <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div><div className="text-xs text-gray-500">{item.desc}</div></div>
                        <div className="text-right"><div className={`text-sm font-bold ${item.days < 0 ? 'text-red-600' : item.days <= 7 ? 'text-orange-500' : 'text-green-600'}`}>{item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}</div><div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div></div>
                    </div>
                ))}
            </MonitorSection>
        </div>
    );
};

export default MonitorPanel;