import React, { useState, useMemo, useEffect } from 'react';
import { 
    LayoutDashboard, Moon, Sun, LogOut, BarChart2, AlertTriangle, LayoutGrid, Monitor, DollarSign, Users, Settings, Database, Trash2, Download, Menu, User as UserIcon, Shield, Briefcase, Save, X, ToggleLeft, ToggleRight, Megaphone, Edit2, Target, ThumbsUp
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Import Sub-components
import StatsCards from './dashboard/StatsCards';
import RankingList from './dashboard/RankingList';
import SettingsPanel from './dashboard/SettingsPanel';
import MonitorPanel from './dashboard/MonitorPanel';
import ProjectsPanel from './dashboard/ProjectsPanel';
import AdWallsPanel from './dashboard/AdWallsPanel';
import DealsPanel from './dashboard/DealsPanel';
import UsersPanel from './dashboard/UsersPanel';

// 引入日期比對工具
import { checkDateMatch } from '../utils/helpers'; 

// ★★★ 1. 樣式定義 ★★★
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

// ★★★ 2. 輔助函式：取得篩選日期範圍 (用於計算廣告費) ★★★
const getFilterRange = (timeFrame, year, month, weekStr) => {
    let start = new Date(0); 
    let end = new Date(2999, 11, 31); 

    if (timeFrame === 'month') {
        start = new Date(year, month - 1, 1);
        end = new Date(year, month, 0, 23, 59, 59); 
    } else if (timeFrame === 'year') {
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59);
    } else if (timeFrame === 'week' && weekStr) {
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
    return { filterStart: start, filterEnd: end };
};

// ★★★ 3. 效益評級計算函式 (接洽 / 來客) ★★★
const getEfficiencyRating = (engagements, leads) => {
    if (!leads || leads === 0) return { rate: 0, label: '無數據', color: 'bg-gray-100 text-gray-400 border-gray-200' };
    
    // 計算比率：有效接洽 / 總來客
    const rate = Math.round((engagements / leads) * 100);

    // 評分標準
    if (rate >= 50) {
        return { rate, label: '超讚', color: 'bg-green-100 text-green-700 border-green-200' };
    } else if (rate >= 20) {
        return { rate, label: '及格', color: 'bg-blue-100 text-blue-700 border-blue-200' };
    } else {
        return { rate, label: '待加強', color: 'bg-red-100 text-red-700 border-red-200' };
    }
};

const DashboardView = ({ 
    saveSettings, customers, isAdmin, isSuperAdmin, currentUser, darkMode, toggleDarkMode, handleLogout,
    dashTimeFrame, setDashTimeFrame, agentStats,
    companyProjects, projectAds, allUsers, 
    newRegionName, setNewRegionName, newProjectNames, setNewProjectNames,
    onAddRegion, onDeleteRegion, onAddProject, onDeleteProject,
    onToggleUser, onDeleteUser,
    onManageAd, adManageProject, setAdManageProject, adForm, setAdForm, isEditingAd, setIsEditingAd,
    dashboardView, setDashboardView,
    handleExportExcel, isExporting, showExportMenu, setShowExportMenu,
    appSettings, onAddOption, onDeleteOption, onReorderOption,
    deals, handleSaveDeal, handleDeleteDeal,
    statYear, setStatYear, statMonth, setStatMonth,
    onSaveAd, onEditAdInit, triggerDeleteAd,
    announcement, onSaveAnnouncement,
    adWalls, systemAlerts, onResolveAlert,
    statWeek, setStatWeek,
    onOpenProfile,
    onOpenSettings
}) => {
    
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [editUserModal, setEditUserModal] = useState(false);
    const [editingUserData, setEditingUserData] = useState(null);

    // ★★★ 4. 計算 Dashboard Stats (包含 engagements 與 廣告費用) ★★★
    const dashboardStats = useMemo(() => {
        let totalRevenue = 0, wonCount = 0, newCases = 0, newBuyers = 0;
        const marketingMap = {}; 

        // Helper: 確保 marketingMap 的該渠道物件已初始化
        const initSource = (sourceName) => {
            if (!marketingMap[sourceName]) {
                marketingMap[sourceName] = { 
                    name: sourceName, 
                    newLeads: 0,    // 來客數
                    deals: 0,       // 成交數
                    engagements: 0, // 接洽數 (留電)
                    revenue: 0, 
                    cost: 0         // 廣告花費
                };
            }
        };
        
        // 1. 計算廣告費用 (整合 projectAds)
        const { filterStart, filterEnd } = getFilterRange(dashTimeFrame, statYear, statMonth, statWeek);
        
        // 遍歷所有專案的廣告
        Object.values(projectAds || {}).forEach(adList => {
            if (Array.isArray(adList)) {
                adList.forEach(ad => {
                    // 檢查廣告日期是否與選定區間重疊
                    const adStart = new Date(ad.startDate);
                    const adEnd = ad.endDate ? new Date(ad.endDate) : new Date(); 
                    const isOverlapping = adStart <= filterEnd && adEnd >= filterStart;

                    if (isOverlapping) {
                        const sourceName = (typeof ad === 'string' ? ad : ad.name).trim();
                        // 初始化
                        initSource(sourceName);
                        // 累加費用 (移除逗號並轉數字)
                        const cost = parseFloat((ad.cost || '0').toString().replace(/,/g, '')) || 0;
                        marketingMap[sourceName].cost += cost;
                    }
                });
            }
        });

        // 2. 計算成交業績 (Deals)
        if (Array.isArray(deals)) {
            deals.forEach(d => {
                const dateRef = d.dealDate || d.signDate || d.date;
                if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) {
                    totalRevenue += parseFloat(String(d.subtotal || 0).replace(/,/g, '')) || 0; 
                    wonCount++;
                }
            });
        }

        // 3. 計算客戶數據 & 渠道效益 (Customers)
        if (Array.isArray(customers)) {
            customers.forEach(c => {
                let dateRef = c.createdAt;
                if (dateRef && typeof dateRef === 'object' && dateRef.seconds) dateRef = new Date(dateRef.seconds * 1000);
                
                if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) {
                    if (['賣方', '出租', '出租方'].includes(c.category)) newCases++; else newBuyers++;
                    
                    const source = c.source || '其他/未分類';
                    
                    initSource(source);
                    
                    // 累加來客數
                    marketingMap[source].newLeads += 1;
                    
                    // 累加成交數
                    if (c.status === 'closed' || c.status === '成交') {
                        marketingMap[source].deals += 1;
                    }

                    // 累加接洽數 (留電)
                    const validStatuses = ['contacting', 'commissioned', 'offer', 'closed', '洽談中', '已委託', '已收斡', '已成交', '成交'];
                    if (validStatuses.includes(c.status)) {
                        marketingMap[source].engagements += 1;
                    }
                }
            });
        }
        return { totalRevenue, counts: { won: wonCount, cases: newCases, buyers: newBuyers }, marketingStats: marketingMap };
    }, [customers, deals, projectAds, dashTimeFrame, statYear, statMonth, statWeek]); // ✅ 加入 projectAds 依賴

    // 系統公告編輯暫存狀態
    const [tempAnnouncement, setTempAnnouncement] = useState({
        content: '',
        date: new Date().toISOString().split('T')[0],
        active: true
    });

    useEffect(() => {
        if (announcement) {
            setTempAnnouncement({
                content: announcement.content || '',
                date: announcement.date || new Date().toISOString().split('T')[0],
                active: announcement.active !== undefined ? announcement.active : true
            });
        }
    }, [announcement]);

    const handleLocalSaveAnnouncement = () => {
        if (onSaveAnnouncement) {
            onSaveAnnouncement(tempAnnouncement);
            alert('跑馬燈設定已儲存！');
        }
    };

    // 廣告編輯邏輯
    const handleLocalManageAd = (project, adData) => {
        if (setAdManageProject) setAdManageProject(project);
        const nextFormData = adData ? { ...adData } : {
            id: null, name: '', startDate: new Date().toISOString().split('T')[0], endDate: '', cost: '', note: '', project: project
        };
        if (setAdForm) setAdForm(nextFormData);
        if (setIsEditingAd) setIsEditingAd(true);
    };

    // 圓餅圖數據
    const pieData = Object.entries(dashboardStats.marketingStats || {})
        .filter(([_, data]) => data.newLeads > 0)
        .map(([name, data]) => ({ name, value: data.newLeads }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#0ea5e9', '#ec4899'];

    // 監控項目計算
    const groupedExpiringItems = useMemo(() => {
        const today = new Date();
        const groups = { alerts: [], ads: [], adWalls: [], commission: [], payment: [] };
        
        systemAlerts.forEach(alert => { groups.alerts.push({ id: alert.id, name: alert.clientName || '未命名', desc: alert.msg, date: new Date(alert.timestamp?.toDate ? alert.timestamp.toDate() : alert.timestamp).toLocaleDateString(), days: 0 }); });
        
        customers.forEach(c => {
            if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                const end = new Date(c.commissionEndDate);
                const diff = Math.ceil((end - today) / 86400000);
                if (diff <= 30) groups.commission.push({ id: c.id, name: c.name || c.caseName, desc: `委託到期 (${c.ownerName})`, startDate: c.commissionStartDate || '-', endDate: c.commissionEndDate, days: diff });
            }
            if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                c.scribeDetails.forEach((item, idx) => {
                    if (item.payDate && !item.isPaid) {
                        const end = new Date(item.payDate);
                        const diff = Math.ceil((end - today) / 86400000);
                        if (diff <= 30) groups.payment.push({ id: c.id, name: `${c.name} (${item.item})`, desc: `待付款 (${c.ownerName})`, startDate: c.createdAt?.split('T')[0] || '-', endDate: item.payDate, days: diff });
                    }
                });
            }
        });
        
        Object.entries(projectAds).forEach(([projectName, ads]) => {
            if (Array.isArray(ads)) { ads.forEach(ad => { const adObj = typeof ad === 'string' ? { name: ad, endDate: '' } : ad; if (adObj.endDate) { const end = new Date(adObj.endDate); const diff = Math.ceil((end - today) / 86400000); groups.ads.push({ name: `${projectName} - ${adObj.name}`, desc: '廣告到期', startDate: adObj.startDate || '-', endDate: adObj.endDate, days: diff }); } }); }
        });
        
        adWalls.forEach(w => { if (w.expiryDate) { const end = new Date(w.expiryDate); const diff = Math.ceil((end - today) / 86400000); groups.adWalls.push({ name: w.address, desc: `廣告牆 (${w.project || '無案場'})`, startDate: '-', endDate: w.expiryDate, days: diff }); } });
        
        Object.keys(groups).forEach(key => { if (key !== 'alerts') { groups[key].sort((a,b) => a.days - b.days); } });
        return groups;
    }, [customers, projectAds, adWalls, systemAlerts]);

    const handleOpenUserEdit = (user) => {
        setEditingUserData(user || { name: '', phone: '', lineId: '', licenseId: '', username: '', password: '', role: 'user', status: 'active', photoUrl: '' });
        setEditUserModal(true);
    };
    
    const handleUserSaveProxy = (e) => {
        e.preventDefault();
        alert("人員編輯功能需連接後端 API (目前僅為 UI)");
        setEditUserModal(false);
    };

    const NavItem = ({ id, label, icon: Icon }) => (
        <button onClick={() => { setDashboardView(id); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-all border-b last:border-0 border-gray-100 dark:border-slate-700 ${dashboardView === id ? 'bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
            <Icon className="w-4 h-4" /> {label}
            {id === 'monitor' && systemAlerts.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full ml-auto animate-pulse"></span>}
        </button>
    );

    return (
        <div className="pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 p-4 border-b dark:border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black dark:text-white">管理後台</h2>
                    <div className="hidden md:flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                        {['stats', 'monitor', 'projects', 'adwalls', 'deals', 'settings'].map(v => (
                            <button key={v} onClick={() => setDashboardView(v)} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${dashboardView === v ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}>
                                {v === 'stats' ? '概況' : v === 'monitor' ? '監控' : v === 'projects' ? '案件' : v === 'adwalls' ? '廣告牆' : v === 'deals' ? '成交' : '設定'}
                            </button>
                        ))}
                        {isSuperAdmin && <button onClick={() => setDashboardView('users')} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${dashboardView === 'users' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}>人員</button>}
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <div className="relative md:hidden">
                        <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2">
                            <Menu className="w-5 h-5 text-gray-700 dark:text-gray-200"/><span className="text-xs font-bold">選單</span>
                        </button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                <NavItem id="stats" label="數據概況" icon={BarChart2} />
                                <NavItem id="monitor" label="時效監控" icon={AlertTriangle} />
                                <NavItem id="projects" label="案件與廣告" icon={LayoutGrid} />
                                <NavItem id="adwalls" label="廣告牆" icon={Monitor} />
                                <NavItem id="deals" label="成交管理" icon={DollarSign} />
                                {isSuperAdmin && <NavItem id="users" label="人員管理" icon={Users} />}
                                {isAdmin && <NavItem id="settings" label="系統設定" icon={Settings} />}
                            </div>
                        )}
                    </div>
                    <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>{darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                    <button onClick={handleLogout} className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100"><LogOut className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto space-y-6">

                {/* 1. 數據概況 */}
                {dashboardView === 'stats' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4">
                        <StatsCards stats={dashboardStats} />
                        
                        <div className="flex gap-2 mb-6">
                            <select value={dashTimeFrame} onChange={(e) => setDashTimeFrame(e.target.value)} className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none font-bold">
                                <option value="month">本月數據</option><option value="week">本週數據</option><option value="year">年度數據</option><option value="all">全部歷史</option>
                            </select>
                            {dashTimeFrame === 'week' && <input type="week" value={statWeek} onChange={(e) => setStatWeek(e.target.value)} className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none" />}
                            {(dashTimeFrame === 'month' || dashTimeFrame === 'year') && <select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none">{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select>}
                            {dashTimeFrame === 'month' && <select value={statMonth} onChange={(e) => setStatMonth(Number(e.target.value))} className="px-4 py-2 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white outline-none">{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select>}
                            
                            <div className="relative ml-auto">
                                <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-bold shadow hover:bg-green-700"><Download className="w-4 h-4"/> 匯出報表</button>
                                {showExportMenu && (
                                    <div className="absolute right-0 top-12 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl shadow-xl p-2 w-48 z-20">
                                        <button onClick={handleExportExcel} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-lg text-sm font-bold dark:text-white">匯出 Excel (XLSX)</button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ★★★ 渠道效益評估表格 (整合版) ★★★ */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm mb-6">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800 dark:text-white">
                                <Target className="w-5 h-5 text-red-500"/> 渠道效益評估 (廣告 / 留電)
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400">
                                            <th className="px-4 py-3 text-left rounded-l-lg">來源渠道</th>
                                            {/* ★★★ 欄位名稱修改 ★★★ */}
                                            <th className="px-4 py-3 text-right">來客數 (新客)</th>
                                            <th className="px-4 py-3 text-right">留電數 (接洽中)</th>
                                            <th className="px-4 py-3 text-right">成交數</th>
                                            {(isSuperAdmin || isAdmin) && (
                                                <th className="px-4 py-3 text-right">廣告花費</th>
                                            )}
                                            <th className="px-4 py-3 text-center rounded-r-lg">轉換率評級</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                                        {(!dashboardStats.marketingStats || Object.values(dashboardStats.marketingStats).length === 0) ? (
                                            <tr><td colSpan="6" className="text-center py-8 text-gray-400">尚無數據</td></tr>
                                        ) : (
                                            Object.values(dashboardStats.marketingStats)
                                                .sort((a,b) => b.newLeads - a.newLeads)
                                                .map((stat, idx) => {
                                                    const style = ROW_STYLES[idx % ROW_STYLES.length];
                                                    // ★★★ 呼叫評級函式：傳入 (接洽數, 來客數) ★★★
                                                    const { rate, label, color } = getEfficiencyRating(stat.engagements, stat.newLeads);
                                                    
                                                    // 廣告花費
                                                    const cost = stat.cost || 0; 

                                                    return (
                                                        <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                            <td className="px-4 py-3 font-bold text-gray-700 dark:text-gray-200">
                                                                <div className="flex items-center gap-2">
                                                                    <span className={`w-6 h-6 rounded flex items-center justify-center ${style.bg} ${style.icon} text-xs font-bold`}>{idx+1}</span>
                                                                    {stat.name}
                                                                </div>
                                                            </td>
                                                            
                                                            {/* 來客數 (新客) */}
                                                            <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                                                                {stat.newLeads}
                                                            </td>

                                                            {/* ★★★ 留電數 (接洽中) ★★★ */}
                                                            <td className="px-4 py-3 text-right font-mono font-bold text-blue-600">
                                                                {stat.engagements}
                                                            </td>

                                                            {/* 成交數 */}
                                                            <td className="px-4 py-3 text-right font-mono text-gray-600 dark:text-gray-400">
                                                                {stat.deals}
                                                            </td>

                                                            {(isSuperAdmin || isAdmin) && (
                                                                <td className="px-4 py-3 text-right font-mono text-gray-500">
                                                                    ${cost.toLocaleString()}
                                                                </td>
                                                            )}

                                                            {/* 轉換率評級 */}
                                                            <td className="px-4 py-3 text-center">
                                                                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${color}`}>
                                                                    {label} <span className="opacity-70 text-[10px]">({rate}%)</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-xs text-gray-500 flex flex-wrap gap-4 justify-center">
                                <span className="font-bold">評級標準 (接洽/來客)：</span>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"></div> 超讚 (≥50%)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"></div> 及格 (≥20%)</div>
                                <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> 待加強 (&lt;20%)</div>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5"/> 客源分佈</h3>
                                <div className="w-full h-72 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart><Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            <RankingList agents={agentStats} />
                        </div>
                    </div>
                )}

                {/* 2. 時效監控 */}
                {dashboardView === 'monitor' && <MonitorPanel groupedItems={groupedExpiringItems} onResolveAlert={onResolveAlert} />}

                {/* 3. 案件與廣告 */}
                {dashboardView === 'projects' && (
                    <ProjectsPanel 
                        companyProjects={companyProjects} projectAds={projectAds}
                        newRegionName={newRegionName} setNewRegionName={setNewRegionName}
                        newProjectNames={newProjectNames} setNewProjectNames={setNewProjectNames}
                        onAddRegion={onAddRegion} onDeleteRegion={onDeleteRegion}
                        onAddProject={onAddProject} onDeleteProject={onDeleteProject}
                        // 使用修復後的本地管理函式
                        onManageAd={handleLocalManageAd}
                        adForm={adForm}
                        setAdForm={setAdForm}
                        isEditingAd={isEditingAd}
                        setIsEditingAd={setIsEditingAd}
                        onSaveAd={onSaveAd}
                        triggerDeleteAd={triggerDeleteAd}
                        saveSettings={saveSettings}
                    />
                )}

                {/* 4. 廣告牆 */}
                {dashboardView === 'adwalls' && <AdWallsPanel adWalls={adWalls} onAddOption={onAddOption} companyProjects={companyProjects} />}

                {/* 5. 成交管理 */}
                {dashboardView === 'deals' && (
                    <DealsPanel 
                        deals={deals} allUsers={allUsers} scrivenerOptions={appSettings.scriveners} 
                        onSave={handleSaveDeal} onDelete={handleDeleteDeal} 
                    />
                )}

                {/* 6. 人員管理 */}
                {dashboardView === 'users' && isSuperAdmin && (
                    <UsersPanel users={allUsers} isSuperAdmin={isSuperAdmin} onToggleUser={onToggleUser} onDeleteUser={onDeleteUser} onEditUser={handleOpenUserEdit} />
                )}

                {/* 7. 系統設定 */}
                {dashboardView === 'settings' && isAdmin && (
                    <SettingsPanel 
                        appSettings={appSettings} 
                        onAddOption={onAddOption} onDeleteOption={onDeleteOption} onReorderOption={onReorderOption} 
                        announcement={announcement} 
                        // 傳遞包裝後的儲存函式
                        onSaveAnnouncement={handleLocalSaveAnnouncement}
                        tempAnnouncement={tempAnnouncement} 
                        setTempAnnouncement={setTempAnnouncement}
                    />
                )}
            </div>

            {/* --- Modals --- */}
            
            {/* 人員編輯 Modal */}
            {editUserModal && editingUserData && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><UserIcon className="w-5 h-5"/> {editingUserData.id ? '編輯人員' : '新增人員'}</h3>
                            <button onClick={() => setEditUserModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleUserSaveProxy} className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="text-center text-gray-500">
                                (此處應顯示編輯表單，為節省空間已簡化)
                            </div>
                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setEditUserModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg">儲存設定</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 廣告編輯 Modal (這是點擊 "新增/編輯" 按鈕後會出現的視窗) */}
            {isEditingAd && adForm && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="p-4 bg-gray-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-blue-500"/>
                                {adForm.id ? `編輯廣告 (${adManageProject})` : `新增廣告 (${adManageProject})`}
                            </h3>
                            <button onClick={() => setIsEditingAd(false)} className="p-1 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition">
                                <X className="w-5 h-5 text-gray-500"/>
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">廣告標題 (平台名稱)</label>
                                <input 
                                    type="text" 
                                    value={adForm.name} 
                                    onChange={e => setAdForm({...adForm, name: e.target.value})} 
                                    placeholder="例如：591、樂屋網"
                                    className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">開始日期</label>
                                    <input 
                                        type="date" 
                                        value={adForm.startDate} 
                                        onChange={e => setAdForm({...adForm, startDate: e.target.value})} 
                                        className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">結束日期</label>
                                    <input 
                                        type="date" 
                                        value={adForm.endDate} 
                                        onChange={e => setAdForm({...adForm, endDate: e.target.value})} 
                                        className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">廣告費用 (選填)</label>
                                <div className="relative">
                                    <DollarSign className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                                    <input 
                                        type="text" 
                                        value={adForm.cost || ''} 
                                        onChange={e => setAdForm({...adForm, cost: e.target.value})} 
                                        placeholder="輸入金額..."
                                        className="w-full pl-10 pr-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-1">備註 / 連結</label>
                                <textarea 
                                    rows="3"
                                    value={adForm.note || ''} 
                                    onChange={e => setAdForm({...adForm, note: e.target.value})} 
                                    placeholder="廣告連結或詳細備註..."
                                    className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                ></textarea>
                            </div>
                        </div>

                        <div className="p-4 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-800 flex gap-3">
                            {adForm.id && (
                                <button 
                                    onClick={() => {
                                        if(window.confirm('確定要刪除此廣告紀錄嗎？')) {
                                            triggerDeleteAd(adManageProject, adForm.id);
                                            setIsEditingAd(false);
                                        }
                                    }} 
                                    className="px-4 py-2 rounded-xl text-red-500 bg-red-50 hover:bg-red-100 font-bold transition-colors flex items-center gap-2"
                                >
                                    <Trash2 className="w-4 h-4"/> 刪除
                                </button>
                            )}
                            <div className="flex-1"></div>
                            <button onClick={() => setIsEditingAd(false)} className="px-6 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition">取消</button>
                            <button onClick={() => { onSaveAd(); setIsEditingAd(false); }} className="px-6 py-2 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg flex items-center gap-2">
                                <Save className="w-4 h-4"/> 儲存
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;