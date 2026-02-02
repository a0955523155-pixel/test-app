import React, { useState, useEffect, useMemo } from 'react';
import { Loader2, Moon, Sun, LogOut, Edit, Trash2, X } from 'lucide-react';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, doc, addDoc, updateDoc, deleteDoc, onSnapshot, query, where, setDoc, serverTimestamp, arrayUnion, arrayRemove, getDocs, writeBatch, getDoc } from 'firebase/firestore';

import { appId, DEFAULT_SOURCES, DEFAULT_CATEGORIES, DEFAULT_LEVELS, DEFAULT_PROJECTS, SYSTEM_ANNOUNCEMENT } from './config/constants';
import { checkDateMatch, getCurrentWeekStr, getSafeDateStr, getContactThreshold } from './utils/helpers';

// Components
import LoginScreen from './components/LoginScreen';
import CustomerForm from './components/CustomerForm';
import CustomerDetail from './components/CustomerDetail';
import ClientsView from './components/ClientsView';
import DashboardView from './components/DashboardView';
import VendorsView from './components/VendorsView';
import Marquee from './components/Marquee';
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
  const [showNotifications, setShowNotifications] = useState(false); 
  const [hasShownNotifications, setHasShownNotifications] = useState(false);

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

  // Auth & Data
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

  // ★★★ 通知計算邏輯 ★★★
  useEffect(() => {
      if (!customers || customers.length === 0 || !currentUser) return;
      const today = new Date();
      const tempNotifications = [];
      
      customers.forEach(c => {
          if (c.owner === currentUser.username) {
              // 1. 取得最後回報日期 (優先使用筆記日期，其次建檔日)
              let lastDateStr = null;
              if (Array.isArray(c.notes) && c.notes.length > 0) {
                   const lastNote = [...c.notes].sort((a,b) => (b.date||'').localeCompare(a.date||''))[0];
                   lastDateStr = lastNote.date;
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
              // 2. 委託到期
              if (['賣方', '出租', '出租方'].includes(c.category) && c.commissionEndDate && !c.isRenewed) {
                  const endDate = new Date(c.commissionEndDate);
                  const diffDays = Math.ceil((endDate - today) / (86400000));
                  if (diffDays >= 0 && diffDays <= 7) { tempNotifications.push({ id: c.id, name: c.name || c.caseName, category: c.category, type: 'commission', date: c.commissionEndDate, days: diffDays, level: c.level || 'C' }); }
              }
              // 3. 代書款項
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
  }, [customers, currentUser, hasShownNotifications, view]);

  // Handlers
  const handleAddNote = async (id, content) => { try { const today = new Date().toISOString().split('T')[0]; const newNote = { id: Date.now(), date: today, content, author: currentUser.name }; await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayUnion(newNote), lastContact: today }); if (selectedCustomer && selectedCustomer.id === id) { setSelectedCustomer(prev => ({ ...prev, lastContact: today, notes: [...(prev.notes || []), newNote] })); } } catch(e) { console.error(e); } };
  const handleDeleteNote = async (id, note) => { try { await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', id), { notes: arrayRemove(note) }); if (selectedCustomer && selectedCustomer.id === id) { setSelectedCustomer(prev => ({ ...prev, notes: (prev.notes || []).filter(n => n.id !== note.id) })); } } catch(e) { console.error(e); } };
  const handleEditNote = async (customerId, noteObj, newContent) => { if (!currentUser) return; try { const custRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId); const docSnap = await getDoc(custRef); if (docSnap.exists()) { const data = docSnap.data(); const currentNotes = data.notes || []; const updatedNotes = currentNotes.map(n => (n.id === noteObj.id) ? { ...n, content: newContent } : n); await updateDoc(custRef, { notes: updatedNotes }); if (selectedCustomer && selectedCustomer.id === customerId) { setSelectedCustomer(prev => ({ ...prev, notes: updatedNotes })); } } } catch(e) { console.error(e); alert("編輯失敗"); } };
  const handleLogin = async (username, password) => { setLoading(true); try { const usersRef = collection(db, 'artifacts', appId, 'public', 'data', 'app_users'); const q = query(usersRef, where("username", "==", username), where("password", "==", password)); const querySnapshot = await getDocs(q); if (!querySnapshot.empty) { const userDoc = querySnapshot.docs[0]; const userData = { id: userDoc.id, ...userDoc.data() }; if (userData.status === 'suspended') { alert("此帳號已被停權"); setLoading(false); return; } setCurrentUser(userData); localStorage.setItem('crm-user-profile', JSON.stringify(userData)); setView('list'); } else { alert("帳號或密碼錯誤"); } } catch (error) { console.error("Login Error", error); alert("登入發生錯誤"); } setLoading(false); };
  const handleRegister = () => alert("請聯繫管理員建立帳號");
  const handleLogout = () => { setCurrentUser(null); localStorage.removeItem('crm-user-profile'); setView('login'); setActiveTab('clients'); setSearchTerm(''); setLoading(false); setHasShownNotifications(false); };
  const handleAddCustomer = async (formData) => { if (!currentUser) return; setLoading(true); try { const cleanData = { ...formData, companyCode: currentUser.companyCode, owner: currentUser.username, ownerName: currentUser.name, createdAt: formData.createdAt ? (formData.createdAt.includes('T') ? formData.createdAt : new Date(formData.createdAt).toISOString()) : new Date().toISOString(), lastContact: new Date().toISOString().split('T')[0], notes: [] }; Object.keys(cleanData).forEach(key => { if (cleanData[key] === undefined) delete cleanData[key]; }); await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'customers'), cleanData); setView('list'); } catch (error) { alert("新增失敗: " + error.message); } finally { setLoading(false); } };
  const handleEditCustomer = async (formData) => { if (selectedCustomer.owner !== currentUser.username && !isAdmin) return alert("無權限"); try { const { id, ...rest } = formData; const updateData = { ...rest }; if (updateData.createdAt) { const d = new Date(updateData.createdAt); if (!isNaN(d.getTime())) { updateData.createdAt = d; } else { delete updateData.createdAt; } } Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]); await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', selectedCustomer.id), updateData); setSelectedCustomer({ ...selectedCustomer, ...updateData }); setView('detail'); } catch (e) { alert("儲存失敗"); } };
  
  // ... Other Handlers ...
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
  const handleAddOption = (type, val) => { if (Array.isArray(val) && (type === 'scriveners' || type === 'adWalls')) { setAppSettings({...appSettings, [type]: val}); if (type === 'adWalls') setAdWalls(val); return; } if(!val || (appSettings[type] && appSettings[type].includes(val))) return; const u = [...(appSettings[type] || []), val]; setAppSettings({...appSettings, [type]: u}); };
  const handleDeleteOption = (type, opt) => { const u = (appSettings[type] || []).filter(i => i !== opt); setAppSettings({...appSettings, [type]: u}); };
  const handleReorderOption = (type, f, t) => { const l = [...(appSettings[type] || [])]; const [r] = l.splice(f, 1); l.splice(t, 0, r); setAppSettings({...appSettings, [type]: l}); };
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
  
  // Dashboard & Stats Logic
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
      {showNotifications && <NotificationModal notifications={notifications} onClose={() => setShowNotifications(false)} onQuickUpdate={handleQuickUpdate} onView={handleViewFromNotification} />}
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
            appSettings={appSettings}
            /> : 
        activeTab === 'vendors' ? <VendorsView 
            customers={customers} 
            currentUser={currentUser} 
            isAdmin={isAdmin} 
            onAddNote={handleAddNote} 
            onDeleteNote={handleDeleteNote} 
            /> : 
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
            onSaveAd={handleSaveAd} 
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

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} isAdmin={isAdmin} systemAlerts={systemAlerts} />
      {showProfileModal && <ProfileModal currentUser={currentUser} onClose={() => setShowProfileModal(false)} onSave={handleProfileSave} />}
    </div>
  );
}