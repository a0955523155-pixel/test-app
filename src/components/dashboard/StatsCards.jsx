import React from 'react';
import { DollarSign, CheckCircle, Target, Users } from 'lucide-react';

const StatsCards = ({ stats }) => {
    // 防呆處理
    const { totalRevenue = 0, counts = {} } = stats || {};
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* ★★★ 總業績 (元) ★★★ */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-6 h-6"/>
                </div>
                <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 whitespace-nowrap">總業績 (元)</p>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white truncate" title={`NT$ ${Number(totalRevenue).toLocaleString()}`}>
                        NT$ {Number(totalRevenue).toLocaleString()}
                    </h3>
                </div>
            </div>
            
            {/* 總成交數 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6"/>
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">總成交數</p>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white">{counts.won || 0} 件</h3>
                </div>
            </div>

            {/* 新增案件 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Target className="w-6 h-6"/>
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">新增案件 (賣/租)</p>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white">{counts.cases || 0} 件</h3>
                </div>
            </div>

            {/* 新增買方 */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6"/>
                </div>
                <div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400">新增客源 (買方)</p>
                    <h3 className="text-xl font-black text-gray-800 dark:text-white">{counts.buyers || 0} 人</h3>
                </div>
            </div>
        </div>
    );
};

export default StatsCards;