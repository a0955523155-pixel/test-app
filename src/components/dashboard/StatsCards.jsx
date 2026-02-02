import React from 'react';

const StatsCards = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg">
                <div className="text-blue-100 text-sm font-bold mb-1">總業績 (預估)</div>
                <div className="text-3xl font-black">${stats.totalRevenue.toLocaleString()}萬</div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="text-gray-400 text-xs font-bold mb-1">成交件數</div>
                <div className="text-2xl font-black text-gray-800 dark:text-white">{stats.counts.won} <span className="text-sm text-gray-400">件</span></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="text-gray-400 text-xs font-bold mb-1">新增案件</div>
                <div className="text-2xl font-black text-gray-800 dark:text-white">{stats.counts.cases} <span className="text-sm text-gray-400">件</span></div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <div className="text-gray-400 text-xs font-bold mb-1">新增買方</div>
                <div className="text-2xl font-black text-gray-800 dark:text-white">{stats.counts.buyers} <span className="text-sm text-gray-400">位</span></div>
            </div>
        </div>
    );
};

export default StatsCards;