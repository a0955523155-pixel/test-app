import React from 'react';
import { LayoutGrid, MapPin, Plus, Trash2, Megaphone, Edit2, ChevronRight } from 'lucide-react';

const ProjectsPanel = ({ 
    companyProjects, 
    projectAds, 
    newRegionName, setNewRegionName, 
    newProjectNames, setNewProjectNames, 
    onAddRegion, onDeleteRegion, 
    onAddProject, onDeleteProject, 
    // 關鍵：這裡要接收 onManageAd
    onManageAd 
}) => {
    
    // 簡易的區域輸入處理
    const handleRegionInputChange = (e) => setNewRegionName(e.target.value);
    
    // 簡易的專案名稱輸入處理 (針對特定區域)
    const handleProjectInputChange = (region, value) => {
        setNewProjectNames(prev => ({ ...prev, [region]: value }));
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 新增區域區塊 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 flex gap-3 items-center">
                <MapPin className="w-5 h-5 text-blue-500" />
                <input 
                    type="text" 
                    placeholder="新增區域名稱..." 
                    value={newRegionName}
                    onChange={handleRegionInputChange}
                    className="flex-1 bg-transparent outline-none font-bold dark:text-white"
                />
                <button onClick={onAddRegion} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition">
                    新增區域
                </button>
            </div>

            {/* 區域與案件列表 */}
            <div className="grid grid-cols-1 gap-6">
                {Object.entries(companyProjects || {}).map(([region, projects]) => (
                    <div key={region} className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 overflow-hidden">
                        {/* 區域標題列 */}
                        <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-black text-lg text-gray-700 dark:text-white flex items-center gap-2">
                                <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                                {region}
                            </h3>
                            <button 
                                onClick={() => onDeleteRegion(region)}
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full transition"
                                title="刪除整區"
                            >
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>

                        <div className="p-6">
                            {/* 案件列表 */}
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
                                {projects.map((project, idx) => (
                                    <div key={idx} className="bg-white dark:bg-slate-700 border dark:border-slate-600 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all group relative">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-800 dark:text-white text-lg">{project}</h4>
                                            <button 
                                                onClick={() => onDeleteProject(region, project)}
                                                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-lg transition-all"
                                            >
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>

                                        {/* 廣告顯示區塊 */}
                                        <div className="space-y-2">
                                            <div className="text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
                                                <span>廣告投放</span>
                                                {/* 新增廣告按鈕 */}
                                                <button 
                                                    onClick={() => onManageAd(project, null)} 
                                                    className="text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-md text-xs transition-colors"
                                                >
                                                    + 新增
                                                </button>
                                            </div>
                                            
                                            <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                                {projectAds[project] && projectAds[project].length > 0 ? (
                                                    projectAds[project].map((ad) => (
                                                        <div 
                                                            key={ad.id} 
                                                            onClick={() => onManageAd(project, ad)}
                                                            className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-600 cursor-pointer hover:border-blue-300 dark:hover:border-blue-500 transition-colors group/ad"
                                                        >
                                                            <div className="flex items-center gap-2 overflow-hidden">
                                                                <span className={`w-1.5 h-1.5 rounded-full ${new Date(ad.endDate) < new Date() ? 'bg-red-500' : 'bg-green-500'}`}></span>
                                                                <span className="text-sm font-medium text-gray-600 dark:text-gray-300 truncate">{ad.name}</span>
                                                            </div>
                                                            <Edit2 className="w-3 h-3 text-gray-300 group-hover/ad:text-blue-500"/>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-xs text-gray-400 italic py-2 text-center bg-gray-50 dark:bg-slate-800 rounded-lg">
                                                        尚無廣告紀錄
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* 新增案件輸入框 */}
                            <div className="flex gap-2 items-center bg-gray-50 dark:bg-slate-800 p-1.5 rounded-xl border border-dashed border-gray-300 dark:border-slate-600">
                                <Plus className="w-5 h-5 text-gray-400 ml-2"/>
                                <input 
                                    type="text" 
                                    placeholder={`在 ${region} 新增案件...`}
                                    value={newProjectNames[region] || ''}
                                    onChange={(e) => handleProjectInputChange(region, e.target.value)}
                                    className="flex-1 bg-transparent outline-none text-sm font-bold text-gray-600 dark:text-gray-300 py-1.5"
                                    onKeyDown={(e) => e.key === 'Enter' && onAddProject(region)}
                                />
                                <button 
                                    onClick={() => onAddProject(region)}
                                    className="px-4 py-1.5 bg-gray-200 dark:bg-slate-700 text-gray-600 dark:text-gray-300 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition-all"
                                >
                                    新增
                                </button>
                            </div>
                        </div>
                    </div>
                ))}

                {(!companyProjects || Object.keys(companyProjects).length === 0) && (
                    <div className="text-center py-12 text-gray-400 bg-gray-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-gray-200 dark:border-slate-700">
                        <LayoutGrid className="w-12 h-12 mx-auto mb-3 opacity-20"/>
                        <p>尚無區域與案件資料，請先新增區域。</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectsPanel;