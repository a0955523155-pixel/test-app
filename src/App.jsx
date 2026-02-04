import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Loader2, Moon, Sun, LogOut, Megaphone, X } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, setDoc, serverTimestamp, getDocs, getDoc } from 'firebase/firestore';

import { appId, DEFAULT_SOURCES, DEFAULT_CATEGORIES, DEFAULT_LEVELS, DEFAULT_PROJECTS, SYSTEM_ANNOUNCEMENT } from './config/constants';
import { checkDateMatch, getCurrentWeekStr, getSafeDateStr, getContactThreshold } from './utils/helpers';

// Components
import LoginScreen from './components/LoginScreen';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import VendorDetailModal from './components/VendorDetailModal';
import ClientsView from './components/ClientsView';
import DashboardView from './components/DashboardView';
import VendorsView from './components/VendorsView';
import NotificationModal from './components/NotificationModal';
import BroadcastOverlay from './components/BroadcastOverlay';
import ProfileModal from './components/ProfileModal';
import BottomNav from './components/BottomNav';

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

const CLIENT_CATEGORIES = ['賣方', '出租', '出租方', '買方', '承租', '承租方', '已購', '已租', '潛在', '開發中'];

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
  
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [incomingBroadcast, setIncomingBroadcast] = useState(null);
  const [myBroadcastStatus, setMyBroadcastStatus] = useState(false);
  const [broadcastData, setBroadcastData] = useState(null);
  
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false); 
  const [hasShownNotifications, setHasShownNotifications] = useState(false);

  const [systemAlerts, setSystemAlerts] = useState([]); 
  const [companyProjects, setCompanyProjects] = useState({});
  const [projectAds, setProjectAds] = useState({}); 
  
  // ★★★ 修正 1: 移除獨立的 adWalls state，統一由 appSettings 管理 ★★★
  // const [adWalls, setAdWalls] = useState([]); // 移除這行
  const [appSettings, setAppSettings] = useState({ 
      sources: DEFAULT_SOURCES, 
      categories: DEFAULT_CATEGORIES, 
      levels: DEFAULT_LEVELS, 
      scriveners: [],
      adWalls: [] // 加入 adWalls 初始值
  });

  const [announcement, setAnnouncement] = useState(SYSTEM_ANNOUNCEMENT);
  
  const [showBanner, setShowBanner] = useState(true);
  const marqueeTextRef = useRef(null);
  const [marqueeDuration, setMarqueeDuration] = useState(20);
  const lastContentRef = useRef('');

  const [dashboardView, setDashboardView] = useState('stats'); 
  const [newRegionName, setNewRegionName] = useState('');
  const [newProjectNames, setNewProjectNames] = useState({});
  const [adManageProject, setAdManageProject] = useState(null); 
  const [adForm, setAdForm] = useState({ id: '', name: '', startDate: '', endDate: '', cost: '' }); 
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
  const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('crm-dark-mode') === 'true'; } catch { return false; } });

  useEffect(() => { localStorage.setItem('crm_list_mode', listMode); }, [listMode]);
  const toggleDarkMode = () => { setDarkMode(prev => { const newVal = !prev; localStorage.setItem('crm-dark-mode', String(newVal)); return newVal; }); };
  useEffect(() => { if (darkMode) { document.documentElement.classList.add('dark'); document.body.style.backgroundColor = '#020617'; } else { document.documentElement.classList.remove('dark'); document.body.style.backgroundColor = '#f3f4f6'; } }, [darkMode]);

  // Auth Init
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

  // Fetch Customers
  useEffect(() => {
    if (!sessionUser || !currentUser) return;
    setLoading(true);
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
    const q = currentUser.companyCode ? query(collectionRef, where("companyCode", "==", currentUser.companyCode)) : query(collectionRef); 
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCustomers(data);
      setLoading(false);
    }, (error) => { console.error("Snapshot Error:", error); setLoading(false); });
    return () => unsubscribe();
  }, [sessionUser, currentUser]);

  // ★★★ 修正 2: 讀取 Settings 時，將 adWalls 放入 appSettings ★★★
  useEffect(() => {
    if (!currentUser?.companyCode) return;
    const settingsDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCompanyProjects(data.projects || DEFAULT_PROJECTS || {});
        setProjectAds(data.projectAds || {}); 
        setAnnouncement(data.announcement || SYSTEM_ANNOUNCEMENT); 
        
        // 統一更新 appSettings
        setAppSettings({ 
            sources: data.sources || DEFAULT_SOURCES, 
            categories: data.categories || DEFAULT_CATEGORIES, 
            levels: data.levels || DEFAULT_LEVELS, 
            scriveners: Array.isArray(data.scriveners) ? data.scriveners : [],
            adWalls: Array.isArray(data.adWalls) ? data.adWalls : [] // 這裡讀取 adWalls
        });
      }
    });
    return () => unsubscribe();
  }, [currentUser]);

  // Marquee
  useEffect(() => {
      const content = announcement?.content;
      if (content && content !== lastContentRef.current) {
          setShowBanner(true);
          lastContentRef.current = content;
      }
  }, [announcement?.content]);

  useEffect(() => {
    if (showBanner && announcement?.content && marqueeTextRef.current) {
        const textWidth = marqueeTextRef.current.offsetWidth;
        const screenWidth = window.innerWidth;
        const totalDistance = screenWidth + textWidth;
        const speed = 100;
        const duration = totalDistance / speed;
        setMarqueeDuration(Math.max(duration, 5));
    }
  }, [showBanner, announcement?.content]);

  // Fetch Users
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

  // Fetch Deals
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

  // Fetch Broadcast
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
          if (target) { setIncomingBroadcast(target); }
      }
  }, [broadcastData, customers]);

  const clientList = useMemo(() => {
      return customers.filter(c => c.category && CLIENT_CATEGORIES.includes(c.category));
  }, [customers]);

  const vendorList = useMemo(() => {
      return customers.filter(c => {
          const hasIndustry = c.industry && c.industry.trim().length > 0;
          const hasVendorInfo = c.vendorInfo && c.vendorInfo.trim().length > 0;
          const isCategoryVendor = c.category === '廠商';
          return isCategoryVendor || hasIndustry || hasVendorInfo;
      });
  }, [customers]);

  useEffect(() => {
      if (!clientList || clientList.length === 0 || !currentUser) return;
      const today = new Date();
      const tempNotifications = [];
      
      clientList.forEach(c => {
          if (c.owner === currentUser.username) {
              let lastDateStr = null;
              if (Array.isArray(c.notes) && c.notes.length > 0) {
                   const clientNotes = c.notes.filter(n => n.type !== 'vendor');
                   const lastNote = [...clientNotes].sort((a,b) => (b.date||'').localeCompare(a.date||''))[0];
                   if (lastNote) lastDateStr = lastNote.date;
              }
              if (!lastDateStr) lastDateStr = getSafeDateStr(c.createdAt);
              if (!lastDateStr) lastDateStr = new Date().toISOString().split('T')[0];
              
              if (lastDateStr) {
                  const lastDate = new Date(lastDateStr);
                  if (!isNaN(lastDate.getTime())) {
                      const diffTime = today - lastDate;
                      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
                      const threshold = getContactThreshold(c.level, c.status);
                      if (diffDays >= threshold && threshold < 999) {
                          let reason = '需聯繫';
                          if (c.status === 'commissioned') reason = '需回報進度';
                          if (c.status === 'closed') reason = '售後關懷';
                          tempNotifications.push({ id: c.id, name: c.name, category: c.category, type: 'contact', level: c.level || 'C', lastDate: lastDateStr, days: diffDays, reason: reason });
                      }
                  }
              }
              if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                  const endDate = new Date(c.commissionEndDate);
                  const diffDays = Math.ceil((endDate - today) / (86400000));
                  if (diffDays >= 0 && diffDays <= 7) { tempNotifications.push({ id: c.id, name: c.name || c.caseName, category: c.category, type: 'commission', date: c.commissionEndDate, days: diffDays, level: c.level || 'C' }); }
              }
              if (c.scribeDetails && Array.isArray(c.scribeDetails)) {
                  c.scribeDetails.forEach((item, index) => {
                      if (item.payDate && !item.isPaid) {
                          const payDate = new Date(item.payDate);
                          const diffDays = Math.ceil((payDate - today) / (86400000));
                          if (diffDays >= 0 && diffDays <= 7) { tempNotifications.push({ id: c.id, name: c.name, category: c.category, type: 'payment', date: item.payDate, days: diffDays, itemName: item.item || '未命名款項', itemIndex: index, scribeDetails: c.scribeDetails, level: 'A' }); }
                      }
                  });
              }
          }
      });
      setNotifications(tempNotifications);
      if (tempNotifications.length > 0 && !hasShownNotifications && view === 'list') {
          setShowNotifications(true);
          setHasShownNotifications(true);
      }
  }, [clientList, currentUser, hasShownNotifications, view]);

  // Handlers
  const handleAddNote = async (id, content, type = 'client') => { 
      try { 
          const today = new Date().toISOString().split('T')[0]; 
          const newNote = { 
              id: Date.now(), 
              date: today, 
              content, 
              author: currentUser.name, 
              type: type
          }; 
          
          const custRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', id);
          const docSnap = await getDoc(custRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              const currentNotes = data.notes || [];
              const updatedNotes = [...currentNotes, newNote];
              
              const updateData = { notes: updatedNotes };
              if (type !== 'vendor') {
                  updateData.lastContact = today;
              }

              await updateDoc(custRef, updateData);

              if (selectedCustomer && selectedCustomer.id === id) { 
                  setSelectedCustomer(prev => ({ 
                      ...prev, 
                      lastContact: type !== 'vendor' ? today : prev.lastContact,
                      notes: updatedNotes 
                  })); 
              } 
          }
      } catch(e) { console.error("新增失敗", e); alert("新增失敗"); } 
  };

  const handleDeleteNote = async (id, note, type) => { 
      try { 
          const custRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', id);
          const docSnap = await getDoc(custRef);
          if (docSnap.exists()) {
              const data = docSnap.data();
              const currentNotes = data.notes || [];
              const updatedNotes = currentNotes.filter(n => String(n.id) !== String(note.id));
              
              await updateDoc(custRef, { notes: updatedNotes });

              if (selectedCustomer && selectedCustomer.id === id) { 
                  setSelectedCustomer(prev => ({ ...prev, notes: updatedNotes })); 
              } 
          }
      } catch(e) { console.error("刪除失敗", e); alert("刪除失敗"); } 
  };

  const handleEditNote = async (customerId, noteObj, newContent, type) => { 
      if (!currentUser) return; 
      try { 
          const custRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId); 
          const docSnap = await getDoc(custRef); 
          if (docSnap.exists()) { 
              const data = docSnap.data(); 
              const currentNotes = data.notes || []; 
              const updatedNotes = currentNotes.map(n => (String(n.id) === String(noteObj.id)) ? { ...n, content: newContent } : n); 
              
              await updateDoc(custRef, { notes: updatedNotes }); 
              
              if (selectedCustomer && selectedCustomer.id === customerId) { 
                  setSelectedCustomer(prev => ({ ...prev, notes: updatedNotes })); 
              } 
          } 
      } catch(e) { console.error("編輯失敗", e); alert("編輯失敗"); } 
  };

  // ★★★ 核心修正：系統選項管理 (加入防呆與 appSettings 整合) ★★★
  const handleAddOption = async (type, val) => {
      if (!val) return;
      if (typeof val === 'string' && val.trim() === '') return;

      // 現在這裡一定能取到 adWalls 的舊資料，因為已經整合進 appSettings 了
      const currentList = appSettings[type] || [];

      // 防呆：如果 val 本身是陣列 (舊程式碼的錯誤呼叫)，則報錯或不處理
      if (Array.isArray(val)) {
          console.error("Critical Error: handleAddOption received an array. It expects a single item.", val);
          alert("系統錯誤：資料格式異常 (Nested Array)");
          return;
      }

      // 重複檢查
      const isDuplicate = currentList.some(item => {
          if (typeof item === 'object' && typeof val === 'object') {
              if (type === 'adWalls') return item.address === val.address;
              return item.name === val.name;
          }
          return item === val;
      });

      if (isDuplicate) {
          alert("此資料已存在");
          return;
      }

      const newArray = [...currentList, val];
      
      setAppSettings({ ...appSettings, [type]: newArray });

      if (currentUser?.companyCode) {
          try {
              const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
              await setDoc(settingsRef, { [type]: newArray }, { merge: true });
          } catch (e) {
              console.error("儲存失敗:", e);
              alert("儲存失敗");
          }
      }
  };

  const handleDeleteOption = async (type, opt) => {
      let displayName = opt;
      if (typeof opt === 'object') {
          displayName = opt.address || opt.name;
      }
      
      if (!window.confirm(`確定要刪除「${displayName}」嗎？`)) return;

      const newArray = (appSettings[type] || []).filter(i => {
          if (typeof i === 'object' && typeof opt === 'object') {
              if (type === 'adWalls') return i.address !== opt.address;
              return i.name !== opt.name;
          }
          return i !== opt;
      });

      setAppSettings({ ...appSettings, [type]: newArray });

      if (currentUser?.companyCode) {
          try {
              const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
              await setDoc(settingsRef, { [type]: newArray }, { merge: true });
          } catch (e) {
              console.error("刪除失敗:", e);
              alert("刪除失敗");
          }
      }
  };

  const handleReorderOption = async (type, newOrderArray) => {
      setAppSettings({ ...appSettings, [type]: newOrderArray });
      if (currentUser?.companyCode) {
          try {
              const settingsRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
              await setDoc(settingsRef, { [type]: newOrderArray }, { merge: true });
          } catch (e) { console.error(e); }
      }
  };

  const handleLogin = async (username, password) => { setLoading(true); try { const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users'); const q = query(usersRef, where("username", "==", username), where("password", "==", password)); const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { const userDoc = querySnapshot.docs[0]; const userData = { id: userDoc.id, ...userDoc.data() }; if (userData.status === 'suspended') { alert("此帳號已被停權"); setLoading(false); return; } setCurrentUser(userData); localStorage.setItem('crm-user-profile', JSON.stringify(userData)); setView('list'); } else { alert("帳號或密碼錯誤"); } } catch (error) { console.error("Login Error", error); alert("登入發生錯誤"); } setLoading(false); };
  const handleRegister = () => alert("請聯繫管理員建立帳號");
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('crm-user-profile'); setView('login'); setActiveTab('clients'); setSearchTerm(''); setLoading(false); setHasShownNotifications(false); };
  const handleAddCustomer = async (formData) => { if (!currentUser) return; setLoading(true); try { const cleanData = { ...formData, companyCode: currentUser.companyCode, owner: currentUser.username, ownerName: currentUser.name, createdAt: formData.createdAt ? (formData.createdAt.includes('T') ? formData.createdAt : new Date(formData.createdAt).toISOString()) : new Date().toISOString(), lastContact: new Date().toISOString().split('T')[0], notes: [] }; Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; }); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), cleanData); setView('list'); } catch (error) { alert("新增失敗: " + error.message); } finally { setLoading(false); } };
  const handleEditCustomer = async (formData) => { if (selectedCustomer.owner !== currentUser.username && !isAdmin) return alert("無權限"); try { const { id, ...rest } = formData; const updateData = { ...rest }; if (updateData.createdAt) { const d = new Date(updateData.createdAt); if (!isNaN(d.getTime())) { updateData.createdAt = d; } else { delete updateData.createdAt; } } Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id), updateData); setSelectedCustomer({ ...selectedCustomer, ...updateData }); setView('detail'); } catch (e) { alert("儲存失敗"); } };
  const handleBroadcast = async (target, isActive) => { if (!currentUser?.companyCode) { alert("錯誤"); return; } const targetId = (typeof target === 'object' && target?.id) ? target.id : target; try { const broadcastRef = doc(db, 'artifacts', appId, 'public', 'system', 'broadcast_data', currentUser.companyCode); await setDoc(broadcastRef, { isActive: isActive, targetId: targetId || null, presenterId: currentUser.username, timestamp: serverTimestamp() }); } catch (e) { alert("廣播失敗"); } };
  const handleOverlayClose = (isGlobalClose) => { if (isGlobalClose) handleBroadcast(null, false); else setIncomingBroadcast(null); };
  const handleCustomerClick = (customer) => { setSelectedCustomer(customer); setView('detail'); };
  const handleViewFromNotification = (customerId) => { const target = customers.find(c => c.id === customerId); if (target) { setSelectedCustomer(target); setView('detail'); setShowNotifications(false); } else { alert("找不到該客戶資料"); } };
  const handleBatchImport = async (data) => { alert("請重新整理以檢視新資料"); }; 
  const handleBatchDelete = async (ids) => { alert("請重新整理以檢視變更"); };
  const handleDirectUpdate = async (id, data) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), data); } catch(e) {} };
  const handleProfileSave = async (data) => { try { if (data.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', data.id), data); setShowProfileModal(false); alert("更新成功"); } catch(e) { alert("失敗"); } };
  const saveSettingsToFirestore = async (np, na) => { if(!currentUser?.companyCode)return; const p={}; if(np)p.projects=np; if(na)p.projectAds=na; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), p, {merge:true}); }catch(e){} };
  const handleUpdateProjects = async (newProjects) => { setCompanyProjects(newProjects); await saveSettingsToFirestore(newProjects, null); };
  const handleSaveAnnouncement = async (t) => { if(!currentUser?.companyCode)return; try{ await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode), {announcement:t}, {merge:true}); alert("更新成功"); }catch(e){} };
  const handleDeleteCustomer = async () => { if (selectedCustomer.owner !== currentUser.username && !isAdmin) return alert("無權限"); try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id)); setSelectedCustomer(null); setView('list'); } catch(e){ alert("刪除失敗"); } };
  const handleQuickUpdate = async (notiItem) => { try { if (notiItem.type === 'contact') { const todayStr = new Date().toISOString().split('T')[0]; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { lastContact: todayStr }); } else if (notiItem.type === 'commission') { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { isRenewed: true }); } else if (notiItem.type === 'payment') { const updatedDetails = [...notiItem.scribeDetails]; if (updatedDetails[notiItem.itemIndex]) { updatedDetails[notiItem.itemIndex].isPaid = true; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', notiItem.id), { scribeDetails: updatedDetails }); } } setNotifications(prev => prev.filter(n => !(n.id === notiItem.id && n.type === notiItem.type && n.itemIndex === notiItem.itemIndex))); } catch(e) { console.error(e); } };
  const handleResolveAlert = async (id) => { if(!currentUser?.companyCode) return; try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'system', 'alerts', id)); } catch(e) {} };
  const handleAddRegion = () => { if(!newRegionName.trim()||companyProjects[newRegionName])return; const u={...companyProjects,[newRegionName]:[]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewRegionName(''); };
  const handleAddProject = (r) => { const n=newProjectNames[r]; if(!n||!n.trim()||companyProjects[r].includes(n))return; const u={...companyProjects,[r]:[...(companyProjects[r]||[]),n]}; setCompanyProjects(u); saveSettingsToFirestore(u,null); setNewProjectNames({...newProjectNames,[r]:''}); };
  const handleDeleteRegion = (r) => setPendingDelete({type:'region',region:r});
  const handleDeleteProject = (r,i) => setPendingDelete({type:'project',region:r,item:i});
  const toggleUserStatus = async (u) => { if(currentUser?.role!=='super_admin')return; try{ await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', u.id), {status:u.status==='suspended'?'active':'suspended'}); }catch(e){} };
  const handleDeleteUser = (u) => setPendingDelete({type:'user',item:u});
  const handleSaveAd = async () => { if (!adForm.name.trim() || !adManageProject || !currentUser?.companyCode) return; const currentAds = projectAds[adManageProject] || []; const safeCurrentAds = Array.isArray(currentAds) ? currentAds : []; const normalizedAds = safeCurrentAds.map(a => typeof a === 'string' ? { id: Date.now() + Math.random(), name: a, startDate: '', endDate: '', cost: '' } : a ); let updatedList; if (isEditingAd) { updatedList = normalizedAds.map(a => a.id === adForm.id ? adForm : a); } else { updatedList = [{ ...adForm, id: Date.now() }, ...normalizedAds]; } const newProjectAds = { ...projectAds, [adManageProject]: updatedList }; setProjectAds(newProjectAds); try { const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode); await updateDoc(docRef, { [`projectAds.${adManageProject}`]: updatedList }); } catch (e) { console.error("Ad save failed:", e); } setAdForm({ id: '', name: '', startDate: '', endDate: '', cost: '' }); setIsEditingAd(false); };
  const handleEditAdInit = (a) => { setAdForm(typeof a==='string'?{id:Date.now(),name:a,startDate:'',endDate:'',cost:''}:a); setIsEditingAd(true); };
  const triggerDeleteAd = (i) => setPendingDelete({type:'ad',region:adManageProject,item:i});
  const handleEditAdFromDashboard = (a,p) => { setAdManageProject(p); setAdForm(typeof a==='string'?{id:a,name:a,startDate:'',endDate:'',cost:''}:a); setIsEditingAd(true); };
  const handleDeleteAdFromDashboard = (a,p) => setPendingDelete({type:'ad',region:p,item:a});
  const executeDelete = async () => { if(!pendingDelete) return; const {type,region,item} = pendingDelete; if(type==='user'){ try{await deleteDoc(doc(db,'artifacts',appId,'public','data','app_users',item.id))}catch(e){} } else if(type==='ad'){ let c = projectAds[region] || []; const u = c.filter(a => (a.id ? a.id !== item.id : a !== item)); const newProjectAds = { ...projectAds, [region]: u }; setProjectAds(newProjectAds); if (currentUser?.companyCode) { const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode); await updateDoc(docRef, { [`projectAds.${region}`]: u }); } } else { let u={...companyProjects}; if(type==='region') delete u[region]; else u[region]=u[region].filter(p=>p!==item); setCompanyProjects(u); saveSettingsToFirestore(u,null); } setPendingDelete(null); };
  const handleSaveDeal = async (dealData) => { try{ const id=dealData.id||Date.now().toString(); let ag=dealData.agentName||(dealData.distributions?.[0]?.agentName)||(allUsers.find(u=>u.username===dealData.agent)?.name)||dealData.agent||currentUser?.name||"未知"; const n={...dealData,id,createdAt:dealData.createdAt||new Date().toISOString(),companyCode:currentUser.companyCode,agentName:ag}; await setDoc(doc(db,'artifacts',appId,'public','data','deals',id),n,{merge:true}); alert("已儲存"); }catch(e){alert("失敗");} };
  const handleDeleteDeal = async (id) => { if(!confirm("刪除？"))return; try{await deleteDoc(doc(db,'artifacts',appId,'public','data','deals',id))}catch(e){} };
  const openProfile = () => { const me = allUsers.find(u => u.username === currentUser.username) || currentUser; setMyProfileData(me); setShowProfileModal(true); };
  const handleProfileImage = (e) => { const file = e.target.files[0]; if(file) { if (file.size > 800 * 1024) return alert("圖片太大 (限 800KB)"); const reader = new FileReader(); reader.onloadend = () => setMyProfileData({...myProfileData, photoUrl: reader.result}); reader.readAsDataURL(file); } };
  
  const agentStats = useMemo(() => {
      if (!Array.isArray(allUsers) || !Array.isArray(deals)) return [];
      const map = {};
      allUsers.forEach(u => { if (u && u.name) map[u.name] = { name: u.name, total: 0, commission: 0, photoUrl: u.photoUrl }; });
      deals.forEach(d => {
          const dateRef = d.dealDate || d.signDate || d.date;
          if (checkDateMatch(dateRef, dashTimeFrame, statYear, statMonth, statWeek)) {
              if (Array.isArray(d.devAgents)) {
                  d.devAgents.forEach(ag => {
                      const agentName = ag.user || ag.agent || ag.name;
                      const target = map[agentName] || (allUsers.find(u => u.username === agentName)?.name && map[allUsers.find(u => u.username === agentName).name]);
                      if (target) { target.commission += parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0; target.total += 0.5; }
                  });
              }
              if (Array.isArray(d.salesAgents)) {
                  d.salesAgents.forEach(ag => {
                      const agentName = ag.user || ag.agent || ag.name;
                      const target = map[agentName] || (allUsers.find(u => u.username === agentName)?.name && map[allUsers.find(u => u.username === agentName).name]);
                      if (target) { target.commission += parseFloat(String(ag.amount || 0).replace(/,/g, '')) || 0; target.total += 0.5; }
                  });
              }
          }
      });
      return Object.values(map).sort((a, b) => b.commission - a.commission).filter(a => a.commission > 0);
  }, [deals, dashTimeFrame, statYear, statMonth, statWeek, allUsers]);

  const handleExportExcel = () => { setIsExporting(true); setTimeout(()=>{ alert("匯出功能已觸發"); setIsExporting(false); setShowExportMenu(false); },1000); };
  
  const hasActiveBanner = announcement && announcement.active && announcement.content && showBanner;

  const handleVendorClick = (vendor) => {
      setSelectedCustomer(vendor);
      setShowVendorModal(true); 
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (view === 'login') return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} darkMode={darkMode} />;
  
  if (view === 'add') return <CustomerForm customers={customers} onSubmit={handleAddCustomer} onCancel={() => setView('list')} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} currentUser={currentUser} />;
  if (view === 'edit' && selectedCustomer) return <CustomerForm customers={customers} onSubmit={handleEditCustomer} onCancel={() => setView('detail')} initialData={selectedCustomer} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} allUsers={allUsers} currentUser={currentUser} />;
  
  if (view === 'detail' && selectedCustomer) {
      return (
          <CustomerDetail 
              customer={selectedCustomer} 
              allCustomers={customers} 
              currentUser={currentUser} 
              onEdit={() => setView('edit')} 
              onDelete={handleDeleteCustomer} 
              onAddNote={(id, txt, type) => handleAddNote(id, txt, type)} 
              onDeleteNote={(id, note, type) => handleDeleteNote(id, note, type)} 
              onEditNote={(id, note, txt, type) => handleEditNote(id, note, txt, type)} 
              onBack={() => setView('list')} 
              darkMode={darkMode} 
              onQuickUpdate={handleQuickUpdate} 
              allUsers={allUsers} 
              onBroadcast={handleBroadcast} 
              onUpdateCustomer={handleDirectUpdate} 
              noteType='client' 
          />
      );
  }

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'} overflow-x-hidden ${hasActiveBanner ? 'pt-10' : ''}`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      
      <style>{`
          @keyframes marquee {
              0% { transform: translateX(100vw); }
              100% { transform: translateX(-100%); }
          }
          .animate-marquee {
              animation: marquee linear 1; 
              white-space: nowrap;
              display: inline-block;
          }
      `}</style>

      {hasActiveBanner && (
          <div className="fixed top-0 left-0 right-0 z-[9999] w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white p-2 shadow-lg flex items-center overflow-hidden h-10">
              <div className="flex-shrink-0 px-2">
                  <Megaphone className="w-4 h-4 text-white animate-pulse" />
              </div>
              <div className="flex-1 overflow-hidden marquee-container relative h-full flex items-center mr-10">
                  <div 
                      ref={marqueeTextRef}
                      style={{ animationDuration: `${marqueeDuration}s` }}
                      className="animate-marquee font-bold tracking-wide absolute flex items-center text-sm"
                      onAnimationEnd={() => setShowBanner(false)}
                  >
                      <span>{announcement.content}</span>
                  </div>
              </div>
              <button onClick={() => setShowBanner(false)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-white/20 rounded-full transition-colors"><X className="w-4 h-4 text-white" /></button>
          </div>
      )}

      {incomingBroadcast && <BroadcastOverlay data={incomingBroadcast} isPresenter={myBroadcastStatus} onClose={handleOverlayClose} onView={handleViewFromNotification} />}
      {showNotifications && <NotificationModal notifications={notifications} onClose={() => setShowNotifications(false)} onQuickUpdate={handleQuickUpdate} onView={handleViewFromNotification} />}
      
      {showVendorModal && selectedCustomer && (
          <VendorDetailModal 
              vendor={selectedCustomer}
              onClose={() => setShowVendorModal(false)}
              onAddNote={handleAddNote}
              onDeleteNote={handleDeleteNote}
              onEditNote={handleEditNote}
              currentUser={currentUser}
              isAdmin={isAdmin}
          />
      )}

      {activeTab === 'clients' ? <ClientsView 
            companyProjects={companyProjects} onUpdateProjects={handleUpdateProjects} 
            customers={clientList}
            currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout} listMode={listMode} setListMode={setListMode} listYear={listYear} setListYear={setListYear} listMonth={listMonth} setListMonth={setListMonth} listWeekDate={listWeekDate} setListWeekDate={setListWeekDate} searchTerm={searchTerm} setSearchTerm={setSearchTerm} loading={loading} isAdmin={isAdmin} setView={setView} setSelectedCustomer={setSelectedCustomer} onCustomerClick={handleCustomerClick} onImport={handleBatchImport} onBatchDelete={handleBatchDelete} onBroadcast={handleBroadcast} onOpenProfile={openProfile} appSettings={appSettings}
            /> : 
        activeTab === 'vendors' ? <VendorsView 
            customers={vendorList}
            currentUser={currentUser} isAdmin={isAdmin} 
            onAddNote={(id, txt) => handleAddNote(id, txt, 'vendor')} 
            onDeleteNote={(id, note) => handleDeleteNote(id, note, 'vendor')} 
            onVendorClick={handleVendorClick}
            /> : 
        <DashboardView 
            saveSettings={saveSettingsToFirestore}
            customers={clientList}
            isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout} 
            dashTimeFrame={dashTimeFrame} setDashTimeFrame={setDashTimeFrame} agentStats={agentStats} companyProjects={companyProjects} projectAds={projectAds} allUsers={allUsers} newRegionName={newRegionName} setNewRegionName={setNewRegionName} newProjectNames={newProjectNames} setNewProjectNames={setNewProjectNames} onAddRegion={handleAddRegion} onDeleteRegion={handleDeleteRegion} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject} onToggleUser={toggleUserStatus} onDeleteUser={handleDeleteUser} 
            onManageAd={setAdManageProject} adManageProject={adManageProject} setAdManageProject={setAdManageProject} adForm={adForm} setAdForm={setAdForm} isEditingAd={isEditingAd} setIsEditingAd={setIsEditingAd} 
            dashboardView={dashboardView} setDashboardView={setDashboardView} 
            handleExportExcel={handleExportExcel} isExporting={isExporting} showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu} 
            appSettings={appSettings} 
            // ✅ 傳遞正確的 Options Handler
            onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} onReorderOption={handleReorderOption} 
            deals={deals} handleSaveDeal={handleSaveDeal} handleDeleteDeal={handleDeleteDeal} 
            statYear={statYear} setStatYear={setStatYear} statMonth={statMonth} setStatMonth={setStatMonth} 
            onSaveAd={handleSaveAd} 
            onEditAdInit={handleEditAdInit} triggerDeleteAd={triggerDeleteAd} onEditAd={handleEditAdFromDashboard} onDeleteAd={handleDeleteAdFromDashboard} announcement={announcement} onSaveAnnouncement={handleSaveAnnouncement} 
            // ✅ 傳遞正確的 adWalls (從 appSettings 取)
            adWalls={appSettings.adWalls || []} 
            systemAlerts={systemAlerts} onResolveAlert={handleResolveAlert} statWeek={statWeek} setStatWeek={setStatWeek} onOpenProfile={openProfile}
            onOpenSettings={() => { setActiveTab('dashboard'); setDashboardView('settings'); }}
        />
      }

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} systemAlerts={systemAlerts} />
      {showProfileModal && <ProfileModal currentUser={currentUser} onClose={() => setShowProfileModal(false)} onSave={handleProfileSave} />}
    </div>
  );
}