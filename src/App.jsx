import React, { useState, useMemo, useEffect } from 'react';
import { 
  Loader2, Moon, Sun, LogOut, LayoutDashboard, List 
} from 'lucide-react';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInAnonymously 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  setDoc, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove, 
  getDocs,
  writeBatch
} from 'firebase/firestore';

import { 
    appId, 
    ADMIN_CODE, 
    SUPER_ADMIN_CODE, 
    DEFAULT_SOURCES, 
    DEFAULT_CATEGORIES, 
    DEFAULT_LEVELS, 
    DEFAULT_PROJECTS,
    DAILY_QUOTES,
    SYSTEM_ANNOUNCEMENT
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
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [companyProjects, setCompanyProjects] = useState(DEFAULT_PROJECTS);
  const [projectAds, setProjectAds] = useState({}); 
  const [appSettings, setAppSettings] = useState({
      sources: DEFAULT_SOURCES,
      categories: DEFAULT_CATEGORIES,
      levels: DEFAULT_LEVELS
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

  useEffect(() => {
      if (!currentUser?.companyCode) return;
      const dealsRef = collection(db, 'artifacts', appId, 'public', 'data', 'deals');
      const q = query(dealsRef, where("companyCode", "==", currentUser.companyCode));
      const unsubscribe = onSnapshot(q, (snapshot) => {
          const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          data.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
          setDeals(data);
      }, (error) => { console.error("Deals Snapshot Error:", error); });
      return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (error) { setLoading(false); }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setSessionUser(u);
      const savedUser = localStorage.getItem('crm-user-profile');
      if (savedUser) {
        try {
            setCurrentUser(JSON.parse(savedUser));
            setView('list');
        } catch (e) {
            console.error("Profile Parse Error", e);
            localStorage.removeItem('crm-user-profile');
            setView('login');
            setLoading(false);
        }
      } else {
        setView('login');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!sessionUser || !currentUser) return;
    setLoading(true);
    const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'customers');
    const q = currentUser.companyCode 
        ? query(collectionRef, where("companyCode", "==", currentUser.companyCode))
        : query(collectionRef); 
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
            levels: data.levels || DEFAULT_LEVELS
        });
      } else {
        const initData = { 
            projects: DEFAULT_PROJECTS, projectAds: {},
            sources: DEFAULT_SOURCES, categories: DEFAULT_CATEGORIES, levels: DEFAULT_LEVELS,
            announcement: SYSTEM_ANNOUNCEMENT
        };
        setCompanyProjects(DEFAULT_PROJECTS);
        setAppSettings({ sources: DEFAULT_SOURCES, categories: DEFAULT_CATEGORIES, levels: DEFAULT_LEVELS });
        setProjectAds({});
        setAnnouncement(SYSTEM_ANNOUNCEMENT);
        setDoc(settingsDocRef, initData, { merge: true });
      }
    }, (error) => console.error("Settings Error:", error));
    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
      if (currentUser?.role === 'super_admin' && currentUser?.companyCode) {
          const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
          const q = query(usersRef, where("companyCode", "==", currentUser.companyCode));
          const unsubscribe = onSnapshot(q, (snapshot) => {
              const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setAllUsers(users); 
          }, (error) => console.error("Users Error:", error));
          return () => unsubscribe();
      }
  }, [currentUser]);

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('crm-user-profile');
    setView('login');
    setActiveTab('clients');
    setSearchTerm('');
    setLoading(false);
  };

  const handleLogin = async (username, password, companyCode, rememberMe) => {
    setLoading(true);
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      const q = query(usersRef, where("username", "==", username)); 
      const querySnapshot = await getDocs(q);
      let foundUser = null;
      querySnapshot.forEach((doc) => {
          const u = doc.data();
          if (u.password === password) {
              if (u.companyCode && u.companyCode !== companyCode) return;
              foundUser = { id: doc.id, ...u };
          }
      });
      if (foundUser) {
        if (foundUser.status === 'suspended') {
            alert("此帳號已被停權，請聯繫經營者。");
            setLoading(false);
            return;
        }
        const profile = { 
            username: foundUser.username, 
            name: foundUser.name, 
            role: foundUser.role,
            companyCode: foundUser.companyCode || companyCode 
        };
        setCurrentUser(profile);
        localStorage.setItem('crm-user-profile', JSON.stringify(profile));
        
        if (rememberMe) {
            const loginInfo = { username, password, companyCode };
            localStorage.setItem('crm-login-info', btoa(JSON.stringify(loginInfo)));
        } else {
            localStorage.removeItem('crm-login-info');
        }
        setView('list');
      } else {
        alert("登入失敗：帳號、密碼或公司統編錯誤");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      alert("登入發生錯誤");
      setLoading(false);
    }
  };

  const handleRegister = async (username, password, name, role, adminCode, companyCode) => {
    if (!username || !password || !name || !companyCode) return alert("請填寫完整資訊 (含公司統編)");
    setLoading(true);
    let finalRole = role;
    if (role === 'admin') {
        if (adminCode === SUPER_ADMIN_CODE) finalRole = 'super_admin';
        else if (adminCode === ADMIN_CODE) finalRole = 'admin';
        else { setLoading(false); alert("註冊碼錯誤！"); return false; }
    }
    try {
      const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users');
      const q = query(usersRef, where("username", "==", username)); 
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("此帳號已被註冊");
        setLoading(false);
        return false;
      } else {
        await addDoc(usersRef, { 
            username, password, name, role: finalRole, companyCode, status: 'active', createdAt: serverTimestamp() 
        });
        alert(`註冊成功！`);
        setLoading(false);
        return true; 
      }
    } catch (e) {
      console.error(e);
      alert("註冊失敗");
      setLoading(false);
    }
    return false;
  };

  // --- Data Handlers ---
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

      Object.keys(newCustomer).forEach(key => {
          if (newCustomer[key] === undefined) delete newCustomer[key];
      });

      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), newCustomer);
      
      try {
          const today = new Date().getDay(); 
          const quotes = (typeof DAILY_QUOTES !== 'undefined' && Array.isArray(DAILY_QUOTES)) 
              ? DAILY_QUOTES 
              : ["每天進步一點點，離夢想更近一點點！"];
          
          const quote = quotes[today] || quotes[0];
          alert(`新增成功！\n\n💡 今日勉勵：\n${quote}`);
      } catch (e) {
          alert("新增成功！"); 
      }

    } catch (err) { 
        console.error("Add Customer Error:", err); 
        alert(`新增失敗：${err.message}`);
    }
  };

  const handleBatchImport = async (importedData) => {
      if (!currentUser) return;
      setLoading(true);
      
      try {
          const batchPromises = importedData.map(data => {
              
              const safeDate = (val) => {
                  if (!val) return new Date(); 
                  let d = new Date(val);
                  if (isNaN(d.getTime()) || d.getFullYear() > 3000 || d.getFullYear() < 1900) {
                      return new Date(); 
                  }
                  return d;
              };

              const cleanData = {
                  ...data,
                  owner: currentUser.username, 
                  ownerName: currentUser.name, 
                  companyCode: currentUser.companyCode,
                  createdAt: safeDate(data.createdAt),
                  lastContact: typeof data.lastContact === 'string' 
                      ? data.lastContact 
                      : safeDate(data.createdAt).toISOString().split('T')[0],
                  notes: [],
                  value: data.value ? Number(String(data.value).replace(/,/g, '')) : 0
              };

              Object.keys(cleanData).forEach(key => {
                  if (cleanData[key] === undefined) {
                      delete cleanData[key];
                  }
              });

              return addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), cleanData);
          });
          
          await Promise.all(batchPromises);
          alert(`成功匯入 ${importedData.length} 筆客戶資料！`);

      } catch (error) {
          console.error("Batch Import Error:", error);
          alert(`匯入失敗：${error.message}\n(可能是日期格式問題，系統已嘗試自動修復但失敗)`);
      } finally {
          setLoading(false);
      }
  };

  const handleBatchDelete = async (idsToDelete) => {
      if (!idsToDelete || idsToDelete.length === 0) return;
      if (!confirm(`確定要永久刪除選取的 ${idsToDelete.length} 筆資料嗎？`)) return;

      setLoading(true);
      try {
          const batch = writeBatch(db);
          idsToDelete.forEach(id => {
              const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', id);
              batch.delete(docRef);
          });
          
          await batch.commit();
          alert("刪除成功！");
      } catch (error) {
          console.error("Batch Delete Error:", error);
          alert("部分刪除失敗，請檢查權限或網路。");
      } finally {
          setLoading(false);
      }
  };

  const handleEditCustomer = async (formData) => {
    const isSuperAdmin = currentUser.role === 'super_admin';
    if (selectedCustomer.owner !== currentUser.username && !isSuperAdmin) {
        return alert("無權限：您只能編輯自己的客戶資料");
    }
    try {
      const { id, ...rest } = formData;
      const updateData = { ...rest };
      
      if (updateData.createdAt) {
          const dateObj = new Date(updateData.createdAt);
          if (!isNaN(dateObj.getTime())) {
              updateData.createdAt = dateObj;
              const y = dateObj.getFullYear();
              const m = String(dateObj.getMonth() + 1).padStart(2, '0');
              const d = String(dateObj.getDate()).padStart(2, '0');
              updateData.lastContact = `${y}-${m}-${d}`;
          } else { 
              delete updateData.createdAt; 
          }
      }
      
      Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id), updateData);
      
      setView('detail');

    } catch (err) { console.error(err); alert("儲存失敗"); }
  };

  const handleDeleteCustomer = async () => {
    const isSuperAdmin = currentUser.role === 'super_admin';
    if (selectedCustomer.owner !== currentUser.username && !isSuperAdmin) {
        return alert("無權限：您只能刪除自己的客戶");
    }
    try {
       await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id));
       setSelectedCustomer(null);
       setShowDeleteModal(false); 
       setView('list');
    } catch(err) { console.error(err); }
  };

  const handleAddNote = async (customerId, noteContent) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const newNote = { 
          id: Date.now(), 
          date: today, 
          content: noteContent, 
          author: currentUser.name 
      };
      
      await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId), { 
          notes: arrayUnion(newNote), 
          lastContact: today 
      });
    } catch (err) { console.error(err); }
  };

  const handleDeleteNote = async (customerId, noteObject) => {
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId), { notes: arrayRemove(noteObject) });
      } catch (err) { console.error(err); }
  };

  // --- Settings & Ads Handlers ---
  const saveAppSettings = async (newSettings) => {
      if (!currentUser?.companyCode) return;
      try {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
          await setDoc(ref, newSettings, { merge: true });
      } catch(e) { console.error(e); }
  };
  
  const handleSaveAnnouncement = async (text) => {
      if (!currentUser?.companyCode) return;
      try {
          const ref = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
          await setDoc(ref, { announcement: text }, { merge: true });
          alert("跑馬燈已更新！");
      } catch(e) { console.error(e); alert("更新失敗"); }
  };

  const handleAddOption = (type, value) => {
      const val = value ? value.trim() : '';
      if (!val) return;
      if (appSettings[type].includes(val)) return alert("選項已存在");
      const updatedList = [...appSettings[type], val];
      const newSettings = { ...appSettings, [type]: updatedList };
      setAppSettings(newSettings);
      saveAppSettings({ [type]: updatedList });
  };

  const handleDeleteOption = (type, option) => {
      const updatedList = appSettings[type].filter(item => item !== option);
      const newSettings = { ...appSettings, [type]: updatedList };
      setAppSettings(newSettings);
      saveAppSettings({ [type]: updatedList });
  };

  const handleReorderOption = (type, fromIndex, toIndex) => {
      const list = [...appSettings[type]];
      const [removed] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, removed);
      const newSettings = { ...appSettings, [type]: list };
      setAppSettings(newSettings);
      saveAppSettings({ [type]: list });
  };

  const saveSettingsToFirestore = async (newProjects, newProjectAds) => {
    if (!currentUser?.companyCode) return;
    try {
      const ref = doc(db, 'artifacts', appId, 'public', 'data', 'company_settings', currentUser.companyCode);
      const payload = {};
      if (newProjects) payload.projects = newProjects;
      if (newProjectAds) payload.projectAds = newProjectAds;
      await setDoc(ref, payload, { merge: true });
    } catch (e) { console.error(e); }
  };

  const handleAddRegion = () => {
    if (!newRegionName.trim()) return;
    if (companyProjects[newRegionName]) return alert("重複分類");
    const updated = { ...companyProjects, [newRegionName]: [] };
    setCompanyProjects(updated);
    saveSettingsToFirestore(updated, null);
    setNewRegionName('');
  };

  const handleAddProject = (region) => {
    const pName = newProjectNames[region];
    if (!pName || !pName.trim()) return;
    const list = companyProjects[region] || [];
    if (list.includes(pName)) return alert("重複案場");
    const updated = { ...companyProjects, [region]: [...list, pName] };
    setCompanyProjects(updated);
    saveSettingsToFirestore(updated, null);
    setNewProjectNames({ ...newProjectNames, [region]: '' });
  };

  const handleDeleteRegion = (region) => setPendingDelete({ type: 'region', region });
  const handleDeleteProject = (region, item) => setPendingDelete({ type: 'project', region, item });
  const toggleUserStatus = async (user) => {
      if (currentUser?.role !== 'super_admin') return;
      try {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', user.id), { status: user.status === 'suspended' ? 'active' : 'suspended' });
      } catch(e) { console.error(e); }
  };
  const handleDeleteUser = (user) => setPendingDelete({ type: 'user', item: user });

  // Ads
  const handleSaveAd = () => {
    if (!adForm.name.trim() || !adManageProject) return;
    let currentAds = projectAds[adManageProject] || [];
    currentAds = currentAds.map(ad => typeof ad === 'string' ? { id: Date.now() + Math.random(), name: ad, startDate: '', endDate: '' } : ad);
    
    let updatedAdsList;
    if (isEditingAd) updatedAdsList = currentAds.map(ad => ad.id === adForm.id ? adForm : ad);
    else updatedAdsList = [...currentAds, { ...adForm, id: Date.now() }];

    const updatedAdsMap = { ...projectAds, [adManageProject]: updatedAdsList };
    setProjectAds(updatedAdsMap);
    saveSettingsToFirestore(null, updatedAdsMap);
    setAdForm({ id: '', name: '', startDate: '', endDate: '' });
    setIsEditingAd(false);
  };

  const handleEditAdInit = (ad) => {
      setAdForm(typeof ad === 'string' ? { id: ad, name: ad, startDate: '', endDate: '' } : ad);
      setIsEditingAd(true);
  };
  const triggerDeleteAd = (item) => setPendingDelete({ type: 'ad', region: adManageProject, item });
  const handleEditAdFromDashboard = (ad, project) => {
      setAdManageProject(project);
      setAdForm(typeof ad === 'string' ? { id: ad, name: ad, startDate: '', endDate: '' } : ad);
      setIsEditingAd(true);
  };
  const handleDeleteAdFromDashboard = (ad, project) => setPendingDelete({ type: 'ad', region: project, item: ad });

  const executeDelete = async () => {
      if (!pendingDelete) return;
      const { type, region, item } = pendingDelete;
      if (type === 'user') {
          try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'app_users', item.id)); } catch(e){}
      } else if (type === 'ad') {
          let currentAds = projectAds[region] || [];
          const updatedList = currentAds.filter(a => (a.id ? a.id !== item.id : a !== item));
          const updatedMap = { ...projectAds, [region]: updatedList };
          setProjectAds(updatedMap);
          saveSettingsToFirestore(null, updatedMap);
      } else {
          let updated = { ...companyProjects };
          if (type === 'region') delete updated[region];
          else if (type === 'project') updated[region] = updated[region].filter(p => p !== item);
          setCompanyProjects(updated);
          saveSettingsToFirestore(updated, null);
      }
      setPendingDelete(null);
  };

  const handleSaveDeal = async (dealData) => {
      try {
          const dealId = dealData.id || Date.now().toString();
          
          let finalAgentName = dealData.agentName;
          
          if (!finalAgentName) {
              if (dealData.distributions && dealData.distributions.length > 0) {
                  finalAgentName = dealData.distributions[0].agentName;
              } else if (dealData.agent) {
                  finalAgentName = allUsers.find(u => u.username === dealData.agent)?.name || dealData.agent;
              }
          }
          if (!finalAgentName) {
              finalAgentName = currentUser?.name || "未知";
          }

          const newDeal = { 
              ...dealData, 
              id: dealId,
              createdAt: dealData.createdAt || new Date().toISOString(),
              companyCode: currentUser.companyCode,
              agentName: finalAgentName
          };

          const dealRef = doc(db, 'artifacts', appId, 'public', 'data', 'deals', dealId);
          await setDoc(dealRef, newDeal, { merge: true });
          
          alert("成交報告已儲存 (雲端同步)");
      } catch (e) {
          console.error("Save Deal Error:", e);
          alert("儲存失敗：資料格式錯誤 (請檢查 Console)");
      }
  };

  const handleDeleteDeal = async (dealId) => {
      if (!confirm("確定要刪除？(此操作會同步刪除雲端資料)")) return;
      try {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'deals', dealId));
      } catch (e) {
          console.error("Delete Deal Error:", e);
          alert("刪除失敗");
      }
  };
  
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  // App.jsx 中的 visibleCustomers / groupedCustomers 邏輯已移至 ClientsView
  // 這裡只負責 Dashboard 統計
  const dashboardStats = useMemo(() => {
      let totalRevenue = 0;
      let won = 0;
      deals.forEach(d => {
          const dYear = new Date(d.date).getFullYear();
          const dMonth = new Date(d.date).getMonth() + 1;
          let include = false;
          if (dashTimeFrame === 'all') include = true;
          else if (dashTimeFrame === 'year') include = dYear === statYear;
          else if (dashTimeFrame === 'month') include = dYear === statYear && dMonth === statMonth;
          
          if (include) {
              totalRevenue += (Number(d.commission) || 0);
              won++;
          }
      });
      return { totalRevenue, counts: { total: customers.length, won } };
  }, [customers, deals, dashTimeFrame, statYear, statMonth]);

  const agentStats = useMemo(() => {
      const map = {};
      customers.forEach(c => {
          const agent = c.ownerName || c.owner || '未知';
          if (!map[agent]) map[agent] = { name: agent, total: 0, new:0, contacting:0, offer:0, closed:0, lost:0, commission: 0 };
          map[agent].total++;
          if (map[agent][c.status] !== undefined) map[agent][c.status]++;
      });
      
      deals.forEach(d => {
         const dDate = new Date(d.date);
         const dYear = dDate.getFullYear();
         const dMonth = dDate.getMonth() + 1;
         let include = false;
         if (dashTimeFrame === 'all') include = true;
         else if (dashTimeFrame === 'year') include = dYear === statYear;
         else if (dashTimeFrame === 'month') include = dYear === statYear && dMonth === statMonth;
         
         if (include) {
             if (d.distributions && d.distributions.length > 0) {
                 d.distributions.forEach(dist => {
                     const agentName = dist.agentName || (allUsers.find(u => u.username === dist.userId)?.name) || dist.userId || '未知';
                     if (!map[agentName]) {
                         map[agentName] = { name: agentName, total: 0, new:0, contacting:0, offer:0, closed:0, lost:0, commission: 0 };
                     }
                     map[agentName].commission += (Number(dist.amount) || 0);
                 });
             } else {
                 const agent = d.agentName || '未知';
                 if (!map[agent]) {
                     map[agent] = { name: agent, total: 0, new:0, contacting:0, offer:0, closed:0, lost:0, commission: 0 };
                 }
                 map[agent].commission += (Number(d.commission) || 0);
             }
         }
      });
      return Object.values(map).sort((a,b) => b.commission - a.commission);
  }, [customers, deals, dashTimeFrame, statYear, statMonth, allUsers]);

  const handleExportExcel = (type) => { 
      setIsExporting(true);
      setTimeout(() => { alert("匯出功能已觸發"); setIsExporting(false); setShowExportMenu(false); }, 1000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  if (view === 'login') return <LoginScreen onLogin={handleLogin} onRegister={handleRegister} loading={loading} darkMode={darkMode} />;
  
  if (view === 'add') return <CustomerForm onSubmit={handleAddCustomer} onCancel={() => setView('list')} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} />;
  
  if (view === 'edit' && selectedCustomer) return <CustomerForm onSubmit={handleEditCustomer} onCancel={() => setView('detail')} initialData={selectedCustomer} appSettings={appSettings} companyProjects={companyProjects} projectAds={projectAds} darkMode={darkMode} />;
  
  if (view === 'detail' && selectedCustomer) return <CustomerDetail customer={selectedCustomer} currentUser={currentUser} onEdit={() => setView('edit')} onDelete={handleDeleteCustomer} onAddNote={handleAddNote} onDeleteNote={handleDeleteNote} onBack={() => setView('list')} darkMode={darkMode} />;

  return (
    <div className={`min-h-screen w-full transition-colors duration-300 ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'} overflow-x-hidden`} style={{ colorScheme: darkMode ? 'dark' : 'light' }}>
      
      {view === 'list' && <Marquee text={announcement} darkMode={darkMode} />}

      {activeTab === 'clients' ? (
          <ClientsView 
            // ★★★ 關鍵修正：這裡原本傳的是 visibleCustomers (空)，現在改傳 customers (原始資料) ★★★
            customers={customers}
            
            currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout}
            listMode={listMode} setListMode={setListMode} listYear={listYear} setListYear={setListYear} listMonth={listMonth} setListMonth={setListMonth} listWeekDate={listWeekDate} setListWeekDate={setListWeekDate}
            searchTerm={searchTerm} setSearchTerm={setSearchTerm}
            loading={loading} isAdmin={isAdmin}
            setView={setView} setSelectedCustomer={setSelectedCustomer}
            onImport={handleBatchImport}
            onBatchDelete={handleBatchDelete}
          />
      ) : (
          <DashboardView 
            isAdmin={isAdmin} isSuperAdmin={isSuperAdmin} currentUser={currentUser} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleLogout={handleLogout}
            dashboardStats={dashboardStats} dashTimeFrame={dashTimeFrame} setDashTimeFrame={setDashTimeFrame} agentStats={agentStats}
            companyProjects={companyProjects} projectAds={projectAds} allUsers={allUsers}
            newRegionName={newRegionName} setNewRegionName={setNewRegionName} newProjectNames={newProjectNames} setNewProjectNames={setNewProjectNames}
            onAddRegion={handleAddRegion} onDeleteRegion={handleDeleteRegion} onAddProject={handleAddProject} onDeleteProject={handleDeleteProject}
            onToggleUser={toggleUserStatus} onDeleteUser={handleDeleteUser} 
            onManageAd={setAdManageProject}
            adManageProject={adManageProject} setAdManageProject={setAdManageProject} adForm={adForm} setAdForm={setAdForm} isEditingAd={isEditingAd} setIsEditingAd={setIsEditingAd}
            dashboardView={dashboardView} setDashboardView={setDashboardView}
            handleExportExcel={handleExportExcel} isExporting={isExporting} showExportMenu={showExportMenu} setShowExportMenu={setShowExportMenu}
            appSettings={appSettings}
            onAddOption={handleAddOption} onDeleteOption={handleDeleteOption} onReorderOption={handleReorderOption}
            deals={deals} handleSaveDeal={handleSaveDeal} handleDeleteDeal={handleDeleteDeal}
            statYear={statYear} setStatYear={setStatYear} statMonth={statMonth} setStatMonth={setStatMonth}
            onSaveAd={handleSaveAd} onEditAdInit={handleEditAdInit} triggerDeleteAd={triggerDeleteAd}
            onEditAd={handleEditAdFromDashboard} onDeleteAd={handleDeleteAdFromDashboard}
            announcement={announcement} onSaveAnnouncement={handleSaveAnnouncement}
          />
      )}
      
      <div className={`fixed bottom-0 w-full border-t flex justify-around items-center py-2 z-40 shadow-lg ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-gray-200'}`}>
        <button onClick={() => setActiveTab('clients')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'clients' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}><List className="w-6 h-6"/><span className="text-[10px] mt-1">列表</span></button>
        {isAdmin && <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center p-2 w-24 active:scale-95 transition-transform ${activeTab === 'dashboard' ? 'text-blue-500 font-bold' : 'text-gray-400'}`}><LayoutDashboard className="w-6 h-6"/><span className="text-[10px] mt-1">後台</span></button>}
      </div>

      {pendingDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
            <div className={`w-full max-w-sm p-6 rounded-2xl shadow-2xl transform transition-all ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                <div className="flex items-center gap-3 mb-4 text-red-500"><div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full"><Trash2 className="w-6 h-6 text-red-600" /></div><h3 className="text-lg font-bold">確認刪除</h3></div>
                <p className="text-sm opacity-80 mb-6 leading-relaxed">
                    {pendingDelete.type === 'region' ? `確定要刪除分類「${pendingDelete.region}」嗎？` : pendingDelete.type === 'project' ? `確定要刪除案場「${pendingDelete.item}」嗎？` : pendingDelete.type === 'ad' ? `確定要刪除廣告「${pendingDelete.item.name}」嗎？` : `確定要刪除使用者「${pendingDelete.item.name}」嗎？`}
                    <br/><span className="text-red-500 font-bold text-xs mt-1 block font-bold">注意：此操作無法復原。</span>
                </p>
                <div className="flex gap-3">
                    <button onClick={() => setPendingDelete(null)} className="flex-1 py-3 rounded-xl font-bold bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 hover:bg-gray-200 transition-colors">取消</button>
                    <button onClick={executeDelete} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-600/30 transition-all active:scale-95">確認刪除</button>
                </div>
            </div>
        </div>
      )}

      {adManageProject && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl transform transition-all max-h-[85vh] overflow-y-auto ${darkMode ? 'bg-slate-900 text-white' : 'bg-white'}`}>
                <div className="flex justify-between items-center mb-4 border-b dark:border-slate-800 pb-3"><h3 className="text-lg font-bold flex items-center gap-2"><MonitorPlay className="w-5 h-5 text-blue-500"/> 管理廣告: {adManageProject}</h3><button onClick={() => { setAdManageProject(null); setIsEditingAd(false); }} className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><XCircle/></button></div>
                <div className="space-y-3 mb-6 bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl border border-gray-100 dark:border-slate-800">
                    <input value={adForm.name} onChange={(e) => setAdForm({...adForm, name: e.target.value})} className={`w-full px-3 py-2 rounded-lg border text-sm outline-none notranslate ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} placeholder="廣告名稱" autoComplete="off" />
                    <div className="flex gap-2">
                        <input type="date" value={adForm.startDate} onChange={(e) => setAdForm({...adForm, startDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                        <input type="date" value={adForm.endDate} onChange={(e) => setAdForm({...adForm, endDate: e.target.value})} className={`flex-1 px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} />
                    </div>
                    <button onClick={handleSaveAd} className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-bold active:scale-95 transition-all shadow-md shadow-blue-600/20">{isEditingAd ? '儲存變更' : '新增廣告'}</button>
                </div>
                <div className="space-y-2">
                    {(projectAds[adManageProject] || []).map((ad, idx) => {
                        const adObj = typeof ad === 'string' ? { id: idx, name: ad, endDate: '' } : ad;
                        return (
                            <div key={adObj.id || idx} className="flex justify-between items-center p-3 rounded-lg border dark:border-slate-800 text-sm hover:border-blue-300 transition-colors">
                                <div><span className="font-bold block">{adObj.name}</span></div>
                                <div className="flex gap-1">
                                    <button onClick={() => handleEditAdInit(ad)} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-full"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => triggerDeleteAd(adObj)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-slate-800 rounded-full"><Trash2 className="w-4 h-4"/></button>
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
}