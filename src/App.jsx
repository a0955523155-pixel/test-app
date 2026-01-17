import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, Moon, Sun, LogOut, LayoutDashboard, List, Radio, X, MapPin, Bell, CheckCircle, AlertTriangle 
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

const BroadcastOverlay = ({ data, onClose, isPresenter }) => {
    if (!data) return null;
    const isCase = ['賣方', '出租', '出租方'].includes(data.category);
    const handleClose = () => { if (isPresenter) { if(confirm("您是廣播發起人，關閉視窗將結束所有人的廣播，確定嗎？")) onClose(true); } else onClose(false); };

    return (
        <div className="fixed inset-0 z-[100] bg-black/60 text-white flex flex-col items-center justify-center p-4 overflow-y-auto animate-in fade-in zoom-in duration-300 backdrop-blur-md">
            <button onClick={handleClose} className="fixed top-5 right-5 p-2 bg-white/20 rounded-full hover:bg-white/40 transition-colors z-[110]"><X className="w-8 h-8"/></button>
            <div className="bg-slate-900/90 border border-slate-600 p-8 rounded-3xl max-w-6xl w-full shadow-2xl relative my-10">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse"></div>
                <div className="flex flex-col md:flex-row items-start gap-8 mb-8 border-b border-gray-600 pb-6">
                    <div className="flex-shrink-0">
                        {data.photoUrl ? <img src={data.photoUrl} alt="Case" className="w-48 h-32 object-cover rounded-xl shadow-lg border border-gray-500" /> : <div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-bold shadow-lg ${isCase ? 'bg-orange-600' : 'bg-blue-600'}`}>{data.name?.[0]}</div>}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2"><span className={`px-3 py-1 rounded-full text-sm font-bold ${isCase ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{data.category}</span><span className="bg-gray-700 px-3 py-1 rounded-full text-sm">{data.status}</span></div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2">{isCase ? (data.caseName || data.name) : data.name}</h1>
                        <div className="text-2xl text-gray-300 font-medium">{isCase ? (data.landNo || data.reqRegion) : data.reqRegion}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-400 text-sm font-bold mb-1">{isCase ? (data.category.includes('出租') ? '租金' : '開價') : '預算'}</div>
                        <div className="text-5xl font-black text-green-400 font-mono">
                            {isCase ? data.totalPrice : data.value?.toLocaleString()}
                            <span className="text-2xl ml-1 text-gray-500">
                                {isCase && data.category.includes('出租') ? (Number(data.totalPrice) < 1000 ? '萬' : '元') : '萬'}
                            </span>
                        </div>
                        {isCase && data.unitPrice && !data.category.includes('出租') && <div className="text-xl text-gray-400 mt-1">單價 <span className="text-white font-bold">{data.unitPrice}</span> 元/坪</div>}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700"><h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2">詳情 / 備註</h3><div className="whitespace-pre-wrap leading-relaxed text-gray-300 text-lg">{data.remarks || "無詳細備註"}</div></div>
                        {isCase && data.nearby && <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700"><h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2">附近機能</h3><div className="whitespace-pre-wrap leading-relaxed text-gray-300">{data.nearby}</div></div>}
                    </div>
                    <div className="space-y-6">
                        <div className="bg-white/5 p-5 rounded-2xl space-y-4">
                            <div className="flex justify-between items-center"><span className="text-gray-400">專員</span><div className="flex flex-wrap gap-1 justify-end">{(data.agents && data.agents.length > 0 ? data.agents : [data.ownerName]).map(a => <span key={a} className="bg-blue-600 px-2 py-1 rounded text-xs font-bold">{a}</span>)}</div></div>
                            <div className="flex justify-between border-t border-gray-700 pt-3"><span className="text-gray-400">電話</span><span className="font-mono font-bold text-xl">{data.phone}</span></div>
                        </div>
                        {isCase && data.googleMapUrl && <a href={data.googleMapUrl} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center py-4 rounded-xl font-bold text-xl transition-colors shadow-lg flex items-center justify-center gap-2"><MapPin className="w-6 h-6"/> 開啟 Google 地圖</a>}
                    </div>
                </div>
            </div>
        </div>
    );
};

const NotificationModal = ({ notifications, onClose, onQuickUpdate }) => {
    if (!notifications || notifications.length === 0) return null;
    return (
        <div className="fixed inset-0 z-[90] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border-2 border-red-500">
                <div className="bg-red-500 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2"><AlertTriangle className="w-6 h-6"/> 待辦事項提醒 ({notifications.length})</h3>
                    <button onClick={onClose} className="p-1 hover:bg-red-600 rounded-full"><X/></button>
                </div>
                <div className="p-4 max-h-[60vh] overflow-y-auto space-y-3">
                    {notifications.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-start p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700">
                            <div>
                                <h4 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    {item.type === 'commission' ? '📄 委託即將到期' : '💰 代書款項期限'}
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-bold">{item.name} <span className="font-normal text-xs">({item.category})</span></div>
                                {item.type === 'payment' && <div className="text-xs text-blue-500 font-bold">項目: {item.itemName}</div>}
                                <div className="text-xs text-red-500 mt-1 font-bold">期限：{item.date} (剩 {item.days} 天)</div>
                            </div>
                            <button 
                                onClick={() => {
                                    if(confirm(`確認標記為完成？`)) {
                                        onQuickUpdate(item);
                                    }
                                }}
                                className="px-3 py-1.5 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-xs font-bold flex items-center gap-1 transition-colors"
                            >
                                <CheckCircle className="w-3 h-3"/> 完成
                            </button>
                        </div>
                    ))}
                </div>
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
  const [activeTab, setActiveTab] = useState('clients');
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [incomingBroadcast, setIncomingBroadcast] = useState(null);
  const [myBroadcastStatus, setMyBroadcastStatus] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const [companyProjects, setCompanyProjects] = useState({});
  const [projectAds, setProjectAds] = useState({}); 
  const [appSettings, setAppSettings] = useState({
      sources: DEFAULT_SOURCES,
      categories: DEFAULT_CATEGORIES,
      levels: DEFAULT_LEVELS,
      scriveners: [] 
  });

  const [announcement, setAnnouncement] = useState(SYSTEM_ANNOUNCEMENT);
  
  const [dashboardView, setDashboardView] = useState('stats'); 
  const [newRegionName, setNewRegionName] = useState('');
  const [newProjectNames, setNewProjectNames] = useState({});
  const [adManageProject, setAdManageProject] = useState(null); 
  const [adForm, setAdForm] = useState({ id: '', name: '', startDate: '', endDate: '' });
  const [isEditingAd, setIsEditingAd] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  
  const [dashTimeFrame, setDashTimeFrame] = useState('month'); 
  const [listMode, setListMode] = useState('month');
  const [listYear, setListYear] = useState(new Date().getFullYear());
  const [listMonth, setListMonth] = useState(new Date().getMonth() + 1);
  const [listWeekDate, setListWeekDate] = useState(new Date().toISOString().split('T')[0]); 
  const [statYear, setStatYear] = useState(new Date().getFullYear());
  const [statMonth, setStatMonth] = useState(new Date().getMonth() + 1);

  const [allUsers, setAllUsers] = useState([]);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const [darkMode, setDarkMode] = useState(() => {
    try { return localStorage.getItem('crm-dark-mode') === 'true'; } catch { return false; }
  });

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const newVal = !prev;
      localStorage.setItem('crm-dark-mode', String(newVal));
      return newVal;
    });
  };

  useEffect(() => {
      if (darkMode) {
          document.documentElement.classList.add('dark');
          document.body.style.backgroundColor = '#020617';
      } else {
          document.documentElement.classList.remove('dark');
          document.body.style.backgroundColor = '#f3f4f6';
      }
  }, [darkMode]);

  // Notifications logic
  useEffect(() => {
      if (!customers || customers.length === 0 || !currentUser) return;
      const today = new Date();
      const tempNotifications = [];

      customers.forEach(c => {
          if (c.owner === currentUser.username) {
              if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                  const endDate = new Date(c.commissionEndDate);
                  const diffDays = Math.ceil((endDate - today) / (86400000));
                  if (diffDays >= 0 && diffDays <= 7) {
                      tempNotifications.push({ id: c.id, name: c.name || c.caseName, category: c.category, type: 'commission', date: c.commissionEndDate, days: diffDays });
                  }
              }
              if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                  c.scribeDetails.forEach((item, index) => {
                      if (item.payDate && !item.isPaid) {
                          const payDate = new Date(item.payDate);
                          const diffDays = Math.ceil((payDate - today) / (86400000));
                          if (diffDays >= 0 && diffDays <= 7) {
                              tempNotifications.push({ 
                                  id: c.id, name: c.name, category: c.category, type: 'payment', 
                                  date: item.payDate, days: diffDays, itemName: item.item || '未命名款項', itemIndex: index, scribeDetails: c.scribeDetails 
                              });
                          }
                      }
                  });
              }
          }
      });
      setNotifications(tempNotifications);
  }, [customers, currentUser]);

  const handleQuickUpdate = async (notiItem) => {
      try {
          if (notiItem.type === 'commission') {
              await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { isRenewed: true });
          } else if (notiItem.type === 'payment') {
              const updatedDetails = [...notiItem.scribeDetails];
              if (updatedDetails[notiItem.itemIndex]) {
                  updatedDetails[notiItem.itemIndex].isPaid = true;
                  await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { scribeDetails: updatedDetails });
              }
          }
          setNotifications(prev => prev.filter(n => !(n.id === notiItem.id && n.type === notiItem.type && n.itemIndex === notiItem.itemIndex)));
      } catch(e) { console.error(e); }
  };

  useEffect(() => {
      if (!currentUser?.companyCode) return;
      const broadcastRef = doc(db, 'artifacts', appId, 'public', 'system', 'broadcast_data', currentUser.companyCode);
      const unsubscribe = onSnapshot(broadcastRef, (docSnap) => {
          if (docSnap.exists()) {
              const data = docSnap.data();
              if (data.isActive) {
                  setMyBroadcastStatus(data.presenterId === currentUser.username);
                  const target = customers.find(c => c.id === data.targetId);
                  if (target) setIncomingBroadcast(target);
              } else {
                  setIncomingBroadcast(null);
                  setMyBroadcastStatus(false);
              }
          }
      });
      return () => unsubscribe();
  }, [currentUser, customers]);

  useEffect(() => {
      if (!currentUser?.companyCode) return;
      const dealsRef = collection(db, 'artifacts', appId, 'public', 'data', 'deals');
      const q = query(dealsRef, where("companyCode", "==", currentUser.companyCode));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setDeals(data);
      });
      return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const initAuth = async () => { try { await signInAnonymously(auth); } catch (error) { setLoading(false); } };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setSessionUser(u);
      const savedUser = localStorage.getItem('crm-user-profile');
      if (savedUser) {
        try { setCurrentUser(JSON.parse(savedUser)); setView('list'); } 
        catch (e) { localStorage.removeItem('crm-user-profile'); setView('login'); setLoading(false); }
      } else { setView('login'); setLoading(false); }
    });
    return () => unsubscribe();
  }, []);

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
      if (selectedCustomer) {
        const updated = data.find(c => c.id === selectedCustomer.id);
        if (updated) setSelectedCustomer(updated);
      }
    }, (error) => { console.error("Snapshot Error:", error); setLoading(false); });
    return () => unsubscribe();
  }, [sessionUser, currentUser]);

  useEffect(() => {
    if (!currentUser?.companyCode) return;
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.projects) setCompanyProjects(data.projects);
        if (data.projectAds) setProjectAds(data.projectAds);
        if (data.announcement) setAnnouncement(data.announcement);
        setAppSettings({
            sources: data.sources || DEFAULT_SOURCES,
            categories: data.categories || DEFAULT_CATEGORIES,
            levels: data.levels || DEFAULT_LEVELS,
            scriveners: data.scriveners || [] 
        });
      } else {
        const initData = { 
            projects: DEFAULT_PROJECTS, projectAds: {}, 
            sources: DEFAULT_SOURCES, categories: DEFAULT_CATEGORIES, levels: DEFAULT_LEVELS, 
            announcement: SYSTEM_ANNOUNCEMENT, scriveners: []
        };
        setCompanyProjects(DEFAULT_PROJECTS || {});
        setAppSettings({ sources: DEFAULT_SOURCES, categories: DEFAULT_CATEGORIES, levels: DEFAULT_LEVELS, scriveners: [] });
        setProjectAds({});
        setAnnouncement(SYSTEM_ANNOUNCEMENT);
        setDoc(settingsDocRef, initData, { merge: true });
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
      if (currentUser?.role === 'super_admin' && currentUser?.companyCode) {
          const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
          const q = query(usersRef, where("companyCode", "==", currentUser.companyCode));
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllUsers(users); 
          });
          return () => unsubscribe();
      }
  }, [currentUser]);

  const handleBroadcast = async (targetId, isActive) => {
      if (!currentUser?.companyCode) return;
      try {
          const broadcastRef = doc(db, 'artifacts', appId, 'public', 'system', 'broadcast_data', currentUser.companyCode);
          await setDoc(broadcastRef, { isActive: isActive, targetId: targetId, presenterId: currentUser.username, timestamp: serverTimestamp() });
      } catch (e) { console.error("Broadcast Error", e); }
  };
  
  const handleOverlayClose = (isGlobalClose) => {
      if (isGlobalClose) handleBroadcast(null, false);
      else setIncomingBroadcast(null);
  };

  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('crm-user-profile'); setView('login'); setActiveTab('clients'); setSearchTerm(''); setLoading(false); };
  const handleLogin = async (username, password, companyCode, rememberMe) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      const q = query(usersRef, where("username", "==", username)); 
      const querySnapshot = await getDocs(q);
      let foundUser = null;
      querySnapshot.forEach((doc) => { const u = doc.data(); if (u.password === password) { if (u.companyCode && u.companyCode !== companyCode) return; foundUser = { id: doc.id, ...u }; } });
      if (foundUser) {
        if (foundUser.status === 'suspended') { alert("此帳號已被停權"); setLoading(false); return; }
        const profile = { username: foundUser.username, name: foundUser.name, role: foundUser.role, companyCode: foundUser.companyCode || companyCode };
        setCurrentUser(profile);
        localStorage.setItem('crm-user-profile', JSON.stringify(profile));
        if (rememberMe) localStorage.setItem('crm-login-info', btoa(JSON.stringify({ username, password, companyCode })));
        else localStorage.removeItem('crm-login-info');
        setView('list');
      } else { alert("登入失敗"); setLoading(false); }
    } catch (e) { console.error(e); alert("登入錯誤"); setLoading(false); }
  };
  const handleRegister = async (username, password, name, role, adminCode, companyCode) => {
    if (!username || !password || !name || !companyCode) return alert("請填寫完整");
    setLoading(true);
    let finalRole = role;
    if (role === 'admin') {
        if (adminCode === SUPER_ADMIN_CODE) finalRole = 'super_admin';
        else if (adminCode === ADMIN_CODE) finalRole = 'admin';
        else { setLoading(false); alert("註冊碼錯誤"); return false; }
    }
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      const q = query(usersRef, where("username", "==", username)); 
      const snap = await getDocs(q);
      if (!snap.empty) { alert("帳號已存在"); setLoading(false); return false; }
      else { await addDoc(usersRef, { username, password, name, role: finalRole, companyCode, status: 'active', createdAt: serverTimestamp() }); alert("註冊成功"); setLoading(false); return true; }
    } catch (e) { console.error(e); alert("註冊失敗"); setLoading(false); }
    return false;
  };

  const handleAddCustomer = async (formData) => {
    if (!currentUser) return;
    try {
      setView('list'); 
      setActiveTab('clients');
      const initialLastContact = formData.createdAt || new Date().toISOString().split('T')[0];
      const newCustomer = { 
        ...formData, 
        createdAt: formData.createdAt ? new Date(formData.createdAt) : new Date(), 
        notes: [], 
        lastContact: initialLastContact, 
        owner: currentUser.username || "unknown_user", 
        ownerName: currentUser.name || currentUser.username || "未知業務", 
        companyCode: currentUser.companyCode || "unknown_company"
      };
      Object.keys(newCustomer).forEach(key => { if (newCustomer[key] === undefined) delete newCustomer[key]; });
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), newCustomer);
      
      if ((newCustomer.category === '賣方' || newCustomer.category === '出租' || newCustomer.category === '出租方') && newCustomer.caseName && newCustomer.assignedRegion) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              const currentProjects = docSnap.data().projects || {};
              const region = newCustomer.assignedRegion;
              const list = currentProjects[region] || [];
              if (!list.includes(newCustomer.caseName)) {
                  const updatedProjects = { ...currentProjects, [region]: [...list, newCustomer.caseName] };
                  setCompanyProjects(updatedProjects); 
                  await updateDoc(docRef, { projects: updatedProjects }); 
              }
          }
      }

      try {
          const today = new Date().getDay(); 
          const quotes = (typeof DAILY_QUOTES !== 'undefined' && Array.isArray(DAILY_QUOTES)) ? DAILY_QUOTES : ["加油！"];
          alert(`新增成功！\n\n💡 ${quotes[today] || quotes[0]}`);
      } catch (e) { alert("新增成功！"); }
    } catch (err) { console.error("Add Customer Error:", err); alert(`新增失敗：${err.message}`); }
  };

  const handleBatchImport = async (importedData) => {
      if (!currentUser) return;
      setLoading(true);
      try {
          const batchPromises = importedData.map(data => {
              const safeDate = (val) => { if (!val) return new Date(); let d = new Date(val); if (isNaN(d.getTime()) || d.getFullYear() > 3000 || d.getFullYear() < 1900) return new Date(); return d; };
              const cleanData = { ...data, owner: currentUser.username, ownerName: currentUser.name, companyCode: currentUser.companyCode, createdAt: safeDate(data.createdAt), lastContact: typeof data.lastContact === 'string' ? data.lastContact : safeDate(data.createdAt).toISOString().split('T')[0], notes: [], value: data.value ? Number(String(data.value).replace(/,/g, '')) : 0 };
              Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; });
              return addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), cleanData);
          });
          await Promise.all(batchPromises);
          alert(`成功匯入 ${importedData.length} 筆資料`);
      } catch (error) { console.error(error); alert("匯入失敗"); } finally { setLoading(false); }
  };

  const handleBatchDelete = async (ids) => {
      if (!ids.length || !confirm(`刪除 ${ids.length} 筆？`)) return;
      setLoading(true);
      try { const batch = writeBatch(db); ids.forEach(id => batch.delete(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id))); await batch.commit(); alert("刪除成功"); } catch (e) { alert("刪除失敗"); } finally { setLoading(false); }
  };

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleEditCustomer = async (formData) => {
    if (selectedCustomer.owner !== currentUser.username && !isSuperAdmin) return alert("無權限");
    try {
      const { id, ...rest } = formData;
      const updateData = { ...rest };
      if (updateData.createdAt) { const d = new Date(updateData.createdAt); if (!isNaN(d.getTime())) { updateData.createdAt = d; updateData.lastContact = d.toISOString().split('T')[0]; } else delete updateData.createdAt; }
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id), updateData);
      setView('detail');
    } catch (e) { alert("儲存失敗"); }
  };
  const handleDeleteCustomer = async () => {
    if (selectedCustomer.owner !== currentUser.username && !isSuperAdmin) return alert("無權限");
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id)); setSelectedCustomer(null); setView('list'); } catch(e){}
  };
  const handleAddNote = async (id, content) => { try { const today = new Date().toISOString().split('T')[0]; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayUnion({id:Date.now(), date:today, content, author:currentUser.name}), lastContact: today }); } catch(e){} };
  const handleDeleteNote = async (id, note) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayRemove(note) }); } catch(e){} };
  
  const saveSettingsToFirestore = async (np, na) => { if(!currentUser?.companyCode)return; const p={}; if(np)p.projects=np; if(na)p.projectAds=na; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), p, {merge:true}); }catch(e){} };
  
  const handleSaveAnnouncement = async (t) => { if(!currentUser?.companyCode)return; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), {announcement:t}, {merge:true}); alert("更新成功"); }catch(e){} };
  
  // ★★★ 關鍵修復：補回選項管理函式 ★★★
  const saveAppSettings = async (s) => { if(!currentUser?.companyCode)return; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), s, {merge:true}); }catch(e){} };

  const handleAddOption = (type, val) => { 
      if (Array.isArray(val) && type === 'scriveners') {
          setAppSettings({...appSettings, [type]: val});
          saveAppSettings({[type]: val});
          return;
      }
      if(!val || (appSettings[type] && appSettings[type].includes(val))) return; 
      const u = [...(appSettings[type] || []), val]; 
      setAppSettings({...appSettings, [type]: u}); 
      saveAppSettings({[type]: u}); 
  };

  const handleDeleteOption = (type, opt) => { 
      const u = (appSettings[type] || []).filter(i => i !== opt); 
      setAppSettings({...appSettings, [type]: u}); 
      saveAppSettings({[type]: u}); 
  };

  const handleReorderOption = (type, f, t) => { 
      const l = [...(appSettings[type] || [])]; 
      const [r] = l.splice(f, 1); 
      l.splice(t, 0, r); 
      setAppSettings({...appSettings, [type]: l}); 
      saveAppSettings({[type]: l}); 
  };

  const handleUpdateProjects = async (newProjects) => {
      setCompanyProjects(newProjects);
      await saveSettingsToFirestore(newProjects, null);
  };

  const handleAddRegion = () => { if(!newRegionName.trim()||companyProjects[newRegionName])return; const u={...companyProjects,[newRegionName]:[]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewRegionName(''); };
  const handleAddProject = (r) => { const n=newProjectNames[r]; if(!n||!n.trim()||companyProjects[r].includes(n))return; const u={...companyProjects,[r]:[...(companyProjects[r]||[]),n]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewProjectNames({...newProjectNames,[r]:''}); };
  const handleDeleteRegion = (r) => setPendingDelete({type:'region',region:r});
  const handleDeleteProject = (r,i) => setPendingDelete({type:'project',region:r,item:i});
  const toggleUserStatus = async (u) => { if(currentUser?.role!=='super_admin')return; try{ await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', u.id), {status:u.status==='suspended'?'active':'suspended'}); }catch(e){} };
  const handleDeleteUser = (u) => setPendingDelete({type:'user',item:u});

  const handleSaveAd = () => { if(!adForm.name.trim()||!adManageProject)return; let c=projectAds[adManageProject]||[]; c=c.map(a=>typeof a==='string'?{id:Date.now()+Math.random(),name:a,startDate:'',endDate:''}:a); let u=isEditingAd?c.map(a=>a.id===adForm.id?adForm:a):[...c,{...adForm,id:Date.now()}]; const m={...projectAds,[adManageProject]:u}; setProjectAds(m); saveSettingsToFirestore(null,m); setAdForm({id:'',name:'',startDate:'',endDate:''}); setIsEditingAd(false); };
  const handleEditAdInit = (a) => { setAdForm(typeof a==='string'?{id:a,name:a,startDate:'',endDate:''}:a); setIsEditingAd(true); };
  const triggerDeleteAd = (i) => setPendingDelete({type:'ad',region:adManageProject,item:i});
  const handleEditAdFromDashboard = (a,p) => { setAdManageProject(p); setAdForm(typeof a==='string'?{id:a,name:a,startDate:'',endDate:''}:a); setIsEditingAd(true); };
  const handleDeleteAdFromDashboard = (a,p) => setPendingDelete({type:'ad',region:p,item:a});
  const executeDelete = async () => { if(!pendingDelete)return; const {type,region,item}=pendingDelete; if(type==='user')try{await deleteDoc(doc(db,'artifacts',appId,'public','data','app_users',item.id))}catch(e){} else if(type==='ad'){ let c=projectAds[region]||[]; const u=c.filter(a=>(a.id?a.id!==item.id:a!==item)); const m={...projectAds,[region]:u}; setProjectAds(m); saveSettingsToFirestore(null,m); } else { let u={...companyProjects}; if(type==='region')delete u[region]; else u[region]=u[region].filter(p=>p!==item); setCompanyProjects(u); saveSettingsToFirestore(u,null); } setPendingDelete(null); };

  const handleSaveDeal = async (dealData) => { try{ const id=dealData.id||Date.now().toString(); let ag=dealData.agentName||(dealData.distributions?.[0]?.agentName)||(allUsers.find(u=>u.username===dealData.agent)?.name)||dealData.agent||currentUser?.name||"未知"; const n={...dealData,id,createdAt:dealData.createdAt||new Date().toISOString(),companyCode:currentUser.companyCode,agentName:ag}; await setDoc(doc(db,'artifacts',appId,'public','data','deals',id),n,{merge:true}); alert("已儲存"); }catch(e){alert("失敗");} };
  const handleDeleteDeal = async (id) => { if(!confirm("刪除？"))return; try{await deleteDoc(doc(db,'artifacts',appId,'public','data','deals',id))}catch(e){} };

  // ★★★ Agent Stats 防呆 ★★★
  const agentStats = useMemo(() => { 
      if (!Array.isArray(allUsers) || !Array.isArray(deals)) return [];
      
      const map = {}; 
      allUsers.forEach(u => {
          if (u && u.name) {
              map[u.name] = { name: u.name, total: 0, commission: 0 };
          }
      });

      deals.forEach(d => { 
         if (!d || (!d.date && !d.signDate && !d.dealDate)) return;
         const dateRef = new Date(d.signDate || d.dealDate || d.date); 
         if (isNaN(dateRef.getTime())) return;

         const y = dateRef.getFullYear();
         const m = dateRef.getMonth() + 1; 
         
         let i = false; 
         if (dashTimeFrame === 'all') i = true; 
         else if (dashTimeFrame === 'year') i = (y === statYear); 
         else if (dashTimeFrame === 'month') i = (y === statYear && m === statMonth); 
         
         if (i) {
             if (Array.isArray(d.devAgents)) {
                 d.devAgents.forEach(ag => {
                     if (ag && ag.user && map[ag.user]) {
                         const amt = parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0;
                         map[ag.user].commission += amt;
                         map[ag.user].total += 1;
                     }
                 });
             }
             if (Array.isArray(d.salesAgents)) {
                 d.salesAgents.forEach(ag => {
                     if (ag && ag.user && map[ag.user]) {
                         const amt = parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0;
                         map[ag.user].commission += amt;
                         map[ag.user].total += 1; 
                     }
                 });
             }
         }
      });
      return Object.values(map).sort((a,b) => b.commission - a.commission).filter(a => a.commission > 0); 
  }, [deals, dashTimeFrame, statYear, statMonth, allUsers]);

  // ★★★ Dashboard Stats 防呆 ★★★
  const dashboardStats = useMemo(() => { 
      let t = 0, w = 0; 
      if (Array.isArray(deals)) {
          deals.forEach(d => { 
              if (!d || (!d.date && !d.signDate && !d.dealDate)) return;
              const dateRef = new Date(d.signDate || d.dealDate || d.date); 
              if (isNaN(dateRef.getTime())) return;

              const y = dateRef.getFullYear();
              const m = dateRef.getMonth() + 1; 
              let i = false; 
              if (dashTimeFrame === 'all') i = true; 
              else if (dashTimeFrame === 'year') i = (y === statYear); 
              else if (dashTimeFrame === 'month') i = (y === statYear && m === statMonth); 
              if (i) {
                  const sub = parseFloat(String(d.subtotal || 0).replace(/,/g, '')) || 0;
                  t += sub;
                  w++;
              } 
          }); 
      }
      return { totalRevenue: t, counts: { total: Array.isArray(customers) ? customers.length : 0, won: w } }; 
  }, [customers, deals, dashTimeFrame, statYear, statMonth]);

  const handleExportExcel = () => { setIsExporting(true); setTimeout(()=>{ alert("匯出功能已觸發"); setIsExporting(false); setShowExportMenu(false); },1000); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (view === 'login') return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} darkMode={darkMode} />;
  if (view === 'add') return <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setView('list')} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} />;
  if (view === 'edit' && selectedCustomer) return <CustomerForm onSubmit={handleEditCustomer} onCancel={() => setView('detail')} initialData={selectedCustomer} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} />;
  if (view === 'detail' && selectedCustomer) return <CustomerDetail customer={selectedCustomer} allCustomers={customers} currentUser={currentUser} onEdit={() => setView('edit')} onDelete={handleDeleteCustomer} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onBack={() => setView('list')} darkMode={darkMode} onQuickUpdate={handleQuickUpdate} />;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'} overflow-x-hidden`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      {incomingBroadcast && <BroadcastOverlay data={incomingBroadcast} isPresenter={myBroadcastStatus} onClose={handleOverlayClose} />}
      <NotificationModal notifications={notifications} onClose={() => setNotifications([])} onQuickUpdate={handleQuickUpdate} />
      {view === 'list' && <Marquee text={announcement} darkMode={darkMode} />}
      {activeTab === 'clients' ? <ClientsView companyProjects={companyProjects} onUpdateProjects={handleUpdateProjects} customers={customers} currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout} listMode={listMode} setListMode={setListMode} listYear={listYear} setListYear={setListYear} listMonth={listMonth} setListMonth={setListMonth} listWeekDate={listWeekDate} setListWeekDate={setListWeekDate} searchTerm={searchTerm} setSearchTerm={setSearchTerm} loading={loading} isAdmin={isAdmin} setView={setView} setSelectedCustomer={setSelectedCustomer} onImport={handleBatchImport} onBatchDelete={handleBatchDelete} onBroadcast={handleBroadcast} /> : 
        <DashboardView 
            saveSettings={saveSettingsToFirestore}
            customers={customers}
            isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout} dashboardStats={dashboardStats} dashTimeFrame={dashTimeFrame} setDashTimeFrame={setDashTimeFrame} agentStats={agentStats} companyProjects={companyProjects} projectAds={projectAds} allUsers={allUsers} newRegionName={newRegionName} setNewRegionName={setNewRegionName} newProjectNames={newProjectNames} setNewProjectNames={setNewProjectNames} onAddRegion={handleAddRegion} onDeleteRegion={handleDeleteRegion} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} onToggleUser={toggleUserStatus} onDeleteUser={handleDeleteUser} onManageAd={setAdManageProject} adManageProject={adManageProject} setAdManageProject={setAdManageProject} adForm={adForm} setAdForm={setAdForm} isEditingAd={isEditingAd} setIsEditingAd={setIsEditingAd} dashboardView={dashboardView} setDashboardView={setDashboardView} handleExportExcel={handleExportExcel} isExporting={isExporting} showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu} appSettings={appSettings} onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} onReorderOption={handleReorderOption} deals={deals} handleSaveDeal={handleSaveDeal} handleDeleteDeal={handleDeleteDeal} statYear={statYear} setStatYear={setStatYear} statMonth={statMonth} setStatMonth={setStatMonth} onSaveAd={handleSaveAd} onEditAdInit={handleEditAdInit} triggerDeleteAd={triggerDeleteAd} onEditAd={handleEditAdFromDashboard} onDeleteAd={handleDeleteAdFromDashboard} announcement={announcement} onSaveAnnouncement={handleSaveAnnouncement} 
        />
      }
      <div className={`fixed bottom-0 w-full border-t flex justify-around items-center py-2 z-40 shadow-lg ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'clients' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}><List className="w-6 h-6"/><span className="text-[10px] mt-1">列表</span></button>
        {isAdmin && <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}><LayoutDashboard className="w-6 h-6"/><span className="text-[10px] mt-1">後台</span></button>}
      </div>
      {pendingDelete && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"><div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}><div className="flex items-center gap-3 mb-4 text-red-500"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><div className="w-6 h-6 text-red-600">⚠️</div></div><h3 className="text-lg font-bold">確認刪除</h3></div><p className="text-sm opacity-80 mb-6 leading-relaxed">確定要刪除嗎？<br/><span className="text-red-500 font-bold text-xs mt-1 block font-bold">此操作無法復原。</span></p><div className="flex gap-3"><button onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">取消</button><button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all active:scale-95">確認刪除</button></div></div></div>}
      {adManageProject && <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"><div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}><div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3"><h3 className="text-lg font-bold flex items-center gap-2">管理廣告: {adManageProject}</h3><button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X/></button></div><div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800"><input value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none notranslate ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="廣告名稱 (如: 591, FB)" autoComplete="off" /><div className="flex gap-2"><input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /><input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} /></div><button onClick={onSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button></div><div className="space-y-2">{(projectAds[adManageProject] || []).map((ad, idx) => { const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '' } : ad; return (<div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors"><div><span className="font-bold block">{adObj.name}</span></div><div className="flex gap-1"><button onClick={() => handleEditAdInit(ad)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full">✏️</button><button onClick={() => triggerDeleteAd(adObj)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full">🗑️</button></div></div>); })}</div></div></div>}
    </div>
  );
}