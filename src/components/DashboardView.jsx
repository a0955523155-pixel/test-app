import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, Users, TrendingUp, Calendar, PieChart, 
  MapPin, Settings, LogOut, Sun, Moon, Target, BarChart2, Award, 
  Plus, Trash2, Edit, Save, X, DollarSign, FileText, Image as ImageIcon,
  Clock, AlertTriangle, CheckCircle, LayoutTemplate, Menu, ChevronDown, 
  ChevronRight, Building2, Monitor, ExternalLink, Megaphone, UserPlus, Sparkles,
  LayoutGrid, Shield, Briefcase, Filter, User, Database, ArrowRight
} from 'lucide-react';
import { getFirestore, doc, updateDoc, addDoc, collection, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore'; 
import { appId } from '../config/constants'; 
import DealForm from './DealForm'; 
import {
  PieChart as RechartsPie, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

// --- 行政區資料 ---
const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

// --- ★★★ 核心輔助：萬能日期物件轉換 ★★★ ---
const getSafeDateObj = (val) => {
    if (!val) return null;
    try {
        // 1. Firebase Timestamp
        if (val.seconds) return new Date(val.seconds * 1000);
        // 2. JS Date Object
        if (val instanceof Date) return val;
        // 3. String
        if (typeof val === 'string') {
            // 處理 "2023/01/01" -> "2023-01-01" (Safari 相容)
            const standardStr = val.replace(/\//g, '-').trim();
            const d = new Date(standardStr);
            if (!isNaN(d.getTime())) return d;
        }
    } catch (e) { return null; }
    return null;
};

// --- 日期區間比對函式 ---
const checkDateMatch = (dateRef, timeFrame, targetYear, targetMonth, targetWeekStr) => {
    const date = getSafeDateObj(dateRef);
    if (!date) return false;

    if (timeFrame === 'all') return true;
    if (timeFrame === 'year') return date.getFullYear() === targetYear;
    if (timeFrame === 'month') return date.getFullYear() === targetYear && (date.getMonth() + 1) === targetMonth;
    
    if (timeFrame === 'week') {
        if (!targetWeekStr) return false;
        const [wYear, wWeek] = targetWeekStr.split('-W').map(Number);
        const simpleDate = new Date(wYear, 0, 1 + (wWeek - 1) * 7);
        const dow = simpleDate.getDay();
        const ISOweekStart = simpleDate;
        if (dow <= 4) ISOweekStart.setDate(simpleDate.getDate() - simpleDate.getDay() + 1);
        else ISOweekStart.setDate(simpleDate.getDate() + 8 - simpleDate.getDay());
        const startDate = new Date(ISOweekStart);
        startDate.setHours(0,0,0,0);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        return date >= startDate && date < endDate;
    }
    return false;
};

const getAdEfficiency = (rate) => {
    const percentage = rate * 100;
    if (percentage >= 20) return { label: '🏆 優異', color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/30', desc: '>20%' };
    if (percentage >= 10) return { label: '✅ 合格', color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/30', desc: '10-20%' };
    return { label: '⚠️ 待優化', color: 'text-red-600', bg: 'bg-red-100 dark:bg-red-900/30', desc: '<10%' };
};

const MonitorSection = ({ title, count, icon: Icon, children, defaultOpen = false, colorClass = "text-gray-700" }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    return (
        <div className="border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden mb-3">
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <div className={`flex items-center gap-2 font-bold ${colorClass}`}><Icon className="w-5 h-5"/>{title}{count > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">{count}</span>}</div>
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400"/> : <div className="text-gray-400 text-xs">展開</div>}
            </button>
            {isOpen && <div className="p-3 bg-white dark:bg-slate-900 animate-in slide-in-from-top-2">{children}</div>}
        </div>
    );
};

const DashboardView = ({ 
    saveSettings, customers, isAdmin, isSuperAdmin, currentUser, darkMode, toggleDarkMode, handleLogout, 
    dashTimeFrame, setDashTimeFrame, companyProjects, projectAds, allUsers, 
    newRegionName, setNewRegionName, newProjectNames, setNewProjectNames, 
    onAddRegion, onDeleteRegion, onAddProject, onDeleteProject, 
    onToggleUser, onDeleteUser, onManageAd, adManageProject, setAdManageProject, 
    adForm, setAdForm, isEditingAd, setIsEditingAd, dashboardView, setDashboardView, 
    handleExportExcel, isExporting, showExportMenu, setShowExportMenu, 
    appSettings, onAddOption, onDeleteOption, onReorderOption, 
    deals, handleSaveDeal, handleDeleteDeal, 
    statYear, setStatYear, statMonth, setStatMonth, 
    onSaveAd, onEditAdInit, triggerDeleteAd, onEditAd, onDeleteAd,
    announcement, onSaveAnnouncement, adWalls, systemAlerts, onResolveAlert,
    statWeek, setStatWeek, onOpenProfile, onOpenSettings
}) => {
    
    const safeProjects = companyProjects || {};
    const safeAds = projectAds || {};
    const safeUsers = Array.isArray(allUsers) ? allUsers : [];
    const safeDeals = Array.isArray(deals) ? deals : [];
    const safeAppSettings = appSettings || { sources: [], categories: [], levels: [], scriveners: [] };
    const safeCustomers = Array.isArray(customers) ? customers : [];
    const safeAdWalls = Array.isArray(adWalls) ? adWalls : [];
    const safeAlerts = Array.isArray(systemAlerts) ? systemAlerts : [];

    const [editingDeal, setEditingDeal] = useState(null);
    const [showDealForm, setShowDealForm] = useState(false);
    const [tempAnnouncement, setTempAnnouncement] = useState(announcement || '');
    const [newScrivener, setNewScrivener] = useState({ name: '', phone: '' });
    const [collapsedRegions, setCollapsedRegions] = useState({});
    
    const [adWallForm, setAdWallForm] = useState({ city: '高雄市', district: '', road: '', size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' });
    const [isEditingAdWall, setIsEditingAdWall] = useState(false);
    const [editingAdWallId, setEditingAdWallId] = useState(null);

    const [editUserModal, setEditUserModal] = useState(false);
    const [editingUserData, setEditingUserData] = useState(null);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const [cleanStatus, setCleanStatus] = useState({ loading: false, result: '' });

    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleScanAndClean = async () => {
        if (!currentUser?.companyCode) return;
        if (!confirm("⚠️ 警告：這將會掃描並刪除所有「無效資料」。\n\n判定標準：\n1. 姓名為「未命名」、「未命名匯入」或空白\n2. 電話為「無電話」或空白\n\n確定要執行嗎？")) return;

        setCleanStatus({ loading: true, result: '正在掃描與清理中...' });
        const db = getFirestore();
        
        try {
            const q = query(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), where("companyCode", "==", currentUser.companyCode));
            const snapshot = await getDocs(q);
            
            const batch = writeBatch(db);
            let deleteCount = 0;
            const invalidKeywords = ['未命名', '未命名匯入', '無電話', '', null, undefined];

            snapshot.forEach(doc => {
                const data = doc.data();
                const nameInvalid = invalidKeywords.includes(data.name) || !data.name;
                const phoneInvalid = invalidKeywords.includes(data.phone) || !data.phone;

                if (nameInvalid || phoneInvalid) {
                    batch.delete(doc.ref);
                    deleteCount++;
                }
            });

            if (deleteCount > 0) {
                await batch.commit();
                setCleanStatus({ loading: false, result: `✅ 已成功清除 ${deleteCount} 筆無效資料！` });
            } else {
                setCleanStatus({ loading: false, result: '🎉 系統很乾淨，沒有發現無效資料。' });
            }
        } catch (error) {
            console.error("Clean Error:", error);
            setCleanStatus({ loading: false, result: '❌ 清理失敗：' + error.message });
        }
    };

    const handleAiGenerate = () => {
        const quotes = ["堅持不是因為看到希望，而是堅持了才看到希望！", "每一份努力，都是在為未來的自己儲蓄。", "業績治百病，成交解千愁！", "相信自己，你是最棒的！", "沒有奇蹟，只有累積。", "再長的路，一步步也能走完。", "專注於目標，而不是障礙。"];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        setTempAnnouncement(randomQuote);
    };

    const generateAdWallMapLink = () => {
        const fullAddr = `${adWallForm.city}${adWallForm.district}${adWallForm.road}`;
        if (!adWallForm.district || !adWallForm.road) { alert("請先選擇區域並輸入路名"); return; }
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
        setAdWallForm({ ...adWallForm, googleMapUrl: link });
    };

    const handleAddScrivener = () => {
        if (!newScrivener.name || !newScrivener.phone) return alert("請輸入姓名與電話");
        const currentList = safeAppSettings.scriveners || [];
        const updated = [...currentList, newScrivener];
        onAddOption('scriveners', updated);
        setNewScrivener({ name: '', phone: '' });
    };

    const handleDeleteScrivener = (index) => {
        const currentList = safeAppSettings.scriveners || [];
        const updated = currentList.filter((_, i) => i !== index);
        onAddOption('scriveners', updated);
    };

    const handleUserSaveProxy = (e) => {
        e.preventDefault();
        alert("請使用 App.jsx 的 handleSaveUser (目前僅為 UI 展示)");
        setEditUserModal(false);
    };

    const handleUserImageUpload = (e) => { 
        const file = e.target.files[0]; 
        if (file) { 
            if (file.size > 800 * 1024) return alert("圖片太大"); 
            const reader = new FileReader(); 
            reader.onloadend = () => { setEditingUserData(prev => ({ ...prev, photoUrl: reader.result })); }; 
            reader.readAsDataURL(file); 
        } 
    };

    const handleOpenUserEdit = (user) => {
        if (user) {
            setEditingUserData(user);
        } else {
            setEditingUserData({
                name: '', phone: '', lineId: '', licenseId: '',
                username: '', password: '', role: 'user', status: 'active', photoUrl: ''
            });
        }
        setEditUserModal(true);
    };

    const handleDragStart = (e, project, sourceRegion) => { if (!e.dataTransfer) return; e.dataTransfer.setData('project', project); e.dataTransfer.setData('sourceRegion', sourceRegion); };
    const handleDragOver = (e) => { e.preventDefault(); };
    const handleDrop = (e, targetRegion) => { e.preventDefault(); if (!e.dataTransfer) return; const project = e.dataTransfer.getData('project'); const sourceRegion = e.dataTransfer.getData('sourceRegion'); if (!project || !sourceRegion || sourceRegion === targetRegion) return; if (!saveSettings) return; const updatedProjects = { ...safeProjects }; if (!Array.isArray(updatedProjects[sourceRegion])) updatedProjects[sourceRegion] = []; if (!Array.isArray(updatedProjects[targetRegion])) updatedProjects[targetRegion] = []; updatedProjects[sourceRegion] = updatedProjects[sourceRegion].filter(p => p !== project); if (!updatedProjects[targetRegion].includes(project)) { updatedProjects[targetRegion] = [...updatedProjects[targetRegion], project]; } if (collapsedRegions[targetRegion]) { setCollapsedRegions(prev => ({ ...prev, [targetRegion]: false })); } saveSettings(updatedProjects, null); };
    const toggleRegion = (region) => { setCollapsedRegions(prev => ({ ...prev, [region]: !prev[region] })); };

    const handleSaveAdWall = () => {
        if (!adWallForm.district || !adWallForm.road) return alert("請完整填寫地址");
        const fullAddress = `${adWallForm.city}${adWallForm.district}${adWallForm.road}`;
        let updatedList;
        if (isEditingAdWall && editingAdWallId) {
            updatedList = safeAdWalls.map(w => w.id === editingAdWallId ? { ...adWallForm, address: fullAddress, id: editingAdWallId } : w);
        } else {
            const newItem = { ...adWallForm, address: fullAddress, id: Date.now() };
            updatedList = [...safeAdWalls, newItem];
        }
        onAddOption('adWalls', updatedList);
        resetAdWallForm();
    };

    const resetAdWallForm = () => {
        setAdWallForm({ city: '高雄市', district: '', road: '', size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' });
        setIsEditingAdWall(false);
        setEditingAdWallId(null);
    };

    const handleEditAdWall = (wallItem) => {
        setAdWallForm({ city: wallItem.city || '高雄市', district: wallItem.district || '', road: wallItem.road || '', size: wallItem.size || '', price: wallItem.price || '', expiryDate: wallItem.expiryDate || '', project: wallItem.project || '', googleMapUrl: wallItem.googleMapUrl || '' });
        setIsEditingAdWall(true);
        setEditingAdWallId(wallItem.id);
    };

    const handleDeleteAdWall = (id) => {
        if(confirm("確定刪除此廣告牆資料？")) {
            const updated = safeAdWalls.filter(w => w.id !== id);
            onAddOption('adWalls', updated);
            if (id === editingAdWallId) resetAdWallForm();
        }
    };

    // ★★★ 核心統計邏輯 (頂部卡片 + 圓餅圖) ★★★
    const stats = useMemo(() => {
        let totalRevenue = 0; 
        let closedCount = 0; 
        let newCasesCount = 0; 
        let totalNewInquiries = 0; 
        
        const marketingStats = {};
        const defaultSources = ['FB', '591', '帆布', '現場客', '介紹'];
        const configuredSources = safeAppSettings.sources && safeAppSettings.sources.length > 0 ? safeAppSettings.sources : defaultSources;
        
        configuredSources.forEach(src => { marketingStats[src] = { newLeads: 0, activeLeads: 0, closedDeals: 0 }; });
        if (!marketingStats['其他']) marketingStats['其他'] = { newLeads: 0, activeLeads: 0, closedDeals: 0 };

        // 1. 成交計算 (不分來源，只要是成交單就計算)
        if (Array.isArray(safeDeals)) {
            safeDeals.forEach(d => {
                const dateRef = d.dealDate || d.signDate || d.date;
                if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) {
                    const sub = parseFloat(String(d.subtotal || 0).replace(/,/g, '')) || 0;
                    totalRevenue += sub;
                    closedCount++;
                }
            });
        }

        // 2. 客戶統計 (分母計算)
        if (Array.isArray(safeCustomers)) {
            safeCustomers.forEach(c => {
                const isNewInTimeFrame = checkDateMatch(c.createdAt, dashTimeFrame, statYear, statMonth, statWeek);
                const catRaw = (c.category || '').trim();
                
                // 排除案件
                const isCase = ['賣', '出租', '屋主'].some(k => catRaw.includes(k));
                if (isCase) {
                    if (isNewInTimeFrame) newCasesCount++; 
                    return; 
                }

                // 只算買方/租客
                const isBuyer = ['買', '租', '客', '承租'].some(k => catRaw.includes(k));

                if (isNewInTimeFrame && isBuyer) {
                    totalNewInquiries++; 

                    // 來源歸因
                    let rawSrc = String(c.source || '其他'); 
                    let srcStr = rawSrc.trim(); 
                    let matchedSource = '其他';
                    const lowerSrc = srcStr.toLowerCase();
                    
                    if (configuredSources.includes(srcStr)) { matchedSource = srcStr; } 
                    else { for (const s of configuredSources) { if (lowerSrc.includes(s.toLowerCase())) { matchedSource = s; break; } } }
                    
                    if (!marketingStats[matchedSource]) { marketingStats[matchedSource] = { newLeads: 0, activeLeads: 0, closedDeals: 0 }; }
                    marketingStats[matchedSource].newLeads++;

                    // 有效留電
                    const validStatuses = ['contacting', 'commissioned', 'offer', 'closed'];
                    if (validStatuses.includes(c.status)) { 
                        marketingStats[matchedSource].activeLeads++; 
                    }
                }
            });
        }

        Object.keys(marketingStats).forEach(key => {
            const data = marketingStats[key];
            data.conversionRate = data.newLeads > 0 ? (data.activeLeads / data.newLeads) : 0;
            data.efficiency = getAdEfficiency(data.conversionRate);
        });

        // 業務排行榜
        const agentPerf = {};
        safeDeals.forEach(d => {
            const dateRef = d.dealDate || d.signDate || d.date;
            if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) {
                 const processAgent = (agentList) => { if(Array.isArray(agentList)) { agentList.forEach(ag => { if(ag.user){ if(!agentPerf[ag.user]) agentPerf[ag.user] = 0; agentPerf[ag.user] += parseFloat(String(ag.amount||0).replace(/,/g,'')) || 0; } }); } };
                 processAgent(d.devAgents); processAgent(d.salesAgents);
                 if(d.agentName && !d.devAgents && !d.salesAgents) { if(!agentPerf[d.agentName]) agentPerf[d.agentName] = 0; agentPerf[d.agentName] += parseFloat(String(d.subtotal||0).replace(/,/g,'')) || 0; }
            }
        });
        const rankedAgents = Object.entries(agentPerf).map(([name, commission]) => ({ name, commission })).sort((a,b) => b.commission - a.commission);

        return { totalRevenue, closedCount, newCasesCount, totalNewInquiries, marketingStats, rankedAgents };
    }, [safeCustomers, safeDeals, dashTimeFrame, statYear, statMonth, statWeek, safeAppSettings.sources]);

    // ★★★ 核心修正：ROI 分析 (專案廣告成效) ★★★
    const projectROI = useMemo(() => {
        // 1. 定義時間範圍 View Range
        const today = new Date();
        let viewStart, viewEnd;

        if (dashTimeFrame === 'week') {
            const [wYear, wWeek] = statWeek.split('-W').map(Number);
            const simpleDate = new Date(wYear, 0, 1 + (wWeek - 1) * 7);
            const day = simpleDate.getDay(); 
            const diff = simpleDate.getDate() - day + (day === 0 ? -6 : 1);
            viewStart = new Date(simpleDate.setDate(diff)); viewStart.setHours(0,0,0,0);
            viewEnd = new Date(viewStart); viewEnd.setDate(viewStart.getDate() + 6); viewEnd.setHours(23,59,59,999);
        } else if (dashTimeFrame === 'month') {
            viewStart = new Date(statYear, statMonth - 1, 1);
            viewEnd = new Date(statYear, statMonth, 0, 23, 59, 59, 999);
        } else if (dashTimeFrame === 'year') {
            viewStart = new Date(statYear, 0, 1);
            viewEnd = new Date(statYear, 11, 31, 23, 59, 59, 999);
        } else {
            viewStart = new Date(2000, 0, 1); 
            viewEnd = new Date(2100, 11, 31);
        }

        const result = {};

        Object.keys(safeProjects).forEach(region => {
            const projects = safeProjects[region] || [];
            projects.forEach(proj => {
                const ads = safeAds[proj] || [];
                const adStats = []; 
                let totalAllocatedCost = 0;

                // A. 計算廣告攤提成本
                ads.forEach(ad => {
                    const adObj = typeof ad === 'string' ? { name: ad, cost: 0, startDate: '', endDate: '' } : ad;
                    if (!adObj.startDate || !adObj.endDate) return;

                    const adStart = new Date(adObj.startDate);
                    const adEnd = new Date(adObj.endDate);
                    
                    const totalAdDays = Math.max(1, (adEnd - adStart) / (1000 * 60 * 60 * 24));
                    const dailyCost = Number(adObj.cost || 0) / totalAdDays;

                    // 計算時間重疊 (Intersection)
                    const overlapStart = adStart > viewStart ? adStart : viewStart;
                    const overlapEnd = adEnd < viewEnd ? adEnd : viewEnd;
                    
                    let overlapDays = 0;
                    if (overlapStart <= overlapEnd) {
                        overlapDays = Math.floor((overlapEnd - overlapStart) / (1000 * 60 * 60 * 24)) + 1;
                    }

                    const allocatedCost = Math.round(dailyCost * overlapDays);
                    // 只要有重疊天數或成本，就列入統計
                    if (allocatedCost > 0 || overlapDays > 0) {
                        totalAllocatedCost += allocatedCost;
                        adStats.push({ 
                            name: adObj.name, 
                            cost: allocatedCost, 
                            leads: 0, 
                            inquiries: 0 
                        });
                    }
                });

                // B. 計算專案來客與留電 (歸因到廣告)
                let totalProjectInquiries = 0;
                let totalProjectLeads = 0;

                safeCustomers.forEach(c => {
                    // 1. 確保是「本區間」新增的客戶
                    const isNew = checkDateMatch(c.createdAt, dashTimeFrame, statYear, statMonth, statWeek);
                    
                    // 2. 確保是「買方」且「非案件」
                    const catRaw = (c.category || '').trim();
                    const isBuyer = ['買', '租', '客', '承租'].some(k => catRaw.includes(k));
                    const isCase = ['賣', '出租', '屋主'].some(k => catRaw.includes(k));

                    if (isNew && isBuyer && !isCase) {
                        // 3. 寬鬆比對：客戶是否屬於此專案 (標籤 或 文字搜尋)
                        let isTargetProject = false;
                        if (Array.isArray(c.project)) {
                            // 標籤比對 (去除空白)
                            isTargetProject = c.project.some(p => p.trim() === proj.trim());
                        } else if (c.project) {
                            isTargetProject = c.project.trim() === proj.trim();
                        }

                        // 文字搜尋 Fallback (備註、區域、姓名)
                        if (!isTargetProject) {
                             const searchStr = (c.reqRegion + c.remarks + c.name).toLowerCase();
                             if (searchStr.includes(proj.toLowerCase())) isTargetProject = true;
                        }

                        if (isTargetProject) {
                            totalProjectInquiries++;
                            
                            const isLead = ['contacting', 'offer', 'closed'].includes(c.status);
                            if (isLead) totalProjectLeads++;

                            // 4. 歸因到特定廣告 (Source Matching)
                            adStats.forEach(adStat => {
                                const adName = adStat.name.toLowerCase();
                                const sourceName = String(c.source || '').toLowerCase(); // 強制轉字串防崩潰
                                // 雙向比對：來源含廣告名 或 廣告名含來源
                                if (adName.includes(sourceName) || sourceName.includes(adName)) {
                                    adStat.inquiries++;
                                    if (isLead) adStat.leads++;
                                }
                            });
                        }
                    }
                });

                // 顯示條件：只要有廣告成本 OR 有來客數據，就顯示該專案
                if (totalAllocatedCost > 0 || totalProjectInquiries > 0) {
                    const conversionRate = totalProjectInquiries > 0 ? ((totalProjectLeads / totalProjectInquiries) * 100).toFixed(1) : 0;
                    
                    result[proj] = { 
                        totalCost: totalAllocatedCost, 
                        totalInquiries: totalProjectInquiries,
                        totalLeads: totalProjectLeads,
                        conversionRate,
                        cpl: totalProjectLeads > 0 ? Math.round(totalAllocatedCost / totalProjectLeads) : 0,
                        adBreakdown: adStats 
                    };
                }
            });
        });
        return result;
    }, [safeProjects, safeAds, safeCustomers, dashTimeFrame, statYear, statMonth, statWeek]);

    const groupedExpiringItems = useMemo(() => {
        const today = new Date();
        const groups = { alerts: [], ads: [], adWalls: [], commission: [], payment: [] };
        
        safeAlerts.forEach(alert => { groups.alerts.push({ id: alert.id, name: alert.clientName || '未命名', desc: alert.msg, date: new Date(alert.timestamp?.toDate ? alert.timestamp.toDate() : alert.timestamp).toLocaleDateString(), days: 0 }); });
        
        safeCustomers.forEach(c => {
            if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                const end = new Date(c.commissionEndDate);
                const diff = Math.ceil((end - today) / 86400000);
                if (diff <= 30) groups.commission.push({ name: c.name || c.caseName, desc: `委託到期 (${c.ownerName})`, startDate: c.commissionStartDate || '-', endDate: c.commissionEndDate, days: diff });
            }
            if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                c.scribeDetails.forEach(item => {
                    if (item.payDate && !item.isPaid) {
                        const end = new Date(item.payDate);
                        const diff = Math.ceil((end - today) / 86400000);
                        if (diff <= 30) groups.payment.push({ name: `${c.name} (${item.item})`, desc: `待付款 (${c.ownerName})`, startDate: c.createdAt?.split('T')[0] || '-', endDate: item.payDate, days: diff });
                    }
                });
            }
        });
        
        Object.entries(safeAds).forEach(([projectName, ads]) => {
            if (Array.isArray(ads)) { ads.forEach(ad => { const adObj = typeof ad === 'string' ? { name: ad, endDate: '' } : ad; if (adObj.endDate) { const end = new Date(adObj.endDate); const diff = Math.ceil((end - today) / 86400000); groups.ads.push({ name: `${projectName} - ${adObj.name}`, desc: '廣告到期', startDate: adObj.startDate || '-', endDate: adObj.endDate, days: diff }); } }); }
        });
        
        safeAdWalls.forEach(w => { if (w.expiryDate) { const end = new Date(w.expiryDate); const diff = Math.ceil((end - today) / 86400000); groups.adWalls.push({ name: w.address, desc: `廣告牆 (${w.project || '無案場'})`, startDate: '-', endDate: w.expiryDate, days: diff }); } });
        
        Object.keys(groups).forEach(key => { if (key !== 'alerts') { groups[key].sort((a,b) => a.days - b.days); } });
        return groups;
    }, [safeCustomers, safeAds, safeAdWalls, safeAlerts]);

    const pieData = Object.entries(stats.marketingStats).filter(([_, data]) => data.newLeads > 0).map(([name, data]) => ({ name, value: data.newLeads }));
    const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#6b7280', '#0ea5e9', '#ec4899'];

    const renderMonitorItem = (item) => {
        let dayColor = 'text-green-600';
        if (item.days < 0) dayColor = 'text-red-600';
        else if (item.days <= 7) dayColor = 'text-orange-500';
        return (
            <div key={item.name + item.endDate} className="flex justify-between items-center p-3 border-b last:border-0 border-gray-100 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                <div><div className="font-bold text-sm text-gray-800 dark:text-gray-200">{item.name}</div><div className="text-xs text-gray-500">{item.desc}</div></div>
                <div className="text-right"><div className={`text-sm font-bold ${dayColor}`}>{item.days < 0 ? `過期 ${Math.abs(item.days)} 天` : `剩 ${item.days} 天`}</div><div className="text-[10px] text-gray-400 font-mono">{item.endDate}</div></div>
            </div>
        );
    };

    const NavItem = ({ id, label, icon: Icon }) => (
        <button onClick={() => { setDashboardView(id); setIsMenuOpen(false); }} className={`flex items-center gap-3 w-full px-4 py-3 text-sm font-bold transition-all border-b last:border-0 border-gray-100 dark:border-slate-700 ${dashboardView === id ? 'bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'}`}>
            <Icon className="w-4 h-4" /> {label}
            {id === 'monitor' && safeAlerts.length > 0 && <span className="w-2 h-2 bg-red-500 rounded-full ml-auto animate-pulse"></span>}
        </button>
    );

    return (
        <div className="pb-20 w-full">
            {(showDealForm || editingDeal) && <DealForm deal={editingDeal} allUsers={safeUsers} scrivenerOptions={safeAppSettings.scriveners || []} onSave={(data) => { handleSaveDeal(data); setShowDealForm(false); setEditingDeal(null); }} onCancel={() => { setShowDealForm(false); setEditingDeal(null); }} onDelete={(id) => { handleDeleteDeal(id); setShowDealForm(false); setEditingDeal(null); }} />}

            <div className={`w-full px-4 pt-8 pb-4 sticky top-0 z-20 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center">
                    <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                        <LayoutDashboard className="w-6 h-6 text-blue-600"/> 
                        {dashboardView === 'stats' && '數據決策中心'}
                        {dashboardView === 'monitor' && '時效監控中心'}
                        {dashboardView === 'projects' && '案件與廣告管理'}
                        {dashboardView === 'adwalls' && '廣告牆佈局'}
                        {dashboardView === 'deals' && '成交業績管理'}
                        {dashboardView === 'users' && '團隊權限管理'}
                        {dashboardView === 'settings' && '系統參數設定'}
                    </h1>
                    <div className="flex items-center gap-2" ref={menuRef}>
                        {dashboardView === 'stats' && (
                            <div className="hidden sm:flex items-center gap-2 bg-white dark:bg-slate-800 border dark:border-slate-700 px-3 py-2 rounded-xl shadow-sm mr-2">
                                <select value={dashTimeFrame} onChange={(e) => setDashTimeFrame(e.target.value)} className="bg-transparent outline-none text-xs font-bold dark:text-white cursor-pointer mr-2">
                                    <option value="week">本週</option><option value="month">本月</option><option value="year">本年</option><option value="all">全部</option>
                                </select>
                                {dashTimeFrame === 'week' ? ( <input type="week" value={statWeek} onChange={(e) => setStatWeek(e.target.value)} className="bg-transparent outline-none text-xs font-bold dark:text-white w-24" /> ) : (
                                    <div className="flex gap-1">
                                        <select value={statYear} onChange={(e) => setStatYear(Number(e.target.value))} className="bg-transparent outline-none text-xs font-bold dark:text-white cursor-pointer">{Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map(y => <option key={y} value={y}>{y}年</option>)}</select>
                                        {dashTimeFrame === 'month' && <select value={statMonth} onChange={(e) => setStatMonth(Number(e.target.value))} className="bg-transparent outline-none text-xs font-bold dark:text-white cursor-pointer">{Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}</select>}
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="relative">
                            <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2.5 bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm flex items-center gap-2"><Menu className="w-5 h-5 text-gray-700 dark:text-gray-200"/><span className="hidden sm:inline text-xs font-bold">選單</span></button>
                            {isMenuOpen && (
                                <div className="absolute right-0 top-12 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                                    <div className="p-2 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700"><div className="text-xs font-bold text-gray-400 pl-2">功能切換</div></div>
                                    <NavItem id="stats" label="數據概況" icon={BarChart2} />
                                    <NavItem id="monitor" label="時效監控" icon={AlertTriangle} />
                                    <NavItem id="projects" label="案件與廣告" icon={LayoutGrid} />
                                    <NavItem id="adwalls" label="廣告牆" icon={Monitor} />
                                    <NavItem id="deals" label="成交管理" icon={DollarSign} />
                                    {isSuperAdmin && <NavItem id="users" label="人員管理" icon={Users} />}
                                    {isAdmin && <NavItem id="settings" label="系統設定" icon={Settings} />}
                                    <div className="p-2 border-t border-gray-100 dark:border-slate-700 flex justify-between">
                                        <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700">{darkMode ? <Sun className="w-4 h-4 text-yellow-400"/> : <Moon className="w-4 h-4 text-slate-400"/>}</button>
                                        <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><LogOut className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-4 py-4">
                {dashboardView === 'stats' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 頂部四張卡片 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">總業績 (Revenue)</div><div className="text-3xl font-black text-gray-800 dark:text-white font-mono tracking-tight">${stats.totalRevenue.toLocaleString()} <span className="text-sm text-gray-400 font-normal">萬</span></div></div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">成交件數 (Closed)</div><div className="text-3xl font-black text-gray-800 dark:text-white font-mono tracking-tight">{stats.closedCount} <span className="text-sm text-gray-400 font-normal">件</span></div></div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">本月新客 (Inquiries)</div><div className="text-3xl font-black text-gray-800 dark:text-white font-mono tracking-tight">{stats.totalNewInquiries} <span className="text-sm text-gray-400 font-normal">人</span></div></div>
                            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-800 relative overflow-hidden"><div className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">新增案件 (Inventory)</div><div className="text-3xl font-black text-blue-600 dark:text-blue-400 font-mono tracking-tight">{stats.newCasesCount} <span className="text-sm text-gray-400 font-normal">件</span></div></div>
                        </div>

                        {/* 廣告渠道效率評估 */}
                        {(isSuperAdmin || isAdmin) && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-lg border border-gray-200 dark:border-slate-800 overflow-hidden">
                                <div className="p-6 border-b border-gray-100 dark:border-slate-800 bg-gradient-to-r from-blue-50 to-white dark:from-slate-800 dark:to-slate-900">
                                    <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2"><Target className="w-6 h-6 text-blue-600"/> 廣告渠道效率評估</h2>
                                    <p className="text-sm text-gray-500 mt-1">只計算「買方/承租方」。留電率 = 有效留電(洽談) / 總來客數(含未留電)。</p>
                                </div>
                                <div className="p-0 overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 border-b dark:border-slate-700"><tr><th className="p-4 rounded-l-lg">廣告來源</th><th className="p-4">總來客 (Inquiries)</th><th className="p-4">有效留電 (Leads)</th><th className="p-4">留電率 (Rate)</th><th className="p-4 rounded-r-lg text-right">效率評級</th></tr></thead>
                                        <tbody className="divide-y dark:divide-slate-800">
                                            {Object.entries(stats.marketingStats).sort((a,b) => b[1].newLeads - a[1].newLeads).map(([source, data]) => (
                                                <tr key={source} className="hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                                                    <td className="p-4 font-bold text-gray-800 dark:text-white">{source}</td><td className="p-4 font-mono text-gray-600 dark:text-gray-400">{data.newLeads}</td><td className="p-4 font-mono text-blue-600 font-bold">{data.activeLeads}</td><td className="p-4 font-mono font-bold">{(data.conversionRate * 100).toFixed(1)}%</td>
                                                    <td className="p-4 text-right"><div className="flex flex-col items-end"><span className={`px-3 py-1 rounded-full text-xs font-black tracking-wide ${data.efficiency.bg} ${data.efficiency.color}`}>{data.efficiency.label}</span><span className="text-[10px] text-gray-400 mt-1">{data.efficiency.desc}</span></div></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* 各案場廣告投放與效益 (ROI Analysis) */}
                        {(isSuperAdmin || isAdmin) && (
                            <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 p-6">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2"><Megaphone className="w-5 h-5"/> 各案場廣告投放與效益 (ROI Analysis)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {Object.entries(safeProjects).map(([region, projects]) => (
                                        <div key={region} className="space-y-4">
                                            {projects.map(proj => {
                                                const projectData = projectROI[proj];
                                                if (!projectData) return null;

                                                return (
                                                    <div key={proj} className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-200 dark:border-slate-700">
                                                        <div className="flex justify-between items-center mb-2">
                                                            <h4 className="font-bold text-gray-800 dark:text-white truncate flex-1">{proj}</h4>
                                                            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded ml-2 whitespace-nowrap">{region}</span>
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 mb-3">
                                                            <div className="bg-white dark:bg-slate-800 p-2 rounded border dark:border-slate-600">
                                                                <div className="text-[10px] text-gray-500">廣告花費</div>
                                                                <div className="font-bold text-red-500">${projectData.totalCost.toLocaleString()}</div>
                                                            </div>
                                                            <div className="bg-white dark:bg-slate-800 p-2 rounded border dark:border-slate-600">
                                                                <div className="text-[10px] text-gray-500">每客成本</div>
                                                                <div className="font-bold text-blue-500">${projectData.cpl}</div>
                                                            </div>
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500 border-t dark:border-slate-700 pt-2">
                                                            <span>總來客: <b>{projectData.totalInquiries}</b></span>
                                                            <span>留電: <b className="text-green-600">{projectData.totalLeads}</b></span>
                                                            <span>率: <b>{projectData.conversionRate}%</b></span>
                                                        </div>
                                                        <div className="mt-3 space-y-1">
                                                            {projectData.adBreakdown.map((ad, idx) => (
                                                                <div key={idx} className="flex justify-between text-[10px] text-gray-500 bg-white dark:bg-slate-900 p-1.5 rounded border dark:border-slate-600">
                                                                    <span className="truncate flex-1">{ad.name}</span>
                                                                    <span className="font-bold text-gray-700 dark:text-gray-300 mx-2">${ad.cost}</span>
                                                                    <span className="text-blue-500">{ad.inquiries}來/{ad.leads}留</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5"/> 客源分佈</h3>
                                <div className="w-full h-72 min-h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RechartsPie><Pie data={pieData} innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">{pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip contentStyle={{backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff'}} itemStyle={{color: '#fff'}} /><Legend /></RechartsPie>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            
                            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2"><Award className="w-5 h-5"/> 業務排行榜</h3>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                                    {stats.rankedAgents.map((agent, idx) => (
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
                        </div>
                    </div>
                )}
                
                {dashboardView === 'monitor' && (
                    <div className="space-y-2 animate-in fade-in duration-300">
                        <MonitorSection title="系統警示" count={groupedExpiringItems.alerts.length} icon={AlertTriangle} defaultOpen={true} colorClass="text-red-600">{groupedExpiringItems.alerts.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無警示</p> : groupedExpiringItems.alerts.map(alert => (<div key={alert.id} className="flex justify-between items-start p-3 border-b border-red-100 last:border-0 bg-red-50 dark:bg-red-900/10 rounded mb-1"><div><p className="text-sm font-bold text-gray-800 dark:text-gray-200">{alert.desc}</p><p className="text-xs text-gray-500">{alert.date}</p></div><button onClick={() => onResolveAlert(alert.id)} className="text-xs bg-white border border-red-200 text-red-600 px-2 py-1 rounded hover:bg-red-100">消除</button></div>))}</MonitorSection>
                        <MonitorSection title="廣告時效 (591/FB...)" count={groupedExpiringItems.ads.length} icon={Megaphone} colorClass="text-blue-600">{groupedExpiringItems.ads.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期廣告</p> : groupedExpiringItems.ads.map(item => renderMonitorItem(item))}</MonitorSection>
                        <MonitorSection title="廣告牆時效 (看板)" count={groupedExpiringItems.adWalls.length} icon={Monitor} colorClass="text-purple-600">{groupedExpiringItems.adWalls.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期看板</p> : groupedExpiringItems.adWalls.map(item => renderMonitorItem(item))}</MonitorSection>
                        <MonitorSection title="委託及斡旋期限" count={groupedExpiringItems.commission.length} icon={FileText} defaultOpen={true} colorClass="text-orange-600">{groupedExpiringItems.commission.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期項目</p> : groupedExpiringItems.commission.map(item => renderMonitorItem(item))}</MonitorSection>
                        <MonitorSection title="代書付款期限" count={groupedExpiringItems.payment.length} icon={DollarSign} colorClass="text-green-600">{groupedExpiringItems.payment.length === 0 ? <p className="text-xs text-gray-400 text-center py-2">無即將到期款項</p> : groupedExpiringItems.payment.map(item => renderMonitorItem(item))}</MonitorSection>
                    </div>
                )}
                
                {dashboardView === 'adwalls' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-4 flex items-center gap-2"><Monitor className="w-5 h-5 text-blue-500"/> 廣告牆管理</h3>
                            <div className={`bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 space-y-3 border ${isEditingAdWall ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-200 dark:border-slate-700'}`}>
                                {isEditingAdWall && <div className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1"><Edit className="w-3 h-3"/> 正在編輯項目...</div>}
                                <div className="grid grid-cols-2 gap-2"><div><label className="text-xs text-gray-500 font-bold block mb-1">縣市</label><select value={adWallForm.city} onChange={e => setAdWallForm({...adWallForm, city: e.target.value, district: ''})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}>{Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}</select></div><div><label className="text-xs text-gray-500 font-bold block mb-1">區域</label><select value={adWallForm.district} onChange={e => setAdWallForm({...adWallForm, district: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}><option value="">請選擇</option>{REGIONS_DATA[adWallForm.city]?.map(d => <option key={d} value={d}>{d}</option>)}</select></div></div>
                                <div><label className="text-xs text-gray-500 font-bold block mb-1">路名與詳細位置 (必填)</label><input value={adWallForm.road} onChange={e => setAdWallForm({...adWallForm, road: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="例如: 中正路100號旁" /></div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2"><div><label className="text-xs text-gray-500">尺寸</label><input value={adWallForm.size} onChange={e => setAdWallForm({...adWallForm, size: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="10x20" /></div><div><label className="text-xs text-gray-500">價格</label><input value={adWallForm.price} onChange={e => setAdWallForm({...adWallForm, price: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="月租" /></div><div><label className="text-xs text-gray-500">期限</label><input type="date" value={adWallForm.expiryDate} onChange={e => setAdWallForm({...adWallForm, expiryDate: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} /></div><div><label className="text-xs text-gray-500">綁定案場</label><select value={adWallForm.project} onChange={e => setAdWallForm({...adWallForm, project: e.target.value})} className={`w-full p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`}><option value="">(無/不綁定)</option>{safeProjects && Object.entries(safeProjects).map(([region, projects]) => (<optgroup key={region} label={region}>{Array.isArray(projects) && projects.map(p => (<option key={p} value={p}>{p}</option>))}</optgroup>))}</select></div></div>
                                <div><label className="text-xs text-gray-500 font-bold block mb-1">Google 地圖連結</label><div className="flex gap-2"><input value={adWallForm.googleMapUrl} onChange={e => setAdWallForm({...adWallForm, googleMapUrl: e.target.value})} className={`flex-1 p-2 rounded border text-sm ${darkMode?'bg-slate-800 border-slate-600':'bg-white'}`} placeholder="http://..." /><button onClick={generateAdWallMapLink} className="px-3 bg-blue-100 text-blue-600 rounded font-bold text-xs hover:bg-blue-200 whitespace-nowrap">📍 轉連結</button></div></div>
                                <div className="flex gap-2">{isEditingAdWall && (<button onClick={resetAdWallForm} className="flex-1 bg-gray-200 text-gray-600 p-2 rounded font-bold text-sm hover:bg-gray-300">取消</button>)}<button onClick={handleSaveAdWall} className={`flex-1 text-white p-2 rounded font-bold text-sm shadow-md ${isEditingAdWall ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{isEditingAdWall ? '儲存變更' : '新增廣告牆資料'}</button></div>
                            </div>
                            <div className="space-y-2">{safeAdWalls.map(w => { const days = w.expiryDate ? Math.ceil((new Date(w.expiryDate) - new Date()) / 86400000) : 999; return (<div key={w.id} className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${editingAdWallId === w.id ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}><div><div className="font-bold flex items-center gap-2">{w.address} <span className="text-xs text-gray-400 font-normal">({w.size})</span>{w.googleMapUrl && (<a href={w.googleMapUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-4 h-4"/></a>)}</div><div className="text-xs text-gray-500">案場: {w.project || '無'} | 價格: {w.price}</div></div><div className="flex items-center gap-2"><div className={`text-xs font-bold mr-2 ${days < 0 ? 'text-red-500' : days < 30 ? 'text-orange-500' : 'text-green-500'}`}>{days < 0 ? '已過期' : `剩 ${days} 天`}</div><button onClick={() => handleEditAdWall(w)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button><button onClick={() => handleDeleteAdWall(w.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button></div></div>); })}</div>
                        </div>
                    </div>
                )}
                
                {dashboardView === 'projects' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        <div className="flex gap-2"><input value={newRegionName} onChange={(e) => setNewRegionName(e.target.value)} placeholder="新分類名稱 (如: 高雄區)" className={`flex-1 px-3 py-2 rounded-lg border text-sm ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button onClick={onAddRegion} className="bg-blue-600 text-white px-4 rounded-lg text-sm font-bold">新增</button></div>
                        <div className="space-y-4">
                            {Object.entries(safeProjects).map(([region, list]) => (
                                <div key={region} className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} onDragOver={handleDragOver} onDrop={(e) => handleDrop(e, region)}>
                                    <div className="flex justify-between items-center mb-3 cursor-pointer select-none bg-gray-50 dark:bg-slate-700/50 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors" onClick={() => toggleRegion(region)}><h3 className="font-bold text-lg flex items-center gap-2">{collapsedRegions[region] ? <ChevronRight className="w-5 h-5 text-gray-500"/> : <ChevronDown className="w-5 h-5 text-gray-500"/>}<Building2 className="w-4 h-4 text-blue-500"/> {region}<span className="text-xs text-gray-400 font-normal">({Array.isArray(list) ? list.length : 0})</span></h3><div className="flex gap-2" onClick={e => e.stopPropagation()}><button onClick={() => onDeleteRegion(region)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button></div></div>
                                    {!collapsedRegions[region] && Array.isArray(list) && (<div className="animate-in slide-in-from-top-2 fade-in duration-200"><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">{list.map(item => { const adCount = (safeAds[item] || []).length; return (<div key={item} draggable="true" onDragStart={(e) => handleDragStart(e, item, region)} className="bg-gray-50 dark:bg-slate-700 p-2 rounded-lg flex justify-between items-center border dark:border-slate-600 cursor-grab active:cursor-grabbing hover:bg-blue-50 dark:hover:bg-slate-600 transition-colors"><span className="text-sm font-bold truncate flex-1">{item}</span><div className="flex items-center gap-1"><button onClick={() => onManageAd(item, region)} className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${adCount > 0 ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-500'}`} title="管理此案件的廣告"><Megaphone className="w-3 h-3"/> {adCount > 0 ? adCount : '+'}</button><button onClick={() => onDeleteProject(region, item)} className="p-1 text-gray-400 hover:text-red-500"><X className="w-4 h-4"/></button></div></div>); })}</div><div className="flex gap-2"><input value={newProjectNames[region] || ''} onChange={(e) => setNewProjectNames({ ...newProjectNames, [region]: e.target.value })} placeholder={`新增 ${region} 的案件`} className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => onAddProject(region)} className="bg-gray-200 text-gray-700 px-3 rounded text-xs font-bold">＋</button></div></div>)}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {dashboardView === 'deals' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="flex justify-end"><button onClick={() => setShowDealForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-colors"><Plus className="w-4 h-4"/> 新增成交報告</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{safeDeals.length === 0 ? <p className="col-span-full text-center py-10 text-gray-400">尚無成交報告</p> : safeDeals.map(deal => (<div key={deal.id} className={`p-4 rounded-2xl border cursor-pointer hover:border-blue-400 transition-all ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`} onClick={() => setEditingDeal(deal)}><div className="flex justify-between items-start mb-2"><h3 className="font-bold text-lg line-clamp-1">{deal.caseName || '未命名案件'}</h3><span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">{deal.dealDate}</span></div><div className="text-sm text-gray-500 mb-2">成交總價: <span className="font-bold text-blue-500">{deal.totalPrice}</span></div><div className="flex justify-between text-xs text-gray-400"><span>賣: {deal.sellerName}</span><span>買: {deal.buyerName}</span></div></div>))}</div>
                    </div>
                )}

                {dashboardView === 'users' && isSuperAdmin && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="flex justify-between items-center mb-4"><h3 className="font-bold">人員與權限管理 ({safeUsers.length})</h3><button onClick={() => handleOpenUserEdit(null)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-700"><UserPlus className="w-4 h-4"/> 新增人員</button></div>
                            <div className="space-y-2">{safeUsers.map(user => (<div key={user.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${user.status === 'suspended' ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900' : 'bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden border border-gray-300">{user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-gray-400"/>}</div><div><div className="font-bold text-sm flex items-center gap-2">{user.name} <span className={`text-[10px] px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>{user.role}</span></div><div className="text-xs text-gray-500 font-mono">@{user.username}</div></div></div><div className="flex gap-2"><button onClick={() => handleOpenUserEdit(user)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="編輯資料"><Edit className="w-4 h-4"/></button><button onClick={() => onDeleteUser(user)} className={`text-xs px-3 py-1 rounded font-bold transition-colors ${user.status === 'suspended' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}>{user.status === 'suspended' ? '已停權' : '正常'}</button></div></div>))}</div>
                        </div>
                    </div>
                )}
                
                {dashboardView === 'settings' && isAdmin && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 資料庫維護區塊 */}
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <h3 className="font-bold mb-3 flex items-center gap-2 text-red-600"><Database className="w-5 h-5"/> 資料庫維護</h3>
                            <p className="text-sm text-gray-500 mb-3">若匯入失敗導致產生大量無效資料 (無姓名/無電話)，可使用此功能一鍵清除。</p>
                            
                            <div className="flex items-center gap-3">
                                <button onClick={handleScanAndClean} disabled={cleanStatus.loading} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${cleanStatus.loading ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}>
                                    {cleanStatus.loading ? '處理中...' : <><Trash2 className="w-4 h-4"/> 掃描並刪除無效資料</>}
                                </button>
                                {cleanStatus.result && <span className="text-sm font-bold text-blue-600 animate-in fade-in">{cleanStatus.result}</span>}
                            </div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-3">跑馬燈公告</h3><div className="flex gap-2"><input value={tempAnnouncement} onChange={(e) => setTempAnnouncement(e.target.value)} className={`flex-1 px-3 py-2 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => onSaveAnnouncement(tempAnnouncement)} className="bg-blue-600 text-white px-4 rounded font-bold text-sm">更新</button><button onClick={handleAiGenerate} className="bg-purple-100 text-purple-700 px-4 rounded font-bold text-sm flex items-center gap-1 hover:bg-purple-200 transition-colors"><Sparkles className="w-3 h-3"/> AI 勉勵</button></div></div>
                        <div className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-3 flex items-center gap-2"><UserPlus className="w-4 h-4"/> 代書資料管理</h3><div className="space-y-2 mb-3">{safeAppSettings.scriveners.map((scr, idx) => (<div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-slate-900 p-2 rounded"><div className="text-sm font-bold">{scr.name} <span className="font-normal text-gray-500 text-xs">({scr.phone})</span></div><button onClick={() => handleDeleteScrivener(idx)} className="text-red-400 hover:text-red-600"><X className="w-4 h-4"/></button></div>))}</div><div className="flex gap-2"><input value={newScrivener.name} onChange={e => setNewScrivener({...newScrivener, name: e.target.value})} placeholder="代書姓名" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><input value={newScrivener.phone} onChange={e => setNewScrivener({...newScrivener, phone: e.target.value})} placeholder="電話" className={`flex-1 px-3 py-1 rounded border text-sm ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={handleAddScrivener} className="bg-green-600 text-white px-3 rounded text-xs font-bold">＋</button></div></div>
                        {['sources', 'categories', 'levels'].map(type => (<div key={type} className={`p-4 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}><h3 className="font-bold mb-3 capitalize">{type === 'sources' ? '來源' : type === 'categories' ? '分類' : '等級'}設定</h3><div className="flex flex-wrap gap-2 mb-3">{(safeAppSettings[type] || []).map(opt => (<span key={opt} className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2">{opt} <button onClick={() => onDeleteOption(type, opt)} className="text-blue-300 hover:text-blue-500">×</button></span>))}</div><div className="flex gap-2"><input id={`input-${type}`} placeholder="新增選項" className={`flex-1 px-3 py-1 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-600' : 'bg-white'}`} /><button onClick={() => { const el = document.getElementById(`input-${type}`); onAddOption(type, el.value); el.value=''; }} className="bg-blue-600 text-white px-3 rounded text-xs font-bold">＋</button></div></div>))}
                    </div>
                )}
            </div>
            
            {/* 案件廣告管理彈窗 */}
            {adManageProject && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                        <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3">
                            <h3 className="text-lg font-bold flex items-center gap-2">管理廣告: {adManageProject}</h3>
                            <button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X/></button>
                        </div>
                        <div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                            <select value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}>
                                <option value="">請選擇廣告平台</option>
                                {(appSettings.sources || []).map(src => (
                                    <option key={src} value={src}>{src}</option>
                                ))}
                            </select>
                            
                            <div className="flex gap-2 items-center">
                                <span className="text-xs text-gray-400">起</span>
                                <input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                                <span className="text-xs text-gray-400">迄</span>
                                <input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                            </div>
                            
                            <input type="number" value={adForm.cost} onChange={(e) => setAdForm({...adForm, cost: e.target.value})} placeholder="廣告費用 ($)" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                            
                            <button onClick={onSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button>
                        </div>
                        
                        <div className="space-y-2">
                            {(projectAds[adManageProject] || [])
                                .sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0))
                                .map((ad, idx) => { 
                                    const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '', cost: 0 } : ad; 
                                    return (
                                        <div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold">{adObj.name}</span>
                                                    <span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">${Number(adObj.cost || 0).toLocaleString()}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{adObj.startDate || '無'} ~ {adObj.endDate || '無'}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                <button onClick={() => onEditAdInit(ad)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit className="w-4 h-4"/></button>
                                                <button onClick={() => triggerDeleteAd(adObj)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        </div>
                                    ); 
                                })
                            }
                            {(projectAds[adManageProject] || []).length === 0 && <div className="text-center text-gray-400 text-xs py-4">尚無廣告投放紀錄</div>}
                        </div>
                    </div>
                </div>
            )}

            {/* 人員編輯彈出視窗 */}
            {editUserModal && editingUserData && (
                <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><User className="w-5 h-5"/> {editingUserData.id ? '編輯人員資料與權限' : '新增人員'}</h3>
                            <button onClick={() => setEditUserModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
                        </div>
                        <form onSubmit={handleUserSaveProxy} className="flex-1 overflow-y-auto custom-scrollbar p-6">
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex flex-col items-center gap-3 w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-100 dark:border-slate-700 pb-4 md:pb-0 md:pr-4">
                                    <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                                        {editingUserData.photoUrl ? <img src={editingUserData.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-6 text-gray-400"/>}
                                        <input type="file" accept="image/*" onChange={handleUserImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">更換照片</div>
                                    </div>
                                </div>
                                <div className="flex-1 space-y-6">
                                    <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-100 dark:border-red-900/30 space-y-4">
                                        <h4 className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1 border-b border-red-200 dark:border-red-800 pb-2 mb-2"><Shield className="w-3 h-3"/> 帳號權限管理</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-gray-500 mb-1 block">登入帳號</label><input required value={editingUserData.username} onChange={e=>setEditingUserData({...editingUserData, username: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" disabled={!!editingUserData.id} placeholder="設定後不可改"/></div>
                                            <div><label className="text-xs font-bold text-gray-500 mb-1 block">登入密碼</label><input required value={editingUserData.password} onChange={e=>setEditingUserData({...editingUserData, password: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="可隨時重設"/></div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div><label className="text-xs font-bold text-gray-500 mb-1 block">系統權限</label><select value={editingUserData.role} onChange={e=>setEditingUserData({...editingUserData, role: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"><option value="user">一般業務 (User)</option><option value="admin">管理員 (Admin)</option><option value="super_admin">超級管理員</option></select></div>
                                            <div>
                                                <label className="text-xs font-bold text-gray-500 mb-1 block">帳號狀態</label>
                                                <div className="flex gap-2 mt-2">
                                                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="active" checked={editingUserData.status !== 'suspended'} onChange={() => setEditingUserData({...editingUserData, status: 'active'})} /><span className="text-sm">啟用</span></label>
                                                    <label className="flex items-center gap-1 cursor-pointer"><input type="radio" name="status" value="suspended" checked={editingUserData.status === 'suspended'} onChange={() => setEditingUserData({...editingUserData, status: 'suspended'})} /><span className="text-sm text-red-500">停權</span></label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 space-y-4">
                                        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1 border-b border-blue-200 dark:border-blue-800 pb-2 mb-2"><Briefcase className="w-3 h-3"/> 業務名片資料</h4>
                                        <div className="space-y-3">
                                            <div><label className="text-xs font-bold text-gray-500 mb-1 block">真實姓名</label><input required value={editingUserData.name} onChange={e=>setEditingUserData({...editingUserData, name: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="業務顯示名稱"/></div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-xs font-bold text-gray-500 mb-1 block">聯絡電話</label><input value={editingUserData.phone} onChange={e=>setEditingUserData({...editingUserData, phone: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="09xx-xxx-xxx"/></div>
                                                <div><label className="text-xs font-bold text-gray-500 mb-1 block">LINE ID</label><input value={editingUserData.lineId} onChange={e=>setEditingUserData({...editingUserData, lineId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>
                                            </div>
                                            <div><label className="text-xs font-bold text-gray-500 mb-1 block">營業員證號</label><input value={editingUserData.licenseId} onChange={e=>setEditingUserData({...editingUserData, licenseId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="(110) 登字第 xxxxxx 號"/></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="pt-6 flex gap-3">
                                <button type="button" onClick={() => setEditUserModal(false)} className="flex-1 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">取消</button>
                                <button type="submit" className="flex-1 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"><Save className="w-4 h-4"/> 儲存設定</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DashboardView;