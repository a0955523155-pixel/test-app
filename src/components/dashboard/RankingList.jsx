import React from 'react';
import { Award } from 'lucide-react';

const RankingList = ({ agents }) => {
    return (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2"><Award className="w-5 h-5"/> 業務排行榜</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                {agents.map((agent, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-black ${idx < 3 ? 'bg-yellow-400 text-yellow-900 shadow-yellow-400/50 shadow-md' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div>
                            <span className="font-bold">{agent.name}</span>
                        </div>
                        <div className="font-mono font-bold text-blue-600">${agent.commission.toLocaleString()}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RankingList;