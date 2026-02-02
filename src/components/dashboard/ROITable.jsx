import React from 'react';
import { Target } from 'lucide-react';

const ROITable = ({ marketingStats, isSuperAdmin, isAdmin }) => {
    if (!isSuperAdmin && !isAdmin) return null;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><Target className="w-6 h-6 text-blue-600"/> 廣告渠道效率評估</h2>
                <p className="text-sm text-gray-500 mt-1">只計算「買方/承租方」。留電率 = 有效留電(洽談) / 總來客數(含未留電)。</p>
            </div>
            <div className="p-0 overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b dark:border-slate-700"><tr><th className="p-4 rounded-l-lg">廣告來源</th><th className="p-4">總來客 (Inquiries)</th><th className="p-4">有效留電 (Leads)</th><th className="p-4">留電率 (Rate)</th><th className="p-4 rounded-r-lg text-right">效率評級</th></tr></thead>
                    <tbody className="divide-y dark:divide-slate-800">
                        {Object.entries(marketingStats).sort((a,b) => b[1].newLeads - a[1].newLeads).map(([source, data]) => (
                            <tr key={source} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="p-4 font-bold text-gray-800 dark:text-white">{source}</td><td className="p-4 font-mono text-gray-600 dark:text-gray-400">{data.newLeads}</td><td className="p-4 font-mono text-blue-600 font-bold">{data.activeLeads}</td><td className="p-4 font-mono font-bold">{(data.conversionRate * 100).toFixed(1)}%</td>
                                <td className="p-4 text-right"><div className="flex flex-col items-end"><span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${data.efficiency.bg} ${data.efficiency.color}`}>{data.efficiency.label}</span><span className="text-[10px] text-gray-400 mt-1">{data.efficiency.desc}</span></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ROITable;