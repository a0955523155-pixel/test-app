import React, { useState, useMemo } from 'react';
import { 
  Building2, Users, PieChart, TrendingUp, DollarSign, Calendar, LayoutGrid, List, AlertTriangle,
  Sun, Moon, LogOut, FileText, Plus, Edit, Trash2, Megaphone, Settings, X, Clock, CheckCircle,
  UserPlus, Sparkles, ChevronDown, ChevronRight, Monitor, MapPin, ExternalLink, RefreshCw
} from 'lucide-react';
import DealForm from './DealForm'; 

// 行政區資料
const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

// 收合區塊元件
const MonitorSection = ({ title, count, icon: Icon, children, defaultOpen = false, colorClass = "text-gray-700" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
                <div className={`flex items-center gap-2 font-bold ${colorClass}`}>
                    <Icon className="w-5 h-5"/>
                    {title}
                    {count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{count}</span>}
                </div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <ChevronRight className="w-4 h-4 text-gray-400"/>}
            </button>
            {isOpen && (
                <div className="p-3 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">
                    {children}
                </div>
            )}
        </div>
    );
};

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
    saveSettings,
    adWalls = [], systemAlerts = [],
    onResolveAlert,
    statWeek, setStatWeek
}) => {
    
    // --- 防呆預設值 ---
    const safeStats = dashboardStats || { totalRevenue: 0, counts: { won: 0, cases: 0, buyers: 0 } };
    const safeAgentStats = Array.isArray(agentStats) ? agentStats : [];
    const safeProjects = companyProjects || {};
    const safeAds = projectAds || {};
    const safeUsers = Array.isArray(allUsers) ? allUsers : [];
    const safeDeals = Array.isArray(deals) ? deals : [];
    const safeAppSettings = appSettings || { sources: [], categories: [], levels: [], scriveners: [] };
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeAdWalls = Array.isArray(adWalls) ? adWalls : [];
    const safeAlerts = Array.isArray(systemAlerts) ? systemAlerts : [];
    // --------------------------------

    const [editingDeal, setEditingDeal] = useState(null);
    const [showDealForm, setShowDealForm] = useState(false);
    const [tempAnnouncement, setTempAnnouncement] = useState(announcement || '');
    const [newScrivener, setNewScrivener] = useState({ name: '', phone: '' });
    const [collapsedRegions, setCollapsedRegions] = useState({});
    
    // ★ 廣告牆狀態與編輯模式 ★
    const [adWallForm, setAdWallForm] = useState({ 
        city: '高雄市', district: '', road: '', 
        size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' 
    });
    const [isEditingAdWall, setIsEditingAdWall] = useState(false);
    const [editingAdWallId, setEditingAdWallId] = useState(null);

    const toggleRegion = (region) => {
        setCollapsedRegions(prev => ({ ...prev, [region]: !prev[region] }));
    };

    const handleDragStart = (e, project, sourceRegion) => {
        if (!e.dataTransfer) return;
        e.dataTransfer.setData('project', project);
        e.dataTransfer.setData('sourceRegion', sourceRegion);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        const mouseY = e.clientY;
        const threshold = 100; 
        const scrollSpeed = 15;
        if (mouseY < threshold) window.scrollBy(0, -scrollSpeed);
        else if (mouseY > window.innerHeight - threshold) window.scrollBy(0, scrollSpeed);
    };

    const handleDrop = (e, targetRegion) => {
        e.preventDefault();
        if (!e.dataTransfer) return;

        const project = e.dataTransfer.getData('project');
        const sourceRegion = e.dataTransfer.getData('sourceRegion');

        if (!project || !sourceRegion || sourceRegion === targetRegion) return;
        if (!saveSettings) return;

        const updatedProjects = { ...safeProjects };
        
        if (!Array.isArray(updatedProjects[sourceRegion])) updatedProjects[sourceRegion] = [];
        if (!Array.isArray(updatedProjects[targetRegion])) updatedProjects[targetRegion] = [];

        updatedProjects[sourceRegion] = updatedProjects[sourceRegion].filter(p => p !== project);
        
        if (!updatedProjects[targetRegion].includes(project)) {
            updatedProjects[targetRegion] = [...updatedProjects[targetRegion], project];
        }
        
        if (collapsedRegions[targetRegion]) {
            setCollapsedRegions(prev => ({ ...prev, [targetRegion]: false }));
        }

        saveSettings(updatedProjects, null);
    };
    
    const handleAiGenerate = () => {
        const quotes = [
            "堅持不是因為看到希望，而是堅持了才看到希望！加油！",
            "每一份努力，都是在為未來的自己儲蓄。🔥",
            "業績治百病，成交解千愁！大家加油！💪",
            "相信自己，你是最棒的！"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setTempAnnouncement(randomQuote);
    };
    
    const handleAddScrivener = () => { if (!newScrivener.name || !newScrivener.phone) return alert("請輸入姓名與電話"); const currentList = safeAppSettings.scriveners || []; const updated = [...currentList, newScrivener]; onAddOption('scriveners', updated); setNewScrivener({ name: '', phone: '' }); };
    const handleDeleteScrivener = (index) => { const currentList = safeAppSettings.scriveners || []; const updated = currentList.filter((_, i) => i !== index); onAddOption('scriveners', updated); };

    // 廣告牆: 產生 Google Map 連結
    const generateAdWallMapLink = () => {
        const fullAddr = `${adWallForm.city}${adWallForm.district}${adWallForm.road}`;
        if (!adWallForm.district || !adWallForm.road) {
            alert("請先選擇區域並輸入路名");
            return;
        }
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
        setAdWallForm({ ...adWallForm, googleMapUrl: link });
    };

    // ★ 廣告牆: 儲存 (新增或更新) ★
    const handleSaveAdWall = () => {
        if (!adWallForm.district || !adWallForm.road) return alert("請完整填寫地址 (區域與路名)");
        
        const fullAddress = `${adWallForm.city}${adWallForm.district}${adWallForm.road}`;
        
        let updatedList;
        if (isEditingAdWall && editingAdWallId) {
            // 更新模式
            updatedList = safeAdWalls.map(w => 
                w.id === editingAdWallId ? { ...adWallForm, address: fullAddress, id: editingAdWallId } : w
            );
        } else {
            // 新增模式
            const newItem = { ...adWallForm, address: fullAddress, id: Date.now() };
            updatedList = [...safeAdWalls, newItem];
        }
        
        onAddOption('adWalls', updatedList);
        
        // 重置表單與狀態
        resetAdWallForm();
    };

    const resetAdWallForm = () => {
        setAdWallForm({ 
            city: '高雄市', district: '', road: '', 
            size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' 
        });
        setIsEditingAdWall(false);
        setEditingAdWallId(null);
    };

    // ★ 廣告牆: 啟動編輯模式 ★
    const handleEditAdWall = (wallItem) => {
        setAdWallForm({
            city: wallItem.city || '高雄市',
            district: wallItem.district || '',
            road: wallItem.road || '',
            size: wallItem.size || '',
            price: wallItem.price || '',
            expiryDate: wallItem.expiryDate || '',
            project: wallItem.project || '',
            googleMapUrl: wallItem.googleMapUrl || ''
        });
        setIsEditingAdWall(true);
        setEditingAdWallId(wallItem.id);
    };
    
    const handleDeleteAdWall = (id) => {
        if(confirm("確定刪除此廣告牆資料？")) {
            const updated = safeAdWalls.filter(w => w.id !== id);
            onAddOption('adWalls', updated);
            // 如果刪除的是正在編輯的項目，重置表單
            if (id === editingAdWallId) resetAdWallForm();
        }
    };

    // 時效監控資料分類
    const groupedExpiringItems = useMemo(() => {
        const today = new Date();
        const groups = { alerts: [], ads: [], adWalls: [], commission: [], payment: [] };

        safeAlerts.forEach(alert => {
            groups.alerts.push({
                id: alert.id,
                name: alert.clientName || '未命名',
                desc: alert.msg,
                date: new Date(alert.timestamp?.toDate ? alert.timestamp.toDate() : alert.timestamp).toLocaleDateString(),
                days: 0 
            });
        });

        safeCustomers.forEach(c => {
            if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                const end = new Date(c.commissionEndDate);
                const diff = Math.ceil((end - today) / 86400000);
                if (diff <= 30) {
                    groups.commission.push({ 
                        name: c.name || c.caseName, 
                        desc: `委託到期 (${c.ownerName})`,
                        startDate: c.commissionStartDate || '-', 
                        endDate: c.commissionEndDate, 
                        days: diff 
                    });
                }
            }
            if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                c.scribeDetails.forEach(item => {
                    if (item.payDate && !item.isPaid) {
                        const end = new Date(item.payDate);
                        const diff = Math.ceil((end - today) / 86400000);
                        if (diff <= 30) {
                            groups.payment.push({ 
                                name: `${c.name} (${item.item})`, 
                                desc: `待付款 (${c.ownerName})`,
                                startDate: c.createdAt?.split('T')[0] || '-', 
                                endDate: item.payDate, 
                                days: diff 
                            });
                        }
                    }
                });
            }
        });

        Object.entries(safeAds).forEach(([projectName, ads]) => {
            if (Array.isArray(ads)) {
                ads.forEach(ad => {
                    const adObj = typeof ad === 'string' ? { name: ad, endDate: '' } : ad;
                    if (adObj.endDate) {
                        const end = new Date(adObj.endDate);
                        const diff = Math.ceil((end - today) / 86400000);
                        groups.ads.push({ 
                            name: `${projectName} - ${adObj.name}`, 
                            desc: '廣告到期',
                            startDate: adObj.startDate || '-', 
                            endDate: adObj.endDate, 
                            days: diff 
                        });
                    }
                });
            }
        });

        safeAdWalls.forEach(w => {
            if (w.expiryDate) {
                const end = new Date(w.expiryDate);
                const diff = Math.ceil((end - today) / 86400000);
                groups.adWalls.push({
                    name: w.address,
                    desc: `廣告牆 (${w.project || '無案場'})`,
                    startDate: '-',
                    endDate: w.expiryDate,
                    days: diff
                });
            }
        });

        Object.keys(groups).forEach(key => {
            if (key !== 'alerts') {
                groups[key].sort((a,b) => a.days - b.days);
            }
        });

        return groups;
    }, [safeCustomers, safeAds, safeAdWalls, safeAlerts]);

    const renderMonitorItem = (item, type) => {
        let dayColor = 'text-green-600';
        if (item.days < 0) dayColor = 'text-red-600';
        else if (item.days <= 7) dayColor = 'text-orange-500';

        return (
            <div key={item.name + item.endDate} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <div>
                    <div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div>
                    <div className="text-xs text-gray-500">{item.desc}</div>
                </div>
                <div className="text-right">
                    <div className={`text-sm font-bold ${dayColor}`}>
                        {item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div>
                </div>
            </div>
        );
    };

    return (
        <div className="pb-20 w-full">
            {(showDealForm || editingDeal) && (
                <DealForm 
                    deal={editingDeal}
                    allUsers={safeUsers}
                    scrivenerOptions={safeAppSettings.scriveners || []}
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
                    {[{ id: 'stats', label: '數據概況', icon: PieChart }, { id: 'monitor', label: '時效監控', icon: AlertTriangle }, { id: 'projects', label: '案件與廣告', icon: LayoutGrid }, { id: 'adwalls', label: '廣告牆', icon: Monitor }, { id: 'deals', label: '成交報告', icon: FileText }, { id: 'users', label: '人員管理', icon: Users }, { id: 'settings', label: '系統設定', icon: Settings }].map(tab => (
                        (!isSuperAdmin && tab.id === 'users') ? null : ( 
                            <button key={tab.id} onClick={() => setDashboardView(tab.id)} className={`flex items-center gap-2 flex-1 py-2 px-4 text-xs font-bold rounded whitespace-nowrap transition-all ${dashboardView === tab.id ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                                <tab.icon className="w-4 h-4"/> 
                                {tab.label}
                                {tab.id === 'monitor' && safeAlerts.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full ml-1 animate-pulse"></span>}
                            </button>
                        )
                    ))}
                </div>
            </div>

            <div className="p-4">
                {/* 1. 時效監控 (收合式) */}
                {dashboardView === 'monitor' && (
                    <div className="space-y-2">
                        <MonitorSection title="系統警示" count={groupedExpiringItems.alerts.length} icon={AlertTriangle} defaultOpen={true} colorClass="text-red-600">
                            {groupedExpiringItems.alerts.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無警示</p> : 
                                groupedExpiringItems.alerts.map(alert => (
                                    <div key={alert.id} className="flex justify-between items-start p-3 border-b border-red-100 last:border-0 bg-red-50 dark:bg-red-900/10 rounded mb-1">
                                        <div>
                                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.desc}</p>
                                            <p className="text-xs text-gray-500">{alert.date}</p>
                                        </div>
                                        <button onClick={() => onResolveAlert(alert.id)} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100">消除</button>
                                    </div>
                                ))
                            }
                        </MonitorSection>

                        <MonitorSection title="廣告時效 (591/FB...)" count={groupedExpiringItems.ads.length} icon={Megaphone} colorClass="text-blue-600">
                            {groupedExpiringItems.ads.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期廣告</p> : groupedExpiringItems.ads.map(item => renderMonitorItem(item))}
                        </MonitorSection>

                        <MonitorSection title="廣告牆時效 (看板)" count={groupedExpiringItems.adWalls.length} icon={Monitor} colorClass="text-purple-600">
                            {groupedExpiringItems.adWalls.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期看板</p> : groupedExpiringItems.adWalls.map(item => renderMonitorItem(item))}
                        </MonitorSection>

                        <MonitorSection title="委託及斡旋期限" count={groupedExpiringItems.commission.length} icon={FileText} defaultOpen={true} colorClass="text-orange-600">
                            {groupedExpiringItems.commission.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期項目</p> : groupedExpiringItems.commission.map(item => renderMonitorItem(item))}
                        </MonitorSection>

                        <MonitorSection title="代書付款期限" count={groupedExpiringItems.payment.length} icon={DollarSign} colorClass="text-green-600">
                            {groupedExpiringItems.payment.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期款項</p> : groupedExpiringItems.payment.map(item => renderMonitorItem(item))}
                        </MonitorSection>
                    </div>
                )}
                
                {/* 廣告牆管理 */}
                {dashboardView === 'adwalls' && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-blue-500"/> 廣告牆管理</h3>
                            
                            {/* 新增/編輯 表單 */}
                            <div className={`bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 space-y-3 border ${isEditingAdWall ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-200 dark:border-slate-700'}`}>
                                {isEditingAdWall && <div className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1"><Edit className="w-3 h-3"/> 正在編輯項目...</div>}
                                
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold block mb-1">縣市</label>
                                        <select 
                                            value={adWallForm.city} 
                                            onChange={e => setAdWallForm({...adWallForm, city: e.target.value, district: ''})} 
                                            className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}
                                        >
                                            {Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold block mb-1">區域</label>
                                        <select 
                                            value={adWallForm.district} 
                                            onChange={e => setAdWallForm({...adWallForm, district: e.target.value})} 
                                            className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}
                                        >
                                            <option value="">請選擇</option>
                                            {REGIONS_DATA[adWallForm.city]?.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">路名與詳細位置 (必填)</label>
                                    <input 
                                        value={adWallForm.road} 
                                        onChange={e => setAdWallForm({...adWallForm, road: e.target.value})} 
                                        className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} 
                                        placeholder="例如: 中正路100號旁" 
                                    />
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    <div><label className="text-xs text-gray-500">尺寸</label><input value={adWallForm.size} onChange={e => setAdWallForm({...adWallForm, size: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="10x20" /></div>
                                    <div><label className="text-xs text-gray-500">價格</label><input value={adWallForm.price} onChange={e => setAdWallForm({...adWallForm, price: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="月租" /></div>
                                    <div><label className="text-xs text-gray-500">期限</label><input type="date" value={adWallForm.expiryDate} onChange={e => setAdWallForm({...adWallForm, expiryDate: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} /></div>
                                    
                                    {/* ★ 選單式綁定案場 ★ */}
                                    <div>
                                        <label className="text-xs text-gray-500">綁定案場</label>
                                        <select 
                                            value={adWallForm.project} 
                                            onChange={e => setAdWallForm({...adWallForm, project: e.target.value})} 
                                            className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}
                                        >
                                            <option value="">(無/不綁定)</option>
                                            {safeProjects && Object.entries(safeProjects).map(([region, projects]) => (
                                                <optgroup key={region} label={region}>
                                                    {Array.isArray(projects) && projects.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">Google 地圖連結</label>
                                    <div className="flex gap-2">
                                        <input 
                                            value={adWallForm.googleMapUrl} 
                                            onChange={e => setAdWallForm({...adWallForm, googleMapUrl: e.target.value})} 
                                            className={`flex-1 p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} 
                                            placeholder="http://googleusercontent.com/maps.google.com/..." 
                                        />
                                        <button 
                                            onClick={generateAdWallMapLink} 
                                            className="px-3 bg-blue-100 text-blue-600 rounded font-bold text-xs hover:bg-blue-200 whitespace-nowrap"
                                        >
                                            📍 轉連結
                                        </button>
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    {isEditingAdWall && (
                                        <button onClick={resetAdWallForm} className="flex-1 bg-gray-200 text-gray-600 p-2 rounded font-bold text-sm hover:bg-gray-300">
                                            取消
                                        </button>
                                    )}
                                    <button onClick={handleSaveAdWall} className={`flex-1 text-white p-2 rounded font-bold text-sm shadow-md ${isEditingAdWall ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                                        {isEditingAdWall ? '儲存變更' : '新增廣告牆資料'}
                                    </button>
                                </div>
                            </div>

                            {/* 廣告牆列表 */}
                            <div className="space-y-2">
                                {safeAdWalls.map(w => {
                                    const days = w.expiryDate ? Math.ceil((new Date(w.expiryDate) - new Date()) / 86400000) : 999;
                                    return (
                                        <div key={w.id} className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${editingAdWallId === w.id ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                            <div>
                                                <div className="font-bold flex items-center gap-2">
                                                    {w.address} 
                                                    <span className="text-xs text-gray-400 font-normal">({w.size})</span>
                                                    {w.googleMapUrl && (
                                                        <a href={w.googleMapUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700">
                                                            <ExternalLink className="w-4 h-4"/>
                                                        </a>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-500">案場: {w.project || '無'} | 價格: {w.price}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs font-bold mr-2 ${days < 0 ? 'text-red-500' : days < 30 ? 'text-orange-500' : 'text-green-500'}`}>
                                                    {days < 0 ? '已過期' : `剩 ${days} 天`}
                                                </div>
                                                {/* 編輯按鈕 */}
                                                <button onClick={() => handleEditAdWall(w)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded">
                                                    <Edit className="w-4 h-4"/>
                                                </button>
                                                <button onClick={() => handleDeleteAdWall(w.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded">
                                                    <Trash2 className="w-4 h-4"/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* 案件與廣告 (保持不變) */}
                {dashboardView === 'projects' && (
                    <div className="space-y-6">
                        <div className="flex gap-2"><input value={newRegionName} onChange={(e) => setNewRegionName(e.target.value)} placeholder="新分類名稱 (如: 高雄區)" className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button onClick={onAddRegion} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold">新增</button></div>
                        <div className="space-y-4">
                            {Object.entries(safeProjects).map(([region, list]) => (
                                <div 
                                    key={region} 
                                    className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}
                                    onDragOver={handleDragOver}
                                    onDrop={(e) => handleDrop(e, region)}
                                >
                                    <div 
                                        className="flex justify-between items-center mb-3 cursor-pointer select-none bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                                        onClick={() => toggleRegion(region)}
                                    >
                                        <h3 className="font-bold text-lg flex items-center gap-2">
                                            {collapsedRegions[region] ? <ChevronRight className="w-5 h-5 text-gray-500"/> : <ChevronDown className="w-5 h-5 text-gray-500"/>}
                                            <Building2 className="w-4 h-4 text-blue-500"/> 
                                            {region}
                                            <span className="text-xs text-gray-400 font-normal">({Array.isArray(list) ? list.length : 0})</span>
                                        </h3>
                                        <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                                            <button onClick={() => onDeleteRegion(region)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                    
                                    {!collapsedRegions[region] && Array.isArray(list) && (
                                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                                                {list.map(item => { 
                                                    const adCount = (safeAds[item] || []).length; 
                                                    return (
                                                        <div 
                                                            key={item} 
                                                            draggable="true" 
                                                            onDragStart={(e) => handleDragStart(e, item, region)} 
                                                            className="bg-gray-50 dark:bg-slate-700 p-2 rounded-lg flex justify-between items-center border dark:border-slate-600 cursor-grab active:cursor-grabbing hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"
                                                        >
                                                            <span className="text-sm font-bold truncate flex-1">{item}</span>
                                                            <div className="flex items-center gap-1">
                                                                <button onClick={() => onManageAd(item)} className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${adCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`} title="管理此案件的廣告"><Megaphone className="w-3 h-3"/> {adCount > 0 ? adCount : '+'}</button>
                                                                <button onClick={() => onDeleteProject(region, item)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    ); 
                                                })}
                                            </div>
                                            <div className="flex gap-2"><input value={newProjectNames[region] || ''} onChange={(e) => setNewProjectNames({ ...newProjectNames, [region]: e.target.value })} placeholder={`新增 ${region} 的案件`} className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => onAddProject(region)} className="bg-gray-200 text-gray-700 px-3 rounded text-xs font-bold">＋</button></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 成交報告 (保持不變) */}
                {dashboardView === 'deals' && (
                    <div className="space-y-4">
                        <div className="flex justify-end"><button onClick={() => setShowDealForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4"/> 新增成交報告</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{safeDeals.length === 0 ? <p className="col-span-full text-center py-10 text-gray-400">尚無成交報告</p> : safeDeals.map(deal => (<div key={deal.id} className={`p-4 rounded-2xl border cursor-pointer hover:border-blue-400 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} onClick={() => setEditingDeal(deal)}><div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg line-clamp-1">{deal.caseName || '未命名案件'}</h3><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{deal.dealDate}</span></div><div className="text-sm text-gray-500 mb-2">成交總價: <span className="font-bold text-blue-500">{deal.totalPrice}</span></div><div className="flex justify-between text-xs text-gray-400"><span>賣: {deal.sellerName}</span><span>買: {deal.buyerName}</span></div></div>))}</div>
                    </div>
                )}

                {/* 數據概況 */}
                {dashboardView === 'stats' && (
                    <div className="space-y-6">
                        <div className="flex gap-2 mb-4">
                            <select value={dashTimeFrame} onChange={(e) => setDashTimeFrame(e.target.value)} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                <option value="month">本月</option>
                                <option value="week">本週</option>
                                <option value="year">本年</option>
                                <option value="all">全部</option>
                            </select>
                            {/* 週次選擇器 */}
                            {dashTimeFrame === 'week' && (
                                <input 
                                    type="week" 
                                    value={statWeek} 
                                    onChange={(e) => setStatWeek(e.target.value)} 
                                    className={`px-2 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`}
                                />
                            )}
                            {dashTimeFrame !== 'all' && dashTimeFrame !== 'week' && (<><select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select>{dashTimeFrame === 'month' && <select value={statMonth} onChange={(e) => setStatMonth(Number(e.target.value))} className={`px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select>}</>)}
                        </div>
                        <div className="grid grid-cols-2 gap-4"><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><div className="text-xs text-gray-400 mb-1">總業績 (萬)</div><div className="text-2xl font-black text-blue-500">{safeStats.totalRevenue.toLocaleString()}</div></div><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><div className="text-xs text-gray-400 mb-1">成交 / 客戶</div><div className="text-2xl font-black text-green-500">{safeStats.counts.won} <span className="text-xs text-gray-400">/ {safeStats.counts.total}</span></div></div></div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <div className="text-xs text-gray-400 mb-1">新進案件</div>
                                <div className="text-2xl font-black text-orange-500">{safeStats.counts.cases}</div>
                            </div>
                            <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                                <div className="text-xs text-gray-400 mb-1">新進買方</div>
                                <div className="text-2xl font-black text-purple-500">{safeStats.counts.buyers}</div>
                            </div>
                        </div>
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'} mt-4`}><h3 className="font-bold mb-4">人員排行榜</h3><div className="space-y-3">{safeAgentStats.map((agent, idx) => (<div key={idx} className="flex items-center justify-between"><div className="flex items-center gap-3"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < 3 ? 'bg-yellow-400 text-yellow-900' : 'bg-gray-200 text-gray-600'}`}>{idx + 1}</div><span className="text-sm font-bold">{agent.name}</span></div><div className="text-sm font-mono text-blue-500">{agent.commission.toLocaleString()}</div></div>))}</div></div>
                    </div>
                )}
                
                {/* 人員管理 (Super Admin) */}
                {dashboardView === 'users' && isSuperAdmin && (<div className="space-y-4"><div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-4">人員管理 ({safeUsers.length})</h3><div className="space-y-2">{safeUsers.map(user => (<div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700"><div><div className="font-bold text-sm">{user.name} <span className="text-gray-400 text-xs">({user.role})</span></div><div className="text-xs text-gray-500">{user.username}</div></div><div className="flex gap-2"><button onClick={() => onToggleUser(user)} className={`text-xs px-3 py-1 rounded font-bold ${user.status === 'suspended' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{user.status === 'suspended' ? '已停權' : '正常'}</button><button onClick={() => onDeleteUser(user)} className="text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button></div></div>))}</div></div></div>)}
                
                {/* 系統設定 */}
                {dashboardView === 'settings' && (
                    <div className="space-y-6">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-3">跑馬燈公告</h3>
                            <div className="flex gap-2"><input value={tempAnnouncement} onChange={(e) => setTempAnnouncement(e.target.value)} className={`flex-1 px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => onSaveAnnouncement(tempAnnouncement)} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">更新</button><button onClick={handleAiGenerate} className="bg-purple-100 text-purple-700 px-4 rounded font-bold text-sm flex items-center gap-1 hover:bg-purple-200 transition-colors"><Sparkles className="w-3 h-3"/> AI 勉勵</button></div>
                        </div>
                        
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/> 代書資料管理</h3>
                            <div className="space-y-2 mb-3">{safeAppSettings.scriveners.map((scr, idx) => (<div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-900 p-2 rounded"><div className="text-sm font-bold">{scr.name} <span className="font-normal text-gray-500 text-xs">({scr.phone})</span></div><button onClick={() => handleDeleteScrivener(idx)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button></div>))}</div>
                            <div className="flex gap-2"><input value={newScrivener.name} onChange={e => setNewScrivener({...newScrivener, name: e.target.value})} placeholder="代書姓名" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><input value={newScrivener.phone} onChange={e => setNewScrivener({...newScrivener, phone: e.target.value})} placeholder="電話" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={handleAddScrivener} className="bg-green-600 text-white px-3 rounded text-xs font-bold">＋</button></div>
                        </div>

                        {['sources', 'categories', 'levels'].map(type => (<div key={type} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-3 capitalize">{type === 'sources' ? '來源' : type === 'categories' ? '分類' : '等級'}設定</h3><div className="flex flex-wrap gap-2 mb-3">{(safeAppSettings[type] || []).map(opt => (<span key={opt} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{opt} <button onClick={() => onDeleteOption(type, opt)} className="text-blue-300 hover:text-blue-500">×</button></span>))}</div><div className="flex gap-2"><input id={`input-${type}`} placeholder="新增選項" className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => { const el = document.getElementById(`input-${type}`); onAddOption(type, el.value); el.value=''; }} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">＋</button></div></div>))}
                    </div>
                )}
            </div>
            
            {/* 案件廣告管理彈窗 (保持不變) */}
            {adManageProject && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold flex items-center gap-2">管理廣告: {adManageProject}</h3>
                            <button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            <input value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none notranslate ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="廣告名稱 (如: 591, FB)" autoComplete="off" />
                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-gray-400">起</span>
                                <input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                <span className="text-xs text-gray-400">迄</span>
                                <input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                            </div>
                            <button onClick={onSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button>
                        </div>
                        <div className="space-y-2">
                            {(projectAds[adManageProject] || []).map((ad, idx) => { 
                                const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '' } : ad; 
                                return (
                                    <div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors">
                                        <div><span className="font-bold block">{adObj.name}</span></div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEditAdInit(ad)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit className="w-4 h-4"/></button>
                                            <button onClick={() => triggerDeleteAd(adObj)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                ); 
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;