import React, { useMemo, useState } from 'react';
import { 
  Download, Loader2, ChevronDown, Sun, Moon, LogOut, Activity, MonitorPlay, Sliders, 
  Megaphone, Calendar, Edit, Trash2, Plus, GripVertical, XCircle, Settings, FolderPlus, 
  Folder, UserCog, Ban, Briefcase, CheckCircle, BarChart3, UserCircle, EyeOff
} from 'lucide-react';
import { FileText as ReportIcon } from 'lucide-react';
import DealDashboard from './DealDashboard'; 
import { getAdStatus } from '../utils/helpers';

// --- 子元件：廣告看板 ---
const AdDashboard = ({ companyProjects, projectAds, darkMode, onManageAd, onEditAd, onDeleteAd }) => {
    const allProjectCards = useMemo(() => {
        const cards = [];
        if (!companyProjects) return cards;
        Object.entries(companyProjects).forEach(([region, projectList]) => {
            if (Array.isArray(projectList)) {
                projectList.forEach(project => {
                    const ads = projectAds?.[project] || [];
                    cards.push({ region, project, ads });
                });
            }
        });
        return cards;
    }, [companyProjects, projectAds]);

    const now = useMemo(() => new Date(), []);

    return (
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600"><Megaphone className="w-5 h-5"/> 各案場廣告動態</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allProjectCards.map(({ region, project, ads }) => (
                    <div key={project} className={`p-4 rounded-xl border h-fit flex flex-col ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100 shadow-sm'}`}>
                        <div className="flex justify-between items-center mb-3 border-b border-gray-100 dark:border-slate-700 pb-2">
                            <div>
                                <span className="text-[10px] text-gray-400 block mb-0.5">{region}</span>
                                <h5 className="font-bold text-base flex items-center gap-2">{project}</h5>
                            </div>
                            <button onClick={() => onManageAd(project)} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors cursor-pointer">管理</button>
                        </div>
                        <div className="space-y-3 flex-1">
                            {ads.length === 0 ? (
                                <div className="text-center py-4 opacity-40 text-xs">尚無廣告</div>
                            ) : (
                                ads.map((ad, idx) => {
                                    const adObj = typeof ad === 'string' ? { id: `legacy-${idx}`, name: ad, startDate: '', endDate: '' } : ad;
                                    const { daysLeft, percent, status } = getAdStatus(adObj.startDate, adObj.endDate, now);
                                    let statusColor = 'bg-gray-200';
                                    if (status === 'active') statusColor = 'bg-green-500';
                                    else if (status === 'warning') statusColor = 'bg-yellow-500';
                                    else if (status === 'expired') statusColor = 'bg-red-500';

                                    return (
                                        <div key={adObj.id || idx} className="bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg text-sm group">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <span className="font-bold block">{adObj.name}</span>
                                                    <span className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar className="w-3 h-3"/> {adObj.startDate || '-'} ~ {adObj.endDate || '-'}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    {daysLeft !== null ? <div className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${status === 'active' ? 'bg-green-100 text-green-700' : status === 'warning' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{daysLeft < 0 ? '過期' : `${daysLeft}天`}</div> : <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">無</span>}
                                                    <div className="flex gap-2 mt-1">
                                                        <button onClick={(e) => { e.stopPropagation(); onEditAd(ad, project); }} className="hover:scale-110 transition-transform cursor-pointer p-1"><Edit className="w-3.5 h-3.5 text-blue-500"/></button>
                                                        <button onClick={(e) => { e.stopPropagation(); onDeleteAd(ad, project); }} className="hover:scale-110 transition-transform cursor-pointer p-1"><Trash2 className="w-3.5 h-3.5 text-red-500"/></button>
                                                    </div>
                                                </div>
                                            </div>
                                            {daysLeft !== null && <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden mt-1"><div className={`h-full ${statusColor} transition-all duration-500`} style={{ width: `${percent}%` }}></div></div>}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {allProjectCards.length === 0 && <div className="text-center py-10 opacity-50"><Megaphone className="w-12 h-12 mx-auto mb-2 text-gray-400"/><p>尚無任何案場設定</p></div>}
        </div>
    );
};

// --- 子元件：設定卡片 ---
const SettingsCard = ({ label, options, type, darkMode, onAdd, onDelete, onReorder }) => {
    const [inputValue, setInputValue] = useState('');
    const [draggedItemIndex, setDraggedItemIndex] = useState(null);

    const handleKeyDown = (e) => { if (e.key === 'Enter') { onAdd(type, inputValue); setInputValue(''); } };
    const handleDragStart = (e, index) => { setDraggedItemIndex(index); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', index); e.target.style.opacity = '0.5'; };
    const handleDragOver = (e, index) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; };
    const handleDragEnd = (e) => { e.target.style.opacity = '1'; setDraggedItemIndex(null); };
    const handleDrop = (e, index) => { e.preventDefault(); if (draggedItemIndex === null) return; if (draggedItemIndex !== index) { onReorder(type, draggedItemIndex, index); } };

    return (
        <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-blue-100 shadow-sm'}`}>
            <h4 className="font-bold text-base mb-3 flex items-center gap-2">{label}</h4>
            <div className="flex gap-2 mb-3">
                <input 
                    placeholder="新增選項..." 
                    className={`flex-1 px-2 py-1 rounded border text-sm outline-none notranslate ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoComplete="off"
                />
                <button onClick={() => { onAdd(type, inputValue); setInputValue(''); }} className="bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700 cursor-pointer"><Plus className="w-4 h-4"/></button>
            </div>
            <div className="flex flex-wrap gap-2">
                {options.map((opt, index) => (
                    <div
                        key={`${opt}-${index}`} draggable onDragStart={(e) => handleDragStart(e, index)} onDragOver={(e) => handleDragOver(e, index)} onDrop={(e) => handleDrop(e, index)} onDragEnd={handleDragEnd}
                        className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 border cursor-move transition-all duration-200 ${draggedItemIndex === index ? 'opacity-50 scale-95 border-blue-500' : ''} ${darkMode ? 'bg-slate-700 border-slate-600' : 'bg-gray-50 border-gray-200'}`}
                    >
                        <GripVertical className="w-3 h-3 text-gray-400" />
                        {opt}
                        <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(type, opt); }} className="text-gray-400 hover:text-red-500 ml-1 cursor-pointer p-1"><XCircle className="w-3 h-3"/></button>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- 子元件：設定看板 ---
const SettingsDashboard = ({ appSettings, darkMode, onAddOption, onDeleteOption, onReorderOption }) => {
    const tabs = [{ key: 'sources', label: '客戶來源' }, { key: 'categories', label: '需求分類' }, { key: 'levels', label: '客戶等級' }];
    return (
        <div className="space-y-6">
            <h3 className="font-bold text-lg flex items-center gap-2 text-blue-600"><Sliders className="w-5 h-5"/> 選項管理</h3>
            <p className="text-xs text-gray-500 -mt-4 mb-4">提示：拖曳選項標籤可調整順序，將直接影響新增客戶時的選單排序。</p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tabs.map(tab => (
                    <SettingsCard key={tab.key} label={tab.label} options={appSettings[tab.key]} type={tab.key} darkMode={darkMode} onAdd={onAddOption} onDelete={onDeleteOption} onReorder={onReorderOption} />
                ))}
            </div>
        </div>
    );
};

// --- 子元件：統計看板 (整合跑馬燈管理) ---
const StatsDashboard = ({ 
    dashboardStats, dashTimeFrame, setDashTimeFrame, agentStats, darkMode, 
    isAdmin, isSuperAdmin, companyProjects, projectAds, allUsers, currentUser, 
    newRegionName, setNewRegionName, newProjectNames, setNewProjectNames, 
    onAddRegion, onDeleteRegion, onAddProject, onDeleteProject, 
    onToggleUser, onDeleteUser, onManageAd, 
    statYear, setStatYear, statMonth, setStatMonth,
    // ★★★ 新增接收的 props
    announcement, onSaveAnnouncement 
}) => {
    const currentYear = new Date().getFullYear();
    const [editAnnouncement, setEditAnnouncement] = useState(announcement || "");

    // 當外部 announcement 更新時，同步更新編輯框
    React.useEffect(() => {
        setEditAnnouncement(announcement || "");
    }, [announcement]);

    return (
        <div className="space-y-6">

             {/* ★★★ 系統公告管理卡片 (只有 Super Admin 可見) ★★★ */}
             {isSuperAdmin && (
                <div className={`p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-center justify-between ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-orange-100 shadow-sm'}`}>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className={`p-2 rounded-full ${darkMode ? 'bg-orange-900/30 text-orange-400' : 'bg-orange-100 text-orange-600'}`}>
                            <Megaphone className="w-5 h-5"/>
                        </div>
                        <div>
                            <h4 className="font-bold text-sm">系統跑馬燈設定</h4>
                            <p className="text-xs text-gray-500">設定首頁頂端的歡迎詞 (重新整理後顯示一次)</p>
                        </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto flex-1 max-w-2xl">
                        <input 
                            type="text" 
                            value={editAnnouncement} 
                            onChange={(e) => setEditAnnouncement(e.target.value)}
                            placeholder="輸入公告內容..."
                            className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300'}`} 
                        />
                        <button 
                            onClick={() => onSaveAnnouncement(editAnnouncement)} 
                            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap hover:bg-orange-600 transition-colors cursor-pointer"
                        >
                            更新公告
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-blue-100 shadow-sm'}`}>
                    <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-blue-600"><Settings className="w-5 h-5"/> 案場與分類管理</h3>
                    <div className="space-y-6">
                        <div className="flex gap-2">
                            <input type="text" placeholder="輸入新地區分類" className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={newRegionName} onChange={(e) => setNewRegionName(e.target.value)} />
                            <button onClick={onAddRegion} className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-blue-700 cursor-pointer"><FolderPlus className="w-4 h-4" /> 新增</button>
                        </div>
                        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {Object.entries(companyProjects).map(([region, projectList]) => (
                                <div key={region} className={`rounded-xl border p-4 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-200 dark:border-slate-700">
                                        <h4 className="font-bold flex items-center gap-2 text-sm"><Folder className="w-4 h-4 text-yellow-500" /> {region}</h4>
                                        <button type="button" onClick={() => onDeleteRegion(region)} className="text-gray-400 hover:text-red-500 p-1 cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {projectList.map(project => (
                                            <div key={project} className={`relative group/item flex items-center`}>
                                                <span className={`text-xs px-2 py-1 rounded-md flex items-center gap-1 border ${darkMode ? 'bg-slate-700 text-gray-200 border-slate-600' : 'bg-white text-gray-600 border-gray-200'}`}>
                                                    {project}
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); onManageAd(project); }} className="ml-1 text-blue-400 hover:text-blue-600 cursor-pointer"><Megaphone className="w-3 h-3" /></button>
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteProject(region, project); }} className="text-gray-400 hover:text-red-600 transition-colors ml-1 cursor-pointer"><XCircle className="w-3 h-3" /></button>
                                                </span>
                                            </div>
                                        ))}
                                        {projectList.length === 0 && <span className="text-xs text-gray-400 italic">尚無案場</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <input type="text" placeholder={`新增 ${region} 內的案場...`} className={`flex-1 px-2 py-1 rounded border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={newProjectNames[region] || ''} onChange={(e) => setNewProjectNames({...newProjectNames, [region]: e.target.value})} />
                                        <button onClick={() => onAddProject(region)} className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 cursor-pointer">新增</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {isSuperAdmin && (
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-purple-100 shadow-sm'}`}>
                            <h3 className="font-bold text-lg flex items-center gap-2 mb-4 text-purple-600"><UserCog className="w-5 h-5"/> 公司人員權限管理</h3>
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                                {allUsers.map(u => (
                                    <div key={u.id} className={`flex justify-between items-center p-3 rounded-xl ${darkMode ? 'bg-slate-800' : 'bg-gray-50'}`}>
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${u.role === 'super_admin' ? 'bg-purple-100 text-purple-600' : u.role === 'admin' ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-600'}`}>{u.role === 'super_admin' ? 'S' : u.role === 'admin' ? 'A' : 'U'}</div>
                                            <div><p className="text-sm font-bold">{u.name} <span className="text-[10px] text-gray-500">({u.username})</span></p><p className="text-[10px] text-gray-400">{u.status === 'suspended' ? '已停權' : '正常'}</p></div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => onToggleUser(u)} className="p-2 rounded-lg text-xs font-bold bg-yellow-100 text-yellow-600 cursor-pointer"><Ban className="w-4 h-4"/></button>
                                            <button onClick={() => onDeleteUser(u)} className="p-2 bg-red-100 text-red-600 rounded-lg text-xs font-bold cursor-pointer"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700' : 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-400 text-white'}`}>
                        <div className="flex items-center gap-2 mb-2 opacity-80"><Briefcase className="w-4 h-4" /><span className="text-xs font-bold uppercase tracking-wider">{dashTimeFrame === 'month' ? '本月實收總業績' : dashTimeFrame === 'year' ? '本年度實收總業績' : '歷史實收總業績'}</span></div>
                        
                        {/* 權限控制：只有 Super Admin 能看總金額 */}
                        {isSuperAdmin ? (
                            <p className="text-3xl font-black">NT$ {dashboardStats.totalRevenue.toLocaleString()}</p>
                        ) : (
                            <div className="flex items-center gap-2 text-white/50">
                                <EyeOff className="w-6 h-6"/>
                                <p className="text-3xl font-black">NT$ *****</p>
                            </div>
                        )}

                        <div className="mt-4 flex gap-4 text-xs font-medium opacity-80"><div className="flex items-center gap-1"><UserCircle className="w-3 h-3"/> {dashboardStats.counts.total} 位新客</div><div className="flex items-center gap-1"><CheckCircle className="w-3 h-3"/> {dashboardStats.counts.won} 位成交</div></div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500"/> 各專員實收業績 (依成交報告)</h3>
                    <div className="flex gap-2">
                         <select value={dashTimeFrame} onChange={(e) => setDashTimeFrame(e.target.value)} className={`text-xs px-2 py-1 rounded border outline-none ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`}>
                             <option value="month">月檢視</option>
                             <option value="year">年檢視</option>
                             <option value="all">總累計</option>
                         </select>
                         {dashTimeFrame !== 'all' && (
                             <select value={statYear} onChange={(e) => { setDashTimeFrame(prev => prev); setStatYear(Number(e.target.value)); }} className={`text-xs px-2 py-1 rounded border outline-none ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`}>
                                 {Array.from({length: 5}, (_, i) => currentYear - i).map(y => <option key={y} value={y}>{y}年</option>)}
                             </select>
                         )}
                         {dashTimeFrame === 'month' && (
                             <select value={statMonth} onChange={(e) => { setDashTimeFrame(prev => prev); setStatMonth(Number(e.target.value)); }} className={`text-xs px-2 py-1 rounded border outline-none ${darkMode ? 'bg-slate-800 border-slate-600 text-white' : 'bg-white'}`}>
                                 {Array.from({length: 12}, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
                             </select>
                         )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4"> 
                    {agentStats.map((agent, index) => (
                        <div key={index} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200 shadow-sm'}`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h4 className={`font-bold text-base ${darkMode ? 'text-white' : 'text-gray-900'}`}>{agent.name}</h4>
                                    <p className="text-xs text-gray-500 mt-0.5">總客戶數: {agent.total}</p>
                                </div>
                                {/* 權限控制：只有 Super Admin 能看各別業績 */}
                                {isSuperAdmin && (
                                    <span className="text-sm font-bold text-blue-500 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded">NT$ {(agent.commission || 0).toLocaleString()}</span>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-2 text-center text-[10px]">
                                <div className="bg-blue-50 dark:bg-slate-800 p-1.5 rounded"><div className="text-blue-500 font-bold">{agent.new}</div><div className="text-gray-400 scale-90">新客</div></div>
                                <div className="bg-yellow-50 dark:bg-slate-800 p-1.5 rounded"><div className="text-yellow-600 font-bold">{agent.contacting}</div><div className="text-gray-400 scale-90">接洽</div></div>
                                <div className="bg-purple-50 dark:bg-slate-800 p-1.5 rounded"><div className="text-purple-600 font-bold">{agent.offer}</div><div className="text-gray-400 scale-90">收斡</div></div>
                                <div className="bg-green-50 dark:bg-slate-800 p-1.5 rounded"><div className="text-green-600 font-bold">{agent.closed}</div><div className="text-gray-400 scale-90">成交</div></div>
                                <div className="bg-gray-50 dark:bg-slate-800 p-1.5 rounded"><div className="text-gray-500 font-bold">{agent.lost}</div><div className="text-gray-400 scale-90">海仔</div></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 主元件 ---
const DashboardView = ({
    isAdmin, isSuperAdmin, currentUser, darkMode, toggleDarkMode, handleLogout,
    dashboardStats, dashTimeFrame, setDashTimeFrame, agentStats,
    companyProjects, projectAds, allUsers,
    newRegionName, setNewRegionName, newProjectNames, setNewProjectNames,
    adManageProject, setAdManageProject, adForm, setAdForm, isEditingAd, setIsEditingAd,
    dashboardView, setDashboardView,
    handleExportExcel, isExporting, showExportMenu, setShowExportMenu,
    appSettings,
    onAddRegion, onDeleteRegion, onAddProject, onDeleteProject,
    onToggleUser, onDeleteUser,
    onManageAd, onEditAd, onDeleteAd,
    onAddOption, onDeleteOption, onReorderOption,
    deals, handleSaveDeal, handleDeleteDeal,
    statYear, setStatYear, statMonth, setStatMonth,
    onSaveAd, onEditAdInit, triggerDeleteAd,
    onEditAd: handleEditAdFromDashboard, 
    onDeleteAd: handleDeleteAdFromDashboard,
    // ★★★ 接收新參數 ★★★
    announcement, onSaveAnnouncement 
}) => {

    if (!isAdmin) return <div className="p-10 text-center text-gray-500">無權限</div>;
    return (
      <div className="pb-24 px-6 pt-10 w-full relative">
        <div className="w-full">
            <div className="flex justify-between items-center mb-6 relative z-30">
               <div><h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>數據儀表板</h1><p className="text-xs text-gray-500 mt-1">{isSuperAdmin ? '系統與業績總覽' : '全公司業績總覽'} ({currentUser.companyCode})</p></div>
               <div className="flex gap-2 relative">
                   <button onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity ${darkMode ? 'bg-slate-800 text-white' : 'bg-white text-gray-700 border'}`}>{isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 匯出 <ChevronDown className="w-3 h-3"/></button>
                   {showExportMenu && (
                       <div className={`absolute top-full right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100'}`}>
                           <button onClick={() => handleExportExcel('weekly')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${darkMode ? 'text-white' : 'text-gray-700'}`}>本週會議報表</button>
                           <button onClick={() => handleExportExcel('annual')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${darkMode ? 'text-white' : 'text-gray-700'}`}>年度完整報表</button>
                           <button onClick={() => handleExportExcel('ads')} className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-100 dark:hover:bg-slate-700 ${darkMode ? 'text-white' : 'text-gray-700'}`}>廣告效益報表</button>
                       </div>
                   )}
                   <button onClick={toggleDarkMode} className={`p-2 rounded-full cursor-pointer hover:bg-opacity-80 transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200 text-gray-600'}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                   <button onClick={handleLogout} className={`p-2 rounded-full cursor-pointer hover:bg-opacity-80 transition-colors ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-gray-200 text-gray-600'}`}><LogOut className="w-5 h-5" /></button>
               </div>
            </div>

            <div className="flex space-x-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-lg mb-6 overflow-x-auto relative z-20">
                <button onClick={() => setDashboardView('stats')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${dashboardView === 'stats' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Activity className="w-3 h-3 sm:w-4 sm:h-4"/> 總覽</button>
                <button onClick={() => setDashboardView('deals')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${dashboardView === 'deals' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><ReportIcon className="w-3 h-3 sm:w-4 sm:h-4"/> 成交管理</button>
                <button onClick={() => setDashboardView('ads')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${dashboardView === 'ads' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><MonitorPlay className="w-3 h-3 sm:w-4 sm:h-4"/> 廣告</button>
                <button onClick={() => setDashboardView('settings')} className={`flex-1 py-2 px-1 text-[10px] sm:text-xs font-bold rounded-md flex items-center justify-center gap-1 transition-all ${dashboardView === 'settings' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow-sm' : 'text-gray-500 dark:text-gray-400'}`}><Sliders className="w-3 h-3 sm:w-4 sm:h-4"/> 選項</button>
            </div>

            {dashboardView === 'ads' ? (
                <AdDashboard 
                    companyProjects={companyProjects} 
                    projectAds={projectAds} 
                    darkMode={darkMode} 
                    onManageAd={onManageAd}
                    onEditAd={handleEditAdFromDashboard}
                    onDeleteAd={handleDeleteAdFromDashboard}
                />
            ) : dashboardView === 'settings' ? (
                <SettingsDashboard 
                    appSettings={appSettings} 
                    darkMode={darkMode} 
                    onAddOption={onAddOption}
                    onDeleteOption={onDeleteOption}
                    onReorderOption={onReorderOption}
                />
            ) : dashboardView === 'deals' ? (
                <DealDashboard 
                    deals={deals}
                    allUsers={allUsers}
                    companyProjects={companyProjects}
                    darkMode={darkMode}
                    onSave={handleSaveDeal}
                    onDelete={handleDeleteDeal}
                />
            ) : (
                <StatsDashboard 
                    dashboardStats={dashboardStats}
                    dashTimeFrame={dashTimeFrame}
                    setDashTimeFrame={setDashTimeFrame}
                    agentStats={agentStats}
                    darkMode={darkMode}
                    isAdmin={isAdmin}
                    isSuperAdmin={isSuperAdmin}
                    companyProjects={companyProjects}
                    projectAds={projectAds}
                    allUsers={allUsers}
                    currentUser={currentUser}
                    newRegionName={newRegionName}
                    setNewRegionName={setNewRegionName}
                    newProjectNames={newProjectNames}
                    setNewProjectNames={setNewProjectNames}
                    onAddRegion={onAddRegion}
                    onDeleteRegion={onDeleteRegion}
                    onAddProject={onAddProject}
                    onDeleteProject={onDeleteProject}
                    onToggleUser={onToggleUser}
                    onDeleteUser={onDeleteUser}
                    onManageAd={onManageAd}
                    statYear={statYear}
                    setStatYear={setStatYear}
                    statMonth={statMonth}
                    setStatMonth={setStatMonth}
                    // ★★★ 傳遞新參數
                    announcement={announcement}
                    onSaveAnnouncement={onSaveAnnouncement}
                />
            )}
        </div>
      </div>
    );
};

export default DashboardView;