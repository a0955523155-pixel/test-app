import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, PieChart, TrendingUp, DollarSign, Calendar, LayoutGrid, List, AlertTriangle,
  Sun, Moon, LogOut, FileText, Plus, Edit, Trash2, Megaphone, Settings, X, Clock, CheckCircle,
  UserPlus, Sparkles // ★ 新增 Sparkles 圖示
} from 'lucide-react';
import DealForm from './DealForm'; 

const DashboardView = ({ 
    isAdmin, isSuperAdmin, currentUser, darkMode, toggleDarkMode, handleLogout,
    dashboardStats, dashTimeFrame, setDashTimeFrame, agentStats,
    companyProjects, projectAds, allUsers, 
    newRegionName, setNewRegionName, newProjectNames, setNewProjectNames,
    onAddRegion, onDeleteRegion, onAddProject, onDeleteProject,
    onToggleUser, onDeleteUser,
    onManageAd,
    dashboardView, setDashboardView,
    handleExportExcel, isExporting, showExportMenu, setShowExportMenu,
    appSettings, onAddOption, onDeleteOption, onReorderOption,
    deals, handleSaveDeal, handleDeleteDeal, 
    statYear, setStatYear, statMonth, setStatMonth,
    customers,
    announcement, onSaveAnnouncement,
    adManageProject, setAdManageProject, adForm, setAdForm, isEditingAd, setIsEditingAd, 
    onSaveAd, onEditAdInit, triggerDeleteAd, onEditAd, onDeleteAd,
    saveSettings 
}) => {
    
    const [editingDeal, setEditingDeal] = useState(null);
    const [showDealForm, setShowDealForm] = useState(false);
    const [tempAnnouncement, setTempAnnouncement] = useState(announcement);

    const [newScrivener, setNewScrivener] = useState({ name: '', phone: '' });
    
    // ★★★ AI 勉勵語生成邏輯 ★★★
    const handleAiGenerate = () => {
        const quotes = [
            "堅持不是因為看到希望，而是堅持了才看到希望！加油！",
            "每一份努力，都是在為未來的自己儲蓄。🔥",
            "沒有奇蹟，只有累積。今日的汗水是明日的薪水！",
            "成交的關鍵在於：比別人多堅持一秒鐘。",
            "服務的溫度，決定成交的速度。保持熱情！❤️",
            "心態決定高度，行動決定未來。衝刺吧！",
            "業績治百病，成交解千愁！大家加油！💪",
            "相信自己，你是最棒的！",
            "再多一點點努力，就離成功不遠了。",
            "專業是標配，熱情是頂配，用心服務才能贏得客戶！",
            "今天的拒絕，是明天成交的鋪墊。",
            "將來的你，一定會感謝現在拚命的自己！"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setTempAnnouncement(randomQuote);
    };
    
    const handleAddScrivener = () => {
        if (!newScrivener.name || !newScrivener.phone) return alert("請輸入姓名與電話");
        const currentList = appSettings.scriveners || [];
        const updated = [...currentList, newScrivener];
        onAddOption('scriveners', updated);
        setNewScrivener({ name: '', phone: '' });
    };

    const handleDeleteScrivener = (index) => {
        const currentList = appSettings.scriveners || [];
        const updated = currentList.filter((_, i) => i !== index);
        onAddOption('scriveners', updated);
    };

    // 時效監控邏輯
    const expiringItems = useMemo(() => {
        const today = new Date();
        const list = [];
        if (customers) {
            customers.forEach(c => {
                if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                    const end = new Date(c.commissionEndDate);
                    const diff = Math.ceil((end - today) / 86400000);
                    if (diff <= 30) {
                        list.push({ 
                            type: '委託', 
                            name: c.name||c.caseName, 
                            startDate: c.commissionStartDate || '未設定', 
                            endDate: c.commissionEndDate, 
                            days: diff, 
                            owner: c.ownerName, 
                            style: 'bg-yellow-100 text-yellow-700' 
                        });
                    }
                }
                if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                    c.scribeDetails.forEach(item => {
                        if (item.payDate && !item.isPaid) {
                            const end = new Date(item.payDate);
                            const diff = Math.ceil((end - today) / 86400000);
                            if (diff <= 30) {
                                list.push({ 
                                    type: '款項', 
                                    name: `${c.name} (${item.item})`, 
                                    startDate: c.scribeSigningDate || c.createdAt?.split('T')[0] || '-', 
                                    endDate: item.payDate, 
                                    days: diff, 
                                    owner: c.ownerName, 
                                    style: 'bg-blue-100 text-blue-700' 
                                });
                            }
                        }
                    });
                }
            });
        }
        if (projectAds) {
            Object.entries(projectAds).forEach(([projectName, ads]) => {
                if (Array.isArray(ads)) {
                    ads.forEach(ad => {
                        const adObj = typeof ad === 'string' ? { name: ad, endDate: '' } : ad;
                        if (adObj.endDate) {
                            const end = new Date(adObj.endDate);
                            const diff = Math.ceil((end - today) / 86400000);
                            let style = 'bg-green-50 text-green-700';
                            if (diff < 0) style = 'bg-red-100 text-red-700 font-bold';
                            else if (diff <= 3) style = 'bg-red-50 text-red-600 font-bold';
                            else if (diff <= 7) style = 'bg-orange-100 text-orange-700';
                            
                            list.push({ 
                                type: '廣告', 
                                name: `${projectName} - ${adObj.name}`, 
                                startDate: adObj.startDate || '未設定', 
                                endDate: adObj.endDate, 
                                days: diff, 
                                owner: '行銷', 
                                style: style 
                            });
                        }
                    });
                }
            });
        }
        return list.sort((a,b) => a.days - b.days);
    }, [customers, projectAds]);

    return (
        <div className="pb-20 w-full">
            {(showDealForm || editingDeal) && (
                <DealForm 
                    deal={editingDeal}
                    allUsers={allUsers}
                    scrivenerOptions={appSettings.scriveners || []}
                    onSave={(data) => { handleSaveDeal(data); setShowDealForm(false); setEditingDeal(null); }}
                    onCancel={() => { setShowDealForm(false); setEditingDeal(null); }}
                    onDelete={(id) => { handleDeleteDeal(id); setShowDealForm(false); setEditingDeal(null); }}
                />
            )}

            <div className={`w-full px-4 pt-10 pb-4 sticky top-0 z-10 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>管理後台</h1>
                    <div className="flex gap-2">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200'}`}>{darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                        <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 text-red-400"><LogOut className="w-5 h-5"/></button>
                    </div>
                </div>
                
                <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1 overflow-x-auto custom-scrollbar">
                    {[{ id: 'stats', label: '數據概況', icon: PieChart }, { id: 'monitor', label: '時效監控', icon: AlertTriangle }, { id: 'projects', label: '案件與廣告', icon: LayoutGrid }, { id: 'deals', label: '成交報告', icon: FileText }, { id: 'users', label: '人員管理', icon: Users }, { id: 'settings', label: '系統設定', icon: Settings }].map(tab => (
                        (!isSuperAdmin && tab.id === 'users') ? null : ( 
                            <button key={tab.id} onClick={() => setDashboardView(tab.id)} className={`flex items-center gap-2 flex-1 py-2 px-4 text-xs font-bold rounded whitespace-nowrap transition-all ${dashboardView === tab.id ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                                <tab.icon className="w-4 h-4"/> {tab.label}
                            </button>
                        )
                    ))}
                </div>
            </div>

            <div className="p-4">
                {/* 1. 時效監控面板 */}
                {dashboardView === 'monitor' && (
                    <div className="space-y-4">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-red-500"/> 時效監控中心</h3>
                            <div className="text-xs text-gray-400 mb-4 bg-gray-50 dark:bg-slate-900 p-2 rounded flex gap-4"><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span> 已過期</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500"></span> 7天內</span><span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> 正常</span></div>
                            {expiringItems.length === 0 ? <p className="text-gray-400 text-center py-10">目前無監控項目</p> : (
                                <div className="space-y-2">{expiringItems.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 dark:bg-slate-900 border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
                                        <div className="flex items-center gap-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${item.style}`}>{item.type}</span>
                                            <div className="flex flex-col">
                                                <span className="font-bold dark:text-gray-200 text-sm">{item.name}</span>
                                                <span className="text-xs text-gray-400">{item.owner}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-bold ${item.days < 0 ? 'text-red-600' : (item.days <= 7 ? 'text-orange-500' : 'text-green-600')}`}>
                                                {item.days < 0 ? `已過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}
                                            </div>
                                            <div className="text-xs text-gray-400 font-mono mt-1">
                                                {item.startDate} ~ {item.endDate}
                                            </div>
                                        </div>
                                    </div>
                                ))}</div>
                            )}
                        </div>
                    </div>
                )}
                
                {dashboardView === 'projects' && (
                    <div className="space-y-6">
                        <div className="flex gap-2"><input value={newRegionName} onChange={(e) => setNewRegionName(e.target.value)} placeholder="新分類名稱 (如: 高雄區)" className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button onClick={onAddRegion} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold">新增</button></div>
                        <div className="space-y-4">{Object.entries(companyProjects).map(([region, list]) => (<div key={region} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><div className="flex justify-between items-center mb-3"><h3 className="font-bold text-lg flex items-center gap-2"><Building2 className="w-4 h-4 text-gray-400"/> {region}</h3><button onClick={() => onDeleteRegion(region)} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">{list.map(item => { const adCount = (projectAds[item] || []).length; return (<div key={item} className="bg-gray-50 dark:bg-slate-700 p-2 rounded-lg flex justify-between items-center border dark:border-slate-600"><span className="text-sm font-bold truncate flex-1">{item}</span><div className="flex items-center gap-1"><button onClick={() => onManageAd(item)} className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${adCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`} title="管理此案件的廣告"><Megaphone className="w-3 h-3"/> {adCount > 0 ? adCount : '+'}</button><button onClick={() => onDeleteProject(region, item)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button></div></div>); })}</div><div className="flex gap-2"><input value={newProjectNames[region] || ''} onChange={(e) => setNewProjectNames({ ...newProjectNames, [region]: e.target.value })} placeholder={`新增 ${region} 的案件`} className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => onAddProject(region)} className="bg-gray-200 text-gray-700 px-3 rounded text-xs font-bold">＋</button></div></div>))}</div>
                    </div>
                )}
                {dashboardView === 'deals' && (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={() => setShowDealForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4"/> 新增成交報告</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{deals.length === 0 ? <p className="col-span-full text-center py-10 text-gray-400">尚無成交報告</p> : deals.map(deal => (<div key={deal.id} className={`p-4 rounded-2xl border cursor-pointer hover:border-blue-400 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} onClick={() => setEditingDeal(deal)}><div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg line-clamp-1">{deal.caseName || '未命名案件'}</h3><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{deal.dealDate}</span></div><div className="text-sm text-gray-500 mb-2">成交總價: <span className="font-bold text-blue-500">{deal.totalPrice}</span></div><div className="flex justify-between text-xs text-gray-400"><span>賣: {deal.sellerName}</span><span>買: {deal.buyerName}</span></div></div>))}</div>
                    </div>
                )}
                {dashboardView === 'stats' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4">
                            <select value={dashTimeFrame} onChange={(e) => setDashTimeFrame(e.target.value)} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><option value="month">本月</option><option value="year">本年</option><option value="all">全部</option></select>
                            {dashTimeFrame !== 'all' && (<><select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select>{dashTimeFrame === 'month' && <select value={statMonth} onChange={(e) => setStatMonth(Number(e.target.value))} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select>}</>)}
                        </div>
                        <div className="grid grid-cols-2 gap-4"><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><div className="text-xs text-gray-400 mb-1">總業績 (萬)</div><div className="text-2xl font-black text-blue-500">{dashboardStats.totalRevenue.toLocaleString()}</div></div><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><div className="text-xs text-gray-400 mb-1">成交 / 客戶</div><div className="text-2xl font-black text-green-500">{dashboardStats.counts.won} <span className="text-xs text-gray-400">/ {dashboardStats.counts.total}</span></div></div></div>
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-4">人員排行榜</h3><div className="space-y-3">{agentStats.map((agent, idx) => (<div key={idx} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div><span className="text-sm font-bold">{agent.name}</span></div><div className="text-sm font-mono text-blue-500">{agent.commission.toLocaleString()}</div></div>))}</div></div>
                    </div>
                )}
                {dashboardView === 'users' && isSuperAdmin && (<div className="space-y-4"><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-4">人員管理 ({allUsers.length})</h3><div className="space-y-2">{allUsers.map(user => (<div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700"><div><div className="font-bold text-sm">{user.name} <span className="text-gray-400 text-xs">({user.role})</span></div><div className="text-xs text-gray-500">{user.username}</div></div><div className="flex gap-2"><button onClick={() => onToggleUser(user)} className={`text-xs px-3 py-1 rounded font-bold ${user.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{user.status === 'suspended' ? '已停權' : '正常'}</button><button onClick={() => onDeleteUser(user)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div></div>))}</div></div></div>)}
                
                {/* 6. 系統設定 (Settings View) */}
                {dashboardView === 'settings' && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-3">跑馬燈公告</h3>
                            <div className="flex gap-2">
                                <input value={tempAnnouncement} onChange={(e) => setTempAnnouncement(e.target.value)} className={`flex-1 px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} />
                                <button onClick={() => onSaveAnnouncement(tempAnnouncement)} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">更新</button>
                                {/* ★★★ 新增：AI 勉勵按鈕 ★★★ */}
                                <button onClick={handleAiGenerate} className="bg-purple-100 text-purple-700 px-4 rounded font-bold text-sm flex items-center gap-1 hover:bg-purple-200 transition-colors">
                                    <Sparkles className="w-3 h-3"/> AI 勉勵
                                </button>
                            </div>
                        </div>
                        
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/> 代書資料管理</h3>
                            <div className="space-y-2 mb-3">
                                {(appSettings.scriveners || []).map((scr, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-900 p-2 rounded">
                                        <div className="text-sm font-bold">{scr.name} <span className="font-normal text-gray-500 text-xs">({scr.phone})</span></div>
                                        <button onClick={() => handleDeleteScrivener(idx)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <input value={newScrivener.name} onChange={e => setNewScrivener({...newScrivener, name: e.target.value})} placeholder="代書姓名" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} />
                                <input value={newScrivener.phone} onChange={e => setNewScrivener({...newScrivener, phone: e.target.value})} placeholder="電話" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} />
                                <button onClick={handleAddScrivener} className="bg-green-600 text-white px-3 rounded text-xs font-bold">＋</button>
                            </div>
                        </div>

                        {['sources', 'categories', 'levels'].map(type => (<div key={type} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-3 capitalize">{type === 'sources' ? '來源' : type === 'categories' ? '分類' : '等級'}設定</h3><div className="flex flex-wrap gap-2 mb-3">{(appSettings[type] || []).map(opt => (<span key={opt} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{opt} <button onClick={() => onDeleteOption(type, opt)} className="text-blue-300 hover:text-blue-500">×</button></span>))}</div><div className="flex gap-2"><input id={`input-${type}`} placeholder="新增選項" className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => { const el = document.getElementById(`input-${type}`); onAddOption(type, el.value); el.value=''; }} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">＋</button></div></div>))}
                    </div>
                )}
            </div>
            {adManageProject && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3"><h3 className="text-lg font-bold flex items-center gap-2">管理廣告: {adManageProject}</h3><button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X/></button></div>
                        <div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800"><input value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none notranslate ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="廣告名稱 (如: 591, FB)" autoComplete="off" /><div className="flex gap-2 items-center"><span className="text-xs text-gray-400">起</span><input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-2 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /><span className="text-xs text-gray-400">迄</span><input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-2 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div><button onClick={onSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button></div>
                        <div className="space-y-2">{(projectAds[adManageProject] || []).map((ad, idx) => { const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '' } : ad; return (<div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors"><div><span className="font-bold block">{adObj.name}</span></div><div className="flex gap-1"><button onClick={() => onEditAd(ad, adManageProject)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit className="w-4 h-4"/></button><button onClick={() => onDeleteAd(ad, adManageProject)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 className="w-4 h-4"/></button></div></div>); })}</div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;