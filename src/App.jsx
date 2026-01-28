import React, { useState, useEffect, useMemo } from 'react';
import { 
  Loader2, Moon, Sun, LogOut, LayoutDashboard, List, Radio, X, MapPin, Bell, CheckCircle, AlertTriangle, BellRing, UserCircle, Settings, Wrench, Phone, Filter, ChevronDown, ChevronUp, User, Calendar, Tag, Briefcase, Users, StickyNote, Eye, Maximize2, Edit, Trash2
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, onAuthStateChanged, signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, setDoc, 
  serverTimestamp, arrayUnion, arrayRemove, getDocs, writeBatch, getDoc
} from 'firebase/firestore';

import { 
    appId, ADMIN_CODE, SUPER_ADMIN_CODE, DEFAULT_SOURCES, DEFAULT_CATEGORIES, 
    DEFAULT_LEVELS, DEFAULT_PROJECTS, DAILY_QUOTES, SYSTEM_ANNOUNCEMENT
} from './config/constants';

import LoginScreen from './components/LoginScreen';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import ClientsView from './components/ClientsView';
import DashboardView from './components/DashboardView';
import VendorsView from './components/VendorsView';
import Marquee from './components/Marquee';

const firebaseConfig = {
  apiKey: "AIzaSyB-0ipmoEDjC98z0l-qM51qTxVWHsTHDls",
  authDomain: "greenshootteam.firebaseapp.com",
  projectId: "greenshootteam",
  storageBucket: "greenshootteam.firebasestorage.app",
  messagingSenderId: "185924188788",
  appId: "1:185924188788:web:90c5212d20dba6c6ba6f21",
  measurementId: "G-CYS5W473VS"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- 輔助函式 ---
const checkDateMatch = (dateRef, timeFrame, targetYear, targetMonth, targetWeekStr) => {
    if (!dateRef) return false;
    let date;
    if (dateRef.seconds) { date = new Date(dateRef.seconds * 1000); } 
    else { date = new Date(dateRef); }
    if (isNaN(date.getTime())) return false;

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

const getCurrentWeekStr = () => { 
    const today = new Date(); 
    const d = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())); 
    const dayNum = d.getUTCDay() || 7; 
    d.setUTCDate(d.getUTCDate() + 4 - dayNum); 
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1)); 
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7); 
    return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`; 
};

// --- 通知視窗元件 ---
const NotificationModal = ({ notifications, onClose, onQuickUpdate, onView }) => {
    if (!notifications || notifications.length === 0) return null;
    return (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500">
                <div className="bg-red-500 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><BellRing className="w-6 h-6"/> 待辦與聯繫提醒 ({notifications.length})</h3>
                    <button onClick={onClose} className="p-1 hover:bg-red-600 rounded-full"><X/></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3 custom-scrollbar">
                    {notifications.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {item.type === 'contact' ? `📞 [${item.level}級] ${item.reason || '需聯繫'}` : (item.type === 'commission' ? '📄 委託即將到期' : '💰 代書款項期限')}
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-bold">
                                    {item.name} <span className="font-normal text-xs">({item.category})</span>
                                </div>
                                {item.type === 'payment' && <div className="text-xs text-blue-500 font-bold">項目: {item.itemName}</div>}
                                {item.type === 'contact' ? (
                                    <div className="text-xs text-red-500 mt-1 font-bold">上次聯繫：{item.lastDate} (已過 {item.days} 天)</div>
                                ) : (
                                    <div className="text-xs text-red-500 mt-1 font-bold">期限：{item.date} (剩 {item.days} 天)</div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <button onClick={() => onView(item.id)} className="px-3 py-1.5 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                    <Eye className="w-3 h-3"/> 查看
                                </button>
                                <button onClick={() => { if(confirm("確認標記為完成？")) onQuickUpdate(item); }} className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors">
                                    <CheckCircle className="w-3 h-3"/> 完成
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- 廣播覆蓋層 ---
const BroadcastOverlay = ({ data, onClose, isPresenter, onView }) => {
    if (!data) return null;
    const [fullScreenImg, setFullScreenImg] = useState(null); 
    const isCase = ['賣方', '出租', '出租方'].includes(data.category);
    const coverPos = data.coverImagePosition || 50;
    const statusMap = { 'new': '新案件', 'contacting': '洽談中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    
    const formatDate = (val) => {
        if (!val) return '無紀錄';
        if (typeof val === 'string') return val.split('T')[0];
        if (val.seconds) return new Date(val.seconds * 1000).toISOString().split('T')[0];
        return '格式錯誤';
    };

    const handleClose = () => { 
        if (isPresenter) { 
            if(confirm("您是廣播發起人，關閉視窗將結束所有人的廣播，確定嗎？")) onClose(true); 
        } else { 
            onClose(false); 
        } 
    };
    
    const attachments = [
        { label: '地籍圖', src: data.imgCadastral },
        { label: '路線圖', src: data.imgRoute },
        { label: '位置圖', src: data.imgLocation },
        { label: '規劃圖', src: data.imgPlan }
    ].filter(item => item.src);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-md">
            {fullScreenImg && (
                <div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 animate-in zoom-in duration-200" onClick={() => setFullScreenImg(null)}>
                    <button className="absolute top-4 right-4 p-4 text-white hover:text-gray-300 z-[210]"><X className="w-10 h-10"/></button>
                    {fullScreenImg.startsWith('data:application/pdf') ? <iframe src={fullScreenImg} className="w-full h-full bg-white rounded-lg border-none"></iframe> : <img src={fullScreenImg} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />}
                </div>
            )}
            <div className="fixed top-4 right-4 z-[110] flex gap-3"><button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors border border-white/20 shadow-lg" title="關閉視窗"><X className="w-6 h-6"/></button></div>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row items-start gap-6 border-b border-gray-700 pb-6">
                            <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
                                {data.photoUrl ? ( <img src={data.photoUrl} alt="Case" className="w-48 h-48 sm:w-64 sm:h-48 object-cover rounded-xl shadow-lg border border-gray-600" style={{ objectPosition: `center ${coverPos}%` }} /> ) : ( <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center text-6xl font-bold shadow-lg ${isCase ? 'bg-orange-600' : 'bg-blue-600'}`}>{data.name?.[0]}</div> )}
                            </div>
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                    <span className={`px-4 py-1.5 rounded-full text-base font-bold ${isCase ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{data.category}</span>
                                    <span className="bg-gray-700 px-4 py-1.5 rounded-full text-base border border-gray-600 font-bold">{statusMap[data.status] || data.status}</span>
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3 text-white break-words">{isCase ? (data.caseName || data.name) : data.name}</h1>
                                <div className="text-xl sm:text-2xl text-gray-300 font-medium flex items-center justify-center md:justify-start gap-2 mb-4"><MapPin className="w-6 h-6 text-gray-500 flex-shrink-0"/>{isCase ? (data.landNo || data.reqRegion) : data.reqRegion}</div>
                                <div className="inline-block bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-600"><div className="text-gray-400 text-sm font-bold mb-1 text-center md:text-left">{isCase ? (isRental ? '租金' : '開價') : '預算'}</div><div className="text-4xl sm:text-5xl font-black text-green-400 font-mono tracking-tighter">{isCase ? data.totalPrice : data.value?.toLocaleString()} <span className="text-xl sm:text-2xl ml-2 text-gray-500">{isCase && isRental ? '元' : '萬'}</span></div></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> 建檔日期</div><div className="text-lg font-bold text-white">{formatDate(data.createdAt)}</div></div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> 最新回報</div><div className="text-lg font-bold text-yellow-400">{data.lastContact || '無'}</div></div>
                            {data.subAgent && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> 次要專員</div><div className="text-lg font-bold text-pink-300">{data.subAgent}</div></div>}
                            {data.industry && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3"/> 行業類別</div><div className="text-lg font-bold text-blue-300">{data.industry}</div></div>}
                            {data.serviceItems && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 sm:col-span-2 lg:col-span-1"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> 服務項目</div><div className="text-lg font-bold text-green-300 truncate">{data.serviceItems}</div></div>}
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 min-h-[300px]">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> 詳細備註</h3>
                                <div className="whitespace-pre-wrap leading-relaxed text-gray-200 text-2xl font-medium flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">{data.remarks || "無詳細備註"}</div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><StickyNote className="w-5 h-5"/> 回報紀錄 ({data.notes?.length || 0})</h3>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]">
                                    {data.notes && data.notes.length > 0 ? ([...data.notes].reverse().map((note, idx) => (<div key={idx} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600"><div className="flex justify-between items-center mb-2 border-b border-slate-600 pb-2"><span className="text-blue-300 font-bold flex items-center gap-1"><UserCircle className="w-4 h-4"/> {note.author}</span><span className="text-gray-400 text-xs">{note.date}</span></div><div className="text-gray-200 whitespace-pre-wrap text-lg font-medium">{note.content}</div></div>))) : (<div className="text-gray-500 text-center py-10">尚無回報紀錄</div>)}
                                </div>
                            </div>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 pt-6 border-t border-gray-700">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5"/> 相關圖資 (點擊放大)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {attachments.map((img, idx) => (
                                        <div key={idx} className="group relative bg-slate-800 p-2 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-all" onClick={() => setFullScreenImg(img.src)}>
                                            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white z-10">{img.label}</div>
                                            {img.src.startsWith('data:application/pdf') ? ( <div className="w-full h-40 bg-white flex items-center justify-center text-slate-800 text-sm font-bold">PDF 文件</div> ) : ( <img src={img.src} alt={img.label} className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" /> )}
                                            <div className="absolute bottom-2 right-2 bg-blue-600/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4 text-white"/></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-slate-950 p-3 text-center text-slate-600 text-xs font-mono uppercase tracking-widest border-t border-slate-800 flex-shrink-0">Broadcast Mode • GreenShoot Team</div>
            </div>
        </div>
    );
};

export default function App() {
  const [sessionUser, setSessionUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); 
  const [customers, setCustomers] = useState([]);
  const [deals, setDeals] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('login'); 
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const [activeTab, setActiveTab] = useState('clients');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [incomingBroadcast, setIncomingBroadcast] = useState(null);
  const [myBroadcastStatus, setMyBroadcastStatus] = useState(false);
  const [broadcastData, setBroadcastData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]); 
  const [companyProjects, setCompanyProjects] = useState({});
  const [projectAds, setProjectAds] = useState({}); 
  const [adWalls, setAdWalls] = useState([]); 
  const [appSettings, setAppSettings] = useState({ sources: DEFAULT_SOURCES, categories: DEFAULT_CATEGORIES, levels: DEFAULT_LEVELS, scriveners: [] });

  const [announcement, setAnnouncement] = useState(SYSTEM_ANNOUNCEMENT);
  
  const [dashboardView, setDashboardView] = useState('stats'); 
  const [newRegionName, setNewRegionName] = useState('');
  const [newProjectNames, setNewProjectNames] = useState({});
  const [adManageProject, setAdManageProject] = useState(null); 
  const [adForm, setAdForm] = useState({ id: '', name: '', startDate: '', endDate: '', cost: '' }); // cost added
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [myProfileData, setMyProfileData] = useState({});
  const [dashTimeFrame, setDashTimeFrame] = useState('month'); 
  const [listMode, setListMode] = useState(() => localStorage.getItem('crm_list_mode') || 'all');
  const [listYear, setListYear] = useState(new Date().getFullYear());
  const [listMonth, setListMonth] = useState(new Date().getMonth() + 1);
  const [listWeekDate, setListWeekDate] = useState(new Date().toISOString().split('T')[0]); 
  const [statYear, setStatYear] = useState(new Date().getFullYear());
  const [statMonth, setStatMonth] = useState(new Date().getMonth() + 1);
  const [statWeek, setStatWeek] = useState(getCurrentWeekStr());
  const [allUsers, setAllUsers] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('crm-dark-mode') === 'true'; } catch { return false; } });

  useEffect(() => { localStorage.setItem('crm_list_mode', listMode); }, [listMode]);
  const toggleDarkMode = () => { setDarkMode(prev => { const newVal = !prev; localStorage.setItem('crm-dark-mode', String(newVal)); return newVal; }); };
  useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); document.body.style.backgroundColor = '#020617'; } else { document.documentElement.classList.remove('dark'); document.body.style.backgroundColor = '#f3f4f6'; } }, [darkMode]);

  // Data Listeners
  useEffect(() => {
      if (!currentUser?.companyCode) return;
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      const q = query(usersRef, where("companyCode", "==", currentUser.companyCode));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setAllUsers(users); 
          const me = users.find(u => u.username === currentUser.username);
          if (me) setCurrentUser(prev => ({...prev, ...me}));
      });
      return () => unsubscribe();
  }, [currentUser?.companyCode, currentUser?.username]);

  useEffect(() => {
      if (!currentUser?.companyCode) return;
      const broadcastRef = doc(db, 'artifacts', appId, 'public', 'system', 'broadcast_data', currentUser.companyCode);
      const unsubscribe = onSnapshot(broadcastRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.isActive) {
                  setMyBroadcastStatus(data.presenterId === currentUser.username);
                  setBroadcastData(data); 
              } else {
                  setIncomingBroadcast(null);
                  setBroadcastData(null);
                  setMyBroadcastStatus(false);
              }
          }
      });
      return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
      if (broadcastData && customers.length > 0) {
          const target = customers.find(c => c.id === broadcastData.targetId);
          if (target) {
              setIncomingBroadcast(target);
          }
      }
  }, [broadcastData, customers]);

  useEffect(() => {
      if (selectedCustomer) {
          const latestData = customers.find(c => c.id === selectedCustomer.id);
          if (latestData && JSON.stringify(latestData) !== JSON.stringify(selectedCustomer)) {
              setSelectedCustomer(latestData);
          }
      }
  }, [customers]);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (error) { setLoading(false); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setSessionUser(u);
      const savedUser = localStorage.getItem('crm-user-profile');
      if (savedUser) { try { setCurrentUser(JSON.parse(savedUser)); setView('list'); } catch (e) { localStorage.removeItem('crm-user-profile'); setView('login'); } } else { setView('login'); }
      setLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
      if (!customers || customers.length === 0 || !currentUser) return;
      const today = new Date();
      const tempNotifications = [];
      const getContactThreshold = (level, status) => {
          if (status === 'lost') return 999;
          if (status === 'closed') return 30;
          if (status === 'commissioned') { if (level === 'A') return 7; if (level === 'B') return 14; return 30; }
          if (level === 'A') return 3; if (level === 'B') return 7; return 14; 
      };
      customers.forEach(c => {
          if (c.owner === currentUser.username) {
              const lastDateStr = c.lastContact || (c.createdAt ? (typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : '') : '');
              if (lastDateStr) {
                  const lastDate = new Date(lastDateStr);
                  if (!isNaN(lastDate.getTime())) {
                      const diffTime = Math.abs(today - lastDate);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      const threshold = getContactThreshold(c.level, c.status);
                      if (diffDays >= threshold && threshold < 999) {
                          let reason = '需聯繫';
                          if (c.status === 'commissioned') reason = '需回報進度';
                          if (c.status === 'closed') reason = '售後關懷';
                          tempNotifications.push({ id: c.id, name: c.name, category: c.category, type: 'contact', level: c.level, lastDate: lastDateStr, days: diffDays, reason: reason });
                      }
                  }
              }
              if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                  const endDate = new Date(c.commissionEndDate);
                  const diffDays = Math.ceil((endDate - today) / (86400000));
                  if (diffDays >= 0 && diffDays <= 7) { tempNotifications.push({ id: c.id, name: c.name || c.caseName, category: c.category, type: 'commission', date: c.commissionEndDate, days: diffDays }); }
              }
              if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                  c.scribeDetails.forEach((item, index) => {
                      if (item.payDate && !item.isPaid) {
                          const payDate = new Date(item.payDate);
                          const diffDays = Math.ceil((payDate - today) / (86400000));
                          if (diffDays >= 0 && diffDays <= 7) { tempNotifications.push({ id: c.id, name: c.name, category: c.category, type: 'payment', date: item.payDate, days: diffDays, itemName: item.item || '未命名款項', itemIndex: index, scribeDetails: c.scribeDetails }); }
                      }
                  });
              }
          }
      });
      setNotifications(tempNotifications);
  }, [customers, currentUser]);

  useEffect(() => {
    if (!sessionUser || !currentUser) return;
    setLoading(true);
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
    const q = currentUser.companyCode ? query(collectionRef, where("companyCode", "==", currentUser.companyCode)) : query(collectionRef); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a, b) => (b.lastContact || '').localeCompare(a.lastContact || ''));
      setCustomers(data);
      setLoading(false);
    }, (error) => { console.error("Snapshot Error:", error); setLoading(false); });
    return () => unsubscribe();
  }, [sessionUser, currentUser]);

  useEffect(() => {
    if (!currentUser?.companyCode) return;
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyProjects(data.projects || DEFAULT_PROJECTS || {});
        setProjectAds(data.projectAds || {}); setAnnouncement(data.announcement || SYSTEM_ANNOUNCEMENT); setAdWalls(data.adWalls || []);
        setAppSettings({ sources: data.sources || DEFAULT_SOURCES, categories: data.categories || DEFAULT_CATEGORIES, levels: data.levels || DEFAULT_LEVELS, scriveners: data.scriveners || [] });
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
      if (currentUser?.companyCode) {
          const dealsRef = collection(db, 'artifacts', appId, 'public', 'data', 'deals');
          const q = query(dealsRef, where("companyCode", "==", currentUser.companyCode));
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
              setDeals(data);
          });
          return () => unsubscribe();
      }
  }, [currentUser]);

  // ★★★ 補回 handleLogin 與 handleRegister ★★★
  const handleLogin = async (username, password) => {
      setLoading(true);
      try {
          const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
          const q = query(usersRef, where("username", "==", username), where("password", "==", password));
          const querySnapshot = await getDocs(q);

          if (!querySnapshot.empty) {
              const userDoc = querySnapshot.docs[0];
              const userData = { id: userDoc.id, ...userDoc.data() };
              if (userData.status === 'suspended') {
                  alert("此帳號已被停權");
                  setLoading(false);
                  return;
              }
              setCurrentUser(userData);
              localStorage.setItem('crm-user-profile', JSON.stringify(userData));
              setView('list');
          } else {
              alert("帳號或密碼錯誤");
          }
      } catch (error) {
          console.error("Login Error", error);
          alert("登入發生錯誤");
      }
      setLoading(false);
  };

  const handleRegister = () => {
      alert("請聯繫管理員建立帳號");
  };

  const handleCustomerClick = (customer) => { setSelectedCustomer(customer); setView('detail'); };
  const handleViewFromNotification = (customerId) => { const target = customers.find(c => c.id === customerId); if (target) { setSelectedCustomer(target); setView('detail'); setNotifications([]); } else { alert("找不到該客戶資料"); } };
  const handleEditCustomer = async (formData) => { if (selectedCustomer.owner !== currentUser.username && !isAdmin) return alert("無權限"); try { const { id, ...rest } = formData; const updateData = { ...rest }; if (updateData.createdAt) { const d = new Date(updateData.createdAt); if (!isNaN(d.getTime())) { updateData.createdAt = d; } else { delete updateData.createdAt; } } Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id), updateData); setSelectedCustomer({ ...selectedCustomer, ...updateData }); setView('detail'); } catch (e) { alert("儲存失敗"); } };
  const handleDeleteCustomer = async () => { if (selectedCustomer.owner !== currentUser.username && !isAdmin) return alert("無權限"); try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id)); setSelectedCustomer(null); setView('list'); } catch(e){ alert("刪除失敗"); } };
  const handleQuickUpdate = async (notiItem) => { try { if (notiItem.type === 'contact') { const todayStr = new Date().toISOString().split('T')[0]; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { lastContact: todayStr }); } else if (notiItem.type === 'commission') { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { isRenewed: true }); } else if (notiItem.type === 'payment') { const updatedDetails = [...notiItem.scribeDetails]; if (updatedDetails[notiItem.itemIndex]) { updatedDetails[notiItem.itemIndex].isPaid = true; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { scribeDetails: updatedDetails }); } } setNotifications(prev => prev.filter(n => !(n.id === notiItem.id && n.type === notiItem.type && n.itemIndex === notiItem.itemIndex))); } catch(e) { console.error(e); } };
  const handleAddNote = async (id, content) => { try { const today = new Date().toISOString().split('T')[0]; const newNote = { id: Date.now(), date: today, content, author: currentUser.name }; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayUnion(newNote), lastContact: today }); if (selectedCustomer && selectedCustomer.id === id) { setSelectedCustomer(prev => ({ ...prev, lastContact: today, notes: [...(prev.notes || []), newNote] })); } } catch(e) { console.error(e); } };
  const handleDeleteNote = async (id, note) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayRemove(note) }); if (selectedCustomer && selectedCustomer.id === id) { setSelectedCustomer(prev => ({ ...prev, notes: (prev.notes || []).filter(n => n.id !== note.id) })); } } catch(e) { console.error(e); } };
  const handleEditNote = async (customerId, noteObj, newContent) => { if (!currentUser) return; try { const custRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId); const docSnap = await getDoc(custRef); if (docSnap.exists()) { const data = docSnap.data(); const currentNotes = data.notes || []; const updatedNotes = currentNotes.map(n => (n.id === noteObj.id) ? { ...n, content: newContent } : n); await updateDoc(custRef, { notes: updatedNotes }); if (selectedCustomer && selectedCustomer.id === customerId) { setSelectedCustomer(prev => ({ ...prev, notes: updatedNotes })); } } } catch(e) { console.error(e); alert("編輯失敗"); } };
  const handleDirectUpdate = async (customerId, updateData) => { if (!customerId || !currentUser) return; try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId), updateData); } catch(e) {} };
  const handleBroadcast = async (target, isActive) => { if (!currentUser?.companyCode) { alert("錯誤：系統無法識別公司代碼"); return; } const targetId = (typeof target === 'object' && target?.id) ? target.id : target; if (isActive && !targetId) { alert("無法廣播：找不到該案件/客戶的 ID"); return; } try { const broadcastRef = doc(db, 'artifacts', appId, 'public', 'system', 'broadcast_data', currentUser.companyCode); await setDoc(broadcastRef, { isActive: isActive, targetId: targetId || null, presenterId: currentUser.username, timestamp: serverTimestamp() }); } catch (e) { alert("廣播失敗"); } };
  const handleOverlayClose = (isGlobalClose) => { if (isGlobalClose) handleBroadcast(null, false); else setIncomingBroadcast(null); };
  const handleBatchImport = async (importedData) => { if (!currentUser) return; setLoading(true); try { const batchPromises = importedData.map(data => { const safeDate = (val) => { if (!val) return new Date(); let d = new Date(val); if (isNaN(d.getTime()) || d.getFullYear() > 3000 || d.getFullYear() < 1900) return new Date(); return d; }; const cleanData = { ...data, owner: currentUser.username, ownerName: currentUser.name, companyCode: currentUser.companyCode, createdAt: safeDate(data.createdAt), lastContact: typeof data.lastContact === 'string' ? data.lastContact : safeDate(data.createdAt).toISOString().split('T')[0], notes: [], value: data.value ? Number(String(data.value).replace(/,/g, '')) : 0 }; Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; }); return addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), cleanData); }); await Promise.all(batchPromises); alert(`成功匯入 ${importedData.length} 筆資料`); } catch (error) { alert("匯入失敗"); } finally { setLoading(false); } };
  const handleBatchDelete = async (ids) => { if (!ids.length || !confirm(`刪除 ${ids.length} 筆？`)) return; setLoading(true); try { const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id))); await batch.commit(); alert("刪除成功"); } catch (e) { alert("刪除失敗"); } finally { setLoading(false); } };
  const handleResolveAlert = async (id) => { if(!currentUser?.companyCode) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'system', 'alerts', id)); } catch(e) {} };
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('crm-user-profile'); setView('login'); setActiveTab('clients'); setSearchTerm(''); setLoading(false); };
  const saveSettingsToFirestore = async (np, na) => { if(!currentUser?.companyCode)return; const p={}; if(np)p.projects=np; if(na)p.projectAds=na; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), p, {merge:true}); }catch(e){} };
  const handleSaveAnnouncement = async (t) => { if(!currentUser?.companyCode)return; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), {announcement:t}, {merge:true}); alert("更新成功"); }catch(e){} };
  const handleAddOption = (type, val) => { if (Array.isArray(val) && (type === 'scriveners' || type === 'adWalls')) { setAppSettings({...appSettings, [type]: val}); if (type === 'adWalls') setAdWalls(val); return; } if(!val || (appSettings[type] && appSettings[type].includes(val))) return; const u = [...(appSettings[type] || []), val]; setAppSettings({...appSettings, [type]: u}); };
  const handleDeleteOption = (type, opt) => { const u = (appSettings[type] || []).filter(i => i !== opt); setAppSettings({...appSettings, [type]: u}); };
  const handleReorderOption = (type, f, t) => { const l = [...(appSettings[type] || [])]; const [r] = l.splice(f, 1); l.splice(t, 0, r); setAppSettings({...appSettings, [type]: l}); };
  const handleUpdateProjects = async (newProjects) => { setCompanyProjects(newProjects); await saveSettingsToFirestore(newProjects, null); };
  const handleAddRegion = () => { if(!newRegionName.trim()||companyProjects[newRegionName])return; const u={...companyProjects,[newRegionName]:[]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewRegionName(''); };
  const handleAddProject = (r) => { const n=newProjectNames[r]; if(!n||!n.trim()||companyProjects[r].includes(n))return; const u={...companyProjects,[r]:[...(companyProjects[r]||[]),n]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewProjectNames({...newProjectNames,[r]:''}); };
  const handleDeleteRegion = (r) => setPendingDelete({type:'region',region:r});
  const handleDeleteProject = (r,i) => setPendingDelete({type:'project',region:r,item:i});
  const toggleUserStatus = async (u) => { if(currentUser?.role!=='super_admin')return; try{ await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', u.id), {status:u.status==='suspended'?'active':'suspended'}); }catch(e){} };
  const handleDeleteUser = (u) => setPendingDelete({type:'user',item:u});
  
  // ★★★ 修正後：廣告存檔邏輯 (支援 cost 與歷史紀錄) ★★★
  const handleSaveAd = async () => { 
      if (!adForm.name.trim() || !adManageProject || !currentUser?.companyCode) return; 
      
      const currentAds = projectAds[adManageProject] || []; 
      const safeCurrentAds = Array.isArray(currentAds) ? currentAds : []; 
      
      const normalizedAds = safeCurrentAds.map(a => typeof a === 'string' ? { id: Date.now() + Math.random(), name: a, startDate: '', endDate: '', cost: '' } : a ); 
      let updatedList; 
      
      if (isEditingAd) { 
          updatedList = normalizedAds.map(a => a.id === adForm.id ? adForm : a); 
      } else { 
          // 新增廣告推入堆疊最上方
          updatedList = [{ ...adForm, id: Date.now() }, ...normalizedAds]; 
      } 
      
      const newProjectAds = { ...projectAds, [adManageProject]: updatedList }; 
      setProjectAds(newProjectAds); 
      
      try { 
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode); 
          await updateDoc(docRef, { [`projectAds.${adManageProject}`]: updatedList }); 
      } catch (e) { 
          console.error("Ad save failed:", e);
      } 
      
      setAdForm({ id: '', name: '', startDate: '', endDate: '', cost: '' }); 
      setIsEditingAd(false); 
  };

  const handleEditAdInit = (a) => { setAdForm(typeof a==='string'?{id:Date.now(),name:a,startDate:'',endDate:'',cost:''}:a); setIsEditingAd(true); };
  const triggerDeleteAd = (i) => setPendingDelete({type:'ad',region:adManageProject,item:i});
  const handleEditAdFromDashboard = (a,p) => { setAdManageProject(p); setAdForm(typeof a==='string'?{id:a,name:a,startDate:'',endDate:'',cost:''}:a); setIsEditingAd(true); };
  const handleDeleteAdFromDashboard = (a,p) => setPendingDelete({type:'ad',region:p,item:a});
  
  const executeDelete = async () => { 
      if(!pendingDelete) return; 
      const {type,region,item} = pendingDelete; 
      if(type==='user'){ try{await deleteDoc(doc(db,'artifacts',appId,'public','data','app_users',item.id))}catch(e){} } 
      else if(type==='ad'){ 
          let c = projectAds[region] || []; 
          const u = c.filter(a => (a.id ? a.id !== item.id : a !== item)); 
          const newProjectAds = { ...projectAds, [region]: u }; 
          setProjectAds(newProjectAds); 
          if (currentUser?.companyCode) { 
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode); 
              await updateDoc(docRef, { [`projectAds.${region}`]: u }); 
          } 
      } 
      else { 
          let u={...companyProjects}; 
          if(type==='region') delete u[region]; 
          else u[region]=u[region].filter(p=>p!==item); 
          setCompanyProjects(u); 
          saveSettingsToFirestore(u,null); 
      } 
      setPendingDelete(null); 
  };

  const handleSaveDeal = async (dealData) => { try{ const id=dealData.id||Date.now().toString(); let ag=dealData.agentName||(dealData.distributions?.[0]?.agentName)||(allUsers.find(u=>u.username===dealData.agent)?.name)||dealData.agent||currentUser?.name||"未知"; const n={...dealData,id,createdAt:dealData.createdAt||new Date().toISOString(),companyCode:currentUser.companyCode,agentName:ag}; await setDoc(doc(db,'artifacts',appId,'public','data','deals',id),n,{merge:true}); alert("已儲存"); }catch(e){alert("失敗");} };
  const handleDeleteDeal = async (id) => { if(!confirm("刪除？"))return; try{await deleteDoc(doc(db,'artifacts',appId,'public','data','deals',id))}catch(e){} };
  
  const openProfile = () => { const me = allUsers.find(u => u.username === currentUser.username) || currentUser; setMyProfileData(me); setShowProfileModal(true); };
  const handleProfileImage = (e) => { const file = e.target.files[0]; if(file) { if (file.size > 800 * 1024) return alert("圖片太大 (限 800KB)"); const reader = new FileReader(); reader.onloadend = () => setMyProfileData({...myProfileData, photoUrl: reader.result}); reader.readAsDataURL(file); } };
  const handleProfileSave = async (e) => { e.preventDefault(); try { if (myProfileData.id) { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', myProfileData.id), myProfileData); } setShowProfileModal(false); alert("個人資料已更新"); } catch (error) { alert("更新失敗"); } };

  const agentStats = useMemo(() => { if (!Array.isArray(allUsers) || !Array.isArray(deals)) return []; const map = {}; allUsers.forEach(u => { if (u && u.name) { map[u.name] = { name: u.name, total: 0, commission: 0 }; } }); deals.forEach(d => { const dateRef = d.dealDate || d.signDate || d.date; if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) { if (Array.isArray(d.devAgents)) { d.devAgents.forEach(ag => { if (ag && ag.user && map[ag.user]) { const amt = parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0; map[ag.user].commission += amt; map[ag.user].total += 1; } }); } if (Array.isArray(d.salesAgents)) { d.salesAgents.forEach(ag => { if (ag && ag.user && map[ag.user]) { const amt = parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0; map[ag.user].commission += amt; map[ag.user].total += 1; } }); } } }); return Object.values(map).sort((a,b) => b.commission - a.commission).filter(a => a.commission > 0); }, [deals, dashTimeFrame, statYear, statMonth, statWeek, allUsers]);
  const dashboardStats = useMemo(() => { let totalRevenue = 0; let wonCount = 0; let newCases = 0; let newBuyers = 0; if (Array.isArray(deals)) { deals.forEach(d => { const dateRef = d.dealDate || d.signDate || d.date; if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) { const sub = parseFloat(String(d.subtotal || 0).replace(/,/g, '')) || 0; totalRevenue += sub; wonCount++; } }); } if (Array.isArray(customers)) { customers.forEach(c => { let dateRef = c.createdAt; if (dateRef && typeof dateRef === 'object' && dateRef.seconds) { dateRef = new Date(dateRef.seconds * 1000); } if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) { if (['賣方', '出租', '出租方'].includes(c.category)) { newCases++; } else { newBuyers++; } } }); } return { totalRevenue, counts: { won: wonCount, cases: newCases, buyers: newBuyers } }; }, [customers, deals, dashTimeFrame, statYear, statMonth, statWeek]);
  const handleExportExcel = () => { setIsExporting(true); setTimeout(()=>{ alert("匯出功能已觸發"); setIsExporting(false); setShowExportMenu(false); },1000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (view === 'login') return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} darkMode={darkMode} />;
  
  if (view === 'add') return <CustomerForm customers={customers} onSubmit={handleAddCustomer} onCancel={() => setView('list')} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} currentUser={currentUser} />;
  if (view === 'edit' && selectedCustomer) return <CustomerForm customers={customers} onSubmit={handleEditCustomer} onCancel={() => setView('detail')} initialData={selectedCustomer} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} currentUser={currentUser} />;
  if (view === 'detail' && selectedCustomer) return <CustomerDetail customer={selectedCustomer} allCustomers={customers} currentUser={currentUser} onEdit={() => setView('edit')} onDelete={handleDeleteCustomer} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onEditNote={handleEditNote} onBack={() => setView('list')} darkMode={darkMode} onQuickUpdate={handleQuickUpdate} allUsers={allUsers} onBroadcast={handleBroadcast} onUpdateCustomer={handleDirectUpdate} />;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'} overflow-x-hidden`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      {incomingBroadcast && <BroadcastOverlay data={incomingBroadcast} isPresenter={myBroadcastStatus} onClose={handleOverlayClose} onView={handleViewFromNotification} />}
      <NotificationModal notifications={notifications} onClose={() => setNotifications([])} onQuickUpdate={handleQuickUpdate} onView={handleViewFromNotification} />
      {view === 'list' && <Marquee text={announcement} darkMode={darkMode} />}
      
      {activeTab === 'clients' ? <ClientsView 
            companyProjects={companyProjects} 
            onUpdateProjects={handleUpdateProjects} 
            customers={customers} 
            currentUser={currentUser} 
            darkMode={darkMode} 
            toggleDarkMode={toggleDarkMode} 
            handleLogout={handleLogout} 
            listMode={listMode} 
            setListMode={setListMode} 
            listYear={listYear} 
            setListYear={setListYear} 
            listMonth={listMonth} 
            setListMonth={setListMonth} 
            listWeekDate={listWeekDate} 
            setListWeekDate={setListWeekDate} 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            loading={loading} 
            isAdmin={isAdmin} 
            setView={setView} 
            setSelectedCustomer={setSelectedCustomer} 
            onCustomerClick={handleCustomerClick} 
            onImport={handleBatchImport} 
            onBatchDelete={handleBatchDelete} 
            onBroadcast={handleBroadcast}
            onOpenProfile={openProfile} 
            /> : 
        activeTab === 'vendors' ? <VendorsView customers={customers} currentUser={currentUser} isAdmin={isAdmin} /> : 
        <DashboardView 
            saveSettings={saveSettingsToFirestore}
            customers={customers}
            isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout} dashboardStats={dashboardStats} dashTimeFrame={dashTimeFrame} setDashTimeFrame={setDashTimeFrame} agentStats={agentStats} companyProjects={companyProjects} projectAds={projectAds} allUsers={allUsers} newRegionName={newRegionName} setNewRegionName={setNewRegionName} newProjectNames={newProjectNames} setNewProjectNames={setNewProjectNames} onAddRegion={handleAddRegion} onDeleteRegion={handleDeleteRegion} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} onToggleUser={toggleUserStatus} onDeleteUser={handleDeleteUser} 
            onManageAd={setAdManageProject} 
            adManageProject={adManageProject} setAdManageProject={setAdManageProject} adForm={adForm} setAdForm={setAdForm} isEditingAd={isEditingAd} setIsEditingAd={setIsEditingAd} 
            dashboardView={dashboardView} setDashboardView={setDashboardView} 
            handleExportExcel={handleExportExcel} isExporting={isExporting} showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu} 
            appSettings={appSettings} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} onReorderOption={handleReorderOption} 
            deals={deals} handleSaveDeal={handleSaveDeal} handleDeleteDeal={handleDeleteDeal} 
            statYear={statYear} setStatYear={setStatYear} statMonth={statMonth} setStatMonth={setStatMonth} 
            onSaveAd={handleSaveAd} // ★ 確保傳遞
            onEditAdInit={handleEditAdInit} triggerDeleteAd={triggerDeleteAd} onEditAd={handleEditAdFromDashboard} onDeleteAd={handleDeleteAdFromDashboard} announcement={announcement} onSaveAnnouncement={handleSaveAnnouncement} 
            adWalls={adWalls} 
            systemAlerts={systemAlerts}
            onResolveAlert={handleResolveAlert}
            statWeek={statWeek} 
            setStatWeek={setStatWeek}
            onOpenProfile={openProfile}
            onOpenSettings={() => {
                setActiveTab('dashboard');
                setDashboardView('settings');
            }}
        />
      }

      <div className={`fixed bottom-0 w-full border-t flex justify-around items-center py-2 z-40 shadow-lg ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'clients' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}><List className="w-6 h-6"/><span className="text-[10px] mt-1">列表</span></button>
        
        <button onClick={() => setActiveTab('vendors')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'vendors' ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
            <Wrench className="w-6 h-6"/>
            <span className="text-[10px] mt-1">廠商</span>
        </button>

        {isAdmin && (
            <button onClick={() => setActiveTab('dashboard')} className={`relative flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}>
                <LayoutDashboard className="w-6 h-6"/>
                {systemAlerts.length > 0 && <span className="absolute top-2 right-6 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}
                <span className="text-[10px] mt-1">後台</span>
            </button>
        )}
      </div>

      {pendingDelete && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"><div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}><div className="flex items-center gap-3 mb-4 text-red-500"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><div className="w-6 h-6 text-red-600">⚠️</div></div><h3 className="text-lg font-bold">確認刪除</h3></div><p className="text-sm opacity-80 mb-6 leading-relaxed">確定要刪除嗎？<br/><span className="text-red-500 font-bold text-xs mt-1 block font-bold">此操作無法復原。</span></p><div className="flex gap-3"><button onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">取消</button><button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all active:scale-95">確認刪除</button></div></div></div>}
      
      {adManageProject && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}><div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3"><h3 className="text-lg font-bold flex items-center gap-2">管理廣告: {adManageProject}</h3><button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X/></button></div><div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
            {/* ★ 使用下拉選單 ★ */}
            <select value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}><option value="">請選擇廣告平台</option>{(appSettings.sources || []).map(src => (<option key={src} value={src}>{src}</option>))}</select>
            <div className="flex gap-2 items-center"><span className="text-xs text-gray-400">起</span><input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /><span className="text-xs text-gray-400">迄</span><input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div>
            {/* ★ 費用輸入 ★ */}
            <input type="number" value={adForm.cost} onChange={(e) => setAdForm({...adForm, cost: e.target.value})} placeholder="廣告費用 ($)" className={`w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
            <button onClick={handleSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button></div><div className="space-y-2">{(projectAds[adManageProject] || []).sort((a, b) => new Date(b.startDate || 0) - new Date(a.startDate || 0)).map((ad, idx) => { const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '', cost: 0 } : ad; return (<div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors"><div><div className="flex items-center gap-2"><span className="font-bold">{adObj.name}</span><span className="text-xs bg-green-100 text-green-700 px-2 rounded-full">${Number(adObj.cost || 0).toLocaleString()}</span></div><span className="text-xs text-gray-400">{adObj.startDate || '無'} ~ {adObj.endDate || '無'}</span></div><div className="flex gap-1"><button onClick={() => handleEditAdInit(ad)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"><Edit className="w-4 h-4"/></button><button onClick={() => triggerDeleteAd(adObj)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-full"><Trash2 className="w-4 h-4"/></button></div></div>); })}</div></div></div>}

      {/* 個人資料編輯 Modal */}
      {showProfileModal && (
          <div className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4 backdrop-blur-md">
              <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="p-4 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800 flex justify-between items-center">
                      <h3 className="font-bold text-lg flex items-center gap-2 dark:text-white"><UserCircle className="w-5 h-5"/> 個人資料設定</h3>
                      <button onClick={() => setShowProfileModal(false)}><X className="w-5 h-5 text-gray-500"/></button>
                  </div>
                  <form onSubmit={handleProfileSave} className="p-6 space-y-4">
                      <div className="flex justify-center mb-4">
                          <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 shadow-lg flex items-center justify-center relative overflow-hidden group cursor-pointer">
                              {myProfileData.photoUrl ? <img src={myProfileData.photoUrl} className="w-full h-full object-cover"/> : <div className="text-gray-400 text-xs text-center px-2">上傳照片</div>}
                              <input type="file" accept="image/*" onChange={handleProfileImage} className="absolute inset-0 opacity-0 cursor-pointer" />
                              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity font-bold">更換照片</div>
                          </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                          <div><label className="text-xs font-bold text-gray-400 mb-1 block">姓名 (不可改)</label><input disabled value={myProfileData.name || ''} className="w-full p-2 border rounded bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed"/></div>
                          <div><label className="text-xs font-bold text-gray-400 mb-1 block">權限</label><input disabled value={myProfileData.role === 'admin' ? '管理員' : '一般業務'} className="w-full p-2 border rounded bg-gray-100 dark:bg-slate-800 dark:border-slate-700 cursor-not-allowed"/></div>
                      </div>

                      <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">聯絡電話 (顯示於傳單)</label><input required value={myProfileData.phone || ''} onChange={e=>setMyProfileData({...myProfileData, phone: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white" placeholder="09xx-xxx-xxx"/></div>
                      <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">LINE ID</label><input value={myProfileData.lineId || ''} onChange={e=>setMyProfileData({...myProfileData, lineId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>
                      <div><label className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1 block">證照號碼</label><input value={myProfileData.licenseId || ''} onChange={e=>setMyProfileData({...myProfileData, licenseId: e.target.value})} className="w-full p-2 border rounded dark:bg-slate-900 dark:border-slate-600 dark:text-white"/></div>

                      <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold mt-4 hover:bg-blue-700 shadow-lg transition-transform active:scale-95">儲存變更</button>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
}