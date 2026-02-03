import React, { useMemo } from 'react';
import { TrendingUp, Users, DollarSign, Activity, Calculator, ThumbsUp } from 'lucide-react';

const ROW_STYLES = [
    { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-500' },
    { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'text-emerald-500' },
    { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-500' },
    { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-500' },
    { bg: 'bg-rose-50', text: 'text-rose-700', icon: 'text-rose-500' },
    { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-500' },
    { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-500' },
    { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-500' },
];

// 輔助函式：取得目前篩選的時間範圍 (開始時間, 結束時間)
const getFilterRange = (timeFrame, year, month, weekStr) => {
    const now = new Date();
    let start = new Date(0); // 預設很久以前
    let end = new Date(2999, 11, 31); // 預設很久以後

    if (timeFrame === 'month') {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59); // 該月最後一天
    } else if (timeFrame === 'year') {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59);
    } else if (timeFrame === 'week' && weekStr) {
        // 解析週次字串 "2023-W42"
        const [wYear, wWeek] = weekStr.split('-W');
        if (wYear && wWeek) {
            const simple = new Date(wYear, 0, 1 + (wWeek - 1) * 7);
            const dayOfWeek = simple.getDay();
            const weekStart = simple;
            if (dayOfWeek <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
            else weekStart.setDate(simple.getDate() + 8 - simple.getDay());
            start = weekStart;
            end = new Date(weekStart);
            end.setDate(end.getDate() + 6);
        }
    }
    // 'all' 則保持預設的最大範圍
    return { filterStart: start, filterEnd: end };
};

const ROITable = ({ marketingStats, projectAds, isSuperAdmin, isAdmin, dashTimeFrame, statYear, statMonth, statWeek }) => {
    
    // ★★★ 核心邏輯：整合廣告費用與客源數據 ★★★
    const processedData = useMemo(() => {
        const safeStats = marketingStats || {};
        const safeAds = projectAds || {};

        // 1. 取得當前 Dashboard 篩選的時間區間
        const { filterStart, filterEnd } = getFilterRange(dashTimeFrame, statYear, statMonth, statWeek);

        // 2. 計算每個渠道的總廣告花費 (只計算在時間範圍內的)
        const costMap = {};
        
        Object.values(safeAds).forEach(adList => {
            if (Array.isArray(adList)) {
                adList.forEach(ad => {
                    // 取得廣告的開始與結束日期
                    const adStart = new Date(ad.startDate);
                    const adEnd = ad.endDate ? new Date(ad.endDate) : new Date(); // 若無結束日，視為進行中(直到今天)

                    // ★★★ 關鍵判斷：檢查日期是否重疊 (Overlap Check) ★★★
                    // 邏輯：(廣告開始 <= 篩選結束) AND (廣告結束 >= 篩選開始)
                    const isOverlapping = adStart <= filterEnd && adEnd >= filterStart;

                    if (isOverlapping) {
                        const sourceName = (typeof ad === 'string' ? ad : ad.name).trim();
                        const cost = parseFloat((ad.cost || '0').toString().replace(/,/g, '')) || 0;
                        
                        if (!costMap[sourceName]) costMap[sourceName] = 0;
                        costMap[sourceName] += cost;
                    }
                });
            }
        });

        // 3. 合併數據
        const allSources = new Set([...Object.keys(safeStats), ...Object.keys(costMap)]);
        
        const finalData = Array.from(allSources).map(source => {
            const stat = safeStats[source] || { newLeads: 0, deals: 0 };
            const cost = costMap[source] || 0;
            
            // 計算單筆獲客成本 (Cost Per Lead)
            let cpl = 0;
            let efficiencyType = 'normal'; 

            if (cost === 0 && stat.newLeads > 0) {
                efficiencyType = 'free_win'; // 免費獲客
            } else if (cost > 0 && stat.newLeads === 0) {
                efficiencyType = 'ineffective'; // 有花錢沒客人
            } else if (stat.newLeads > 0) {
                cpl = cost / stat.newLeads;
            }

            return {
                name: source,
                newLeads: stat.newLeads, 
                deals: stat.deals,       
                cost: cost,              
                cpl: cpl,                
                efficiencyType,          
            };
        });

        // 排序：優先顯示有留電的
        return finalData.sort((a, b) => b.newLeads - a.newLeads || b.cost - a.cost);

    }, [marketingStats, projectAds, dashTimeFrame, statYear, statMonth, statWeek]); // 加入時間依賴

    if (processedData.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 text-center py-12">
                <div className="bg-gray-50 dark:bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Activity className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-500 dark:text-gray-400 font-bold">尚無渠道數據</h3>
                <p className="text-sm text-gray-400 mt-1">
                    {dashTimeFrame === 'month' ? '本月' : '此時段'}尚無廣告支出或客源紀錄。
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-500"/> 渠道效益評估 (廣告 / 留電)
            </h3>
            
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    <thead>
                        <tr className="border-b dark:border-slate-700">
                            <th className="text-left py-3 px-4 text-sm font-bold text-gray-500 dark:text-gray-400">廣告/客源渠道</th>
                            {(isSuperAdmin || isAdmin) && (
                                <th className="text-right py-3 px-4 text-sm font-bold text-gray-500 dark:text-gray-400">
                                    廣告花費
                                    <span className="text-xs font-normal block text-gray-400">
                                        ({dashTimeFrame === 'month' ? `${statMonth}月` : dashTimeFrame === 'year' ? `${statYear}年` : '全部'})
                                    </span>
                                </th>
                            )}
                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-500 dark:text-gray-400">留電數 (新客)</th>
                            {(isSuperAdmin || isAdmin) && (
                                <th className="text-right py-3 px-4 text-sm font-bold text-gray-500 dark:text-gray-400">獲客成本 (CPL)</th>
                            )}
                            <th className="text-right py-3 px-4 text-sm font-bold text-gray-500 dark:text-gray-400">成交轉化</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.map((row, index) => {
                            const style = ROW_STYLES[index % ROW_STYLES.length];
                            
                            return (
                                <tr key={row.name || index} className="group hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${style.bg} ${style.icon} font-bold text-xs`}>
                                                {index + 1}
                                            </span>
                                            <span className="font-bold text-gray-700 dark:text-gray-200">{row.name}</span>
                                        </div>
                                    </td>

                                    {(isSuperAdmin || isAdmin) && (
                                        <td className="text-right py-3 px-4">
                                            <span className="font-mono font-bold text-gray-600 dark:text-gray-300">
                                                ${row.cost.toLocaleString()}
                                            </span>
                                        </td>
                                    )}

                                    <td className="text-right py-3 px-4">
                                        <div className="inline-flex items-center gap-1 bg-blue-50 dark:bg-slate-700 px-3 py-1 rounded-full text-sm font-bold text-blue-600 dark:text-blue-300">
                                            <Users className="w-3 h-3"/> {row.newLeads} 位
                                        </div>
                                    </td>

                                    {(isSuperAdmin || isAdmin) && (
                                        <td className="text-right py-3 px-4">
                                            {row.efficiencyType === 'free_win' ? (
                                                <div className="flex items-center justify-end gap-1 text-emerald-600 font-bold">
                                                    <ThumbsUp className="w-4 h-4"/>
                                                    <span>免費獲客</span>
                                                </div>
                                            ) : row.efficiencyType === 'ineffective' ? (
                                                <span className="text-xs font-bold text-red-400 bg-red-50 px-2 py-1 rounded">
                                                    無效支出
                                                </span>
                                            ) : (
                                                <div className="flex items-center justify-end gap-1">
                                                    <span className="text-xs text-gray-400">單客</span>
                                                    <span className={`font-bold ${row.cpl > 1000 ? 'text-orange-500' : 'text-gray-700 dark:text-gray-300'}`}>
                                                        ${Math.round(row.cpl).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </td>
                                    )}

                                    <td className="text-right py-3 px-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <span className="font-bold text-gray-800 dark:text-white">{row.deals} 件</span>
                                            {row.newLeads > 0 && (
                                                <span className="text-xs text-gray-400">
                                                    ({((row.deals / row.newLeads) * 100).toFixed(0)}%)
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            <div className="mt-4 px-4 pb-2 text-xs text-gray-400 text-center flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> 免費獲客 = 0成本但有客戶</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> 無效支出 = 有花錢但無客戶</span>
            </div>
        </div>
    );
};

export default ROITable;