import React, { useState } from 'react';
import { 
    LayoutGrid, Plus, Trash2, MapPin, Megaphone, 
    ChevronDown, ChevronUp, Calendar, DollarSign, Edit2, ExternalLink 
} from 'lucide-react';

const ProjectsPanel = ({ 
    companyProjects, projectAds,
    newRegionName, setNewRegionName,
    newProjectNames, setNewProjectNames,
    onAddRegion, onDeleteRegion,
    onAddProject, onDeleteProject,
    onManageAd, // 這是開啟新增 Modal 的函式
    triggerDeleteAd // 這是刪除單一廣告的函式
}) => {
    
    // 控制哪些案場的廣告列表是展開的
    const [expandedProjects, setExpandedProjects] = useState({});

    const toggleExpand = (projectName) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectName]: !prev[projectName]
        }));
    };

    // 計算剩餘天數 (用於顯示狀態)
    const getAdStatus = (end) => {
        if (!end) return { text: '進行中', color: 'text-green-600 bg-green-100' };
        const diff = Math.ceil((new Date(end) - new Date()) / (1000 * 60 * 60 * 24));
        if (diff < 0) return { text: '已結束', color: 'text-gray-500 bg-gray-100' };
        if (diff <= 3) return { text: `剩 ${diff} 天`, color: 'text-red-600 bg-red-100' };
        return { text: '進行中', color: 'text-blue-600 bg-blue-100' };
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. 新增區域 (Region) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-blue-500"/> 區域管理
                </h3>
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={newRegionName} 
                        onChange={(e) => setNewRegionName(e.target.value)}
                        placeholder="新增區域 (如: 三民區)" 
                        className="flex-1 px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && onAddRegion()}
                    />
                    <button onClick={onAddRegion} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors">
                        <Plus className="w-5 h-5"/>
                    </button>
                </div>
            </div>

            {/* 2. 區域與案場列表 */}
            {Object.entries(companyProjects).map(([region, projects]) => (
                <div key={region} className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-6 border-b dark:border-slate-800 pb-4">
                        <h3 className="font-black text-xl text-gray-800 dark:text-white flex items-center gap-2">
                            <MapPin className="w-6 h-6 text-orange-500"/> {region}
                        </h3>
                        <button 
                            onClick={() => { if(confirm(`確定刪除區域「${region}」及其所有案場嗎？`)) onDeleteRegion(region); }}
                            className="text-gray-400 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors"
                        >
                            <Trash2 className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* 新增案場 */}
                    <div className="flex gap-2 mb-6">
                        <input 
                            type="text" 
                            value={newProjectNames[region] || ''} 
                            onChange={(e) => setNewProjectNames({ ...newProjectNames, [region]: e.target.value })}
                            placeholder={`在 ${region} 新增案場...`} 
                            className="flex-1 px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                            onKeyDown={(e) => e.key === 'Enter' && onAddProject(region)}
                        />
                        <button onClick={() => onAddProject(region)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors">
                            <Plus className="w-5 h-5"/>
                        </button>
                    </div>

                    {/* 案場卡片 Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {projects.map((project, idx) => {
                            // 取得該案場的廣告列表
                            const ads = projectAds[project] || [];
                            // 處理舊資料格式 (如果是字串陣列)
                            const normalizedAds = ads.map(ad => typeof ad === 'string' ? { id: Math.random(), name: ad, startDate: '', endDate: '', cost: '' } : ad);
                            const isExpanded = expandedProjects[project];

                            return (
                                <div key={idx} className="border dark:border-slate-700 rounded-2xl p-5 hover:shadow-lg transition-shadow bg-gray-50 dark:bg-slate-800/50 flex flex-col">
                                    {/* 案場標題列 */}
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                                            <LayoutGrid className="w-5 h-5 text-blue-500"/>
                                            {project}
                                        </h4>
                                        <button 
                                            onClick={() => { if(confirm(`確定刪除案場「${project}」嗎？`)) onDeleteProject(region, project); }}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <Trash2 className="w-4 h-4"/>
                                        </button>
                                    </div>

                                    {/* 廣告操作區 */}
                                    <div className="mt-auto space-y-3">
                                        <button 
                                            onClick={() => onManageAd(project, null)} // 開啟新增 Modal
                                            className="w-full py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4"/> 新增廣告投放
                                        </button>

                                        {/* 廣告列表摺疊控制 */}
                                        {normalizedAds.length > 0 && (
                                            <div className="bg-white dark:bg-slate-900 rounded-xl border dark:border-slate-700 overflow-hidden">
                                                <button 
                                                    onClick={() => toggleExpand(project)}
                                                    className="w-full px-4 py-3 flex justify-between items-center text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                                                >
                                                    <span className="flex items-center gap-2">
                                                        <Megaphone className="w-4 h-4 text-orange-500"/>
                                                        廣告紀錄 ({normalizedAds.length})
                                                    </span>
                                                    {isExpanded ? <ChevronUp className="w-4 h-4"/> : <ChevronDown className="w-4 h-4"/>}
                                                </button>

                                                {/* 展開後的詳細列表 */}
                                                {isExpanded && (
                                                    <div className="border-t dark:border-slate-700 max-h-60 overflow-y-auto custom-scrollbar">
                                                        {normalizedAds.map((ad, adIdx) => {
                                                            const status = getAdStatus(ad.endDate);
                                                            return (
                                                                <div key={ad.id || adIdx} className="p-3 border-b dark:border-slate-800 last:border-0 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                                    <div className="flex justify-between items-start mb-1">
                                                                        <span className="font-bold text-gray-800 dark:text-white text-sm">{ad.name}</span>
                                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${status.color}`}>
                                                                            {status.text}
                                                                        </span>
                                                                    </div>
                                                                    
                                                                    <div className="flex flex-wrap gap-y-1 gap-x-3 text-xs text-gray-500 dark:text-gray-400">
                                                                        <div className="flex items-center gap-1">
                                                                            <Calendar className="w-3 h-3"/>
                                                                            {ad.startDate || '?'} ~ {ad.endDate || '至今'}
                                                                        </div>
                                                                        {ad.cost && (
                                                                            <div className="flex items-center gap-1 font-mono text-gray-600 dark:text-gray-300">
                                                                                <DollarSign className="w-3 h-3"/>
                                                                                ${Number(ad.cost).toLocaleString()}
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {ad.note && (
                                                                        <div className="mt-1 text-xs text-gray-400 truncate pl-4 border-l-2 border-gray-200 dark:border-slate-700">
                                                                            {ad.note}
                                                                        </div>
                                                                    )}

                                                                    <div className="flex justify-end gap-2 mt-2">
                                                                        <button 
                                                                            onClick={() => onManageAd(project, ad)} // 編輯
                                                                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                                            title="編輯"
                                                                        >
                                                                            <Edit2 className="w-3 h-3"/>
                                                                        </button>
                                                                        <button 
                                                                            onClick={() => {
                                                                                if(confirm(`確定刪除「${ad.name}」這則廣告嗎？`)) {
                                                                                    triggerDeleteAd(project, ad.id);
                                                                                }
                                                                            }} 
                                                                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                                                                            title="刪除"
                                                                        >
                                                                            <Trash2 className="w-3 h-3"/>
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                        {projects.length === 0 && (
                            <div className="col-span-full text-center text-gray-400 py-8 text-sm italic">
                                此區域尚無案場
                            </div>
                        )}
                    </div>
                </div>
            ))}
            
            {Object.keys(companyProjects).length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-gray-300 dark:border-slate-700">
                    <p className="text-gray-400 font-bold">尚未建立任何區域與案場</p>
                    <p className="text-sm text-gray-400 mt-2">請先在上方新增區域，接著即可新增案場與廣告。</p>
                </div>
            )}
        </div>
    );
};

export default ProjectsPanel;