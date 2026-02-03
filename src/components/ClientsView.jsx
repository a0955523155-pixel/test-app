import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
    Search, Plus, Upload, FileSpreadsheet, 
    ChevronDown, ChevronRight, Users, MapPin, Building,
    Megaphone, X, UserCircle, CheckSquare, CheckCircle, ArrowUpDown, LogOut, Sun, Moon, Trash2,
    Edit, RefreshCw, Calendar
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { getFirestore, writeBatch, doc, updateDoc } from 'firebase/firestore'; 
import { appId, STATUS_CONFIG, DEFAULT_SOURCES } from '../config/constants';

// --- 狀態標籤組件 ---
const StatusBadge = ({ status, category }) => {
    const cat = category || '';
    const isCase = cat.includes('賣') || cat.includes('出租') || cat.includes('屋主');
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const labelMap = { 'new': isCase?'新案件':'新客戶', 'contacting': isCase?'洽談中':'接洽中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{labelMap[status] || config.label}</span>;
};

const getSafeDateString = (dateVal) => {
    if (!dateVal) return '';
    try {
        if (typeof dateVal === 'string') return dateVal.split('T')[0];
        if (dateVal?.toDate) return dateVal.toDate().toISOString().split('T')[0];
        if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    } catch(e) {}
    return '';
};

// ★★★ 核心修正：嚴格日期邏輯 (只看客戶回報) ★★★
// 這裡會過濾掉 type='vendor' 的記事，只計算客戶回報的最新時間
const getStrictDate = (customer) => {
    // 1. 取得所有記事
    const allNotes = customer.notes || [];
    
    // 2. 過濾：只保留非廠商 (type !== 'vendor') 的記事
    const clientNotes = allNotes.filter(n => n.type !== 'vendor');

    // 3. 如果有客戶記事，取最新的一筆
    if (clientNotes.length > 0) {
        // 排序 (日期大到小)
        const sortedNotes = [...clientNotes].sort((a,b) => (b.date || '').localeCompare(a.date || ''));
        const lastNote = sortedNotes[0];
        if (lastNote && lastNote.date) {
            return { date: lastNote.date, type: 'update', content: lastNote.content };
        }
    }
    
    // 4. 完全沒有客戶記事，回傳建檔日期
    return { date: getSafeDateString(customer.createdAt), type: 'create', content: '' };
};

const ClientsView = ({ 
    customers, currentUser, darkMode, toggleDarkMode, handleLogout, listMode, setListMode, listYear, setListYear, listMonth, setListMonth, listWeekDate, setListWeekDate, searchTerm, setSearchTerm, loading, isAdmin, setView, setSelectedCustomer, onCustomerClick, onImport, onBatchDelete, onBroadcast, companyProjects, onUpdateProjects, onOpenProfile,
    appSettings 
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('crm_filter_category') || 'all'); 
    const [sortMode, setSortMode] = useState(() => localStorage.getItem('crm_sort_mode') || 'date'); 
    
    const [customDates, setCustomDates] = useState([]);
    const [tempDateInput, setTempDateInput] = useState('');

    const [batchAction, setBatchAction] = useState(null); 
    const [batchFillData, setBatchFillData] = useState({ field: 'status', value: '' });
    const [batchReplaceData, setBatchReplaceData] = useState({ field: 'remarks', findText: '', replaceText: '' });
    const [isProcessingBatch, setIsProcessingBatch] = useState(false);

    const sourceOptions = appSettings?.sources && appSettings.sources.length > 0 ? appSettings.sources : DEFAULT_SOURCES;

    const [expandedGroups, setExpandedGroups] = useState(() => {
        try {
            const saved = sessionStorage.getItem('crm_expanded_groups');
            return saved ? JSON.parse(saved) : {};
        } catch (e) { return {}; }
    });

    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBroadcastMode, setIsBroadcastMode] = useState(false); 
    const fileInputRef = useRef(null); 

    useEffect(() => {
        const timer = setTimeout(() => {
            const savedScroll = sessionStorage.getItem('crm_scroll_position');
            if (savedScroll) {
                window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'instant' });
            }
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    const handleCategoryChange = (e) => { setFilterCategory(e.target.value); localStorage.setItem('crm_filter_category', e.target.value); };
    const handleSortChange = (e) => { setSortMode(e.target.value); localStorage.setItem('crm_sort_mode', e.target.value); };
    
    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => {
            const isCurrentlyOpen = prev[groupName] !== undefined ? prev[groupName] : (searchTerm !== '');
            const newState = { ...prev, [groupName]: !isCurrentlyOpen };
            sessionStorage.setItem('crm_expanded_groups', JSON.stringify(newState));
            return newState;
        });
    };

    const handleQuickSourceChange = async (customerId, newSource) => {
        try {
            const db = getFirestore();
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'customers', customerId), { source: newSource });
        } catch (error) { console.error("更新來源失敗", error); }
    };

    const addCustomDate = () => { if (tempDateInput && !customDates.includes(tempDateInput)) { setCustomDates([...customDates, tempDateInput].sort()); setTempDateInput(''); } };
    const removeCustomDate = (dateToRemove) => { setCustomDates(customDates.filter(d => d !== dateToRemove)); };

    const executeBatchOperation = async () => {
        if (!selectedIds.length) return;
        if (!confirm(`確定要對選取的 ${selectedIds.length} 筆資料執行此操作嗎？`)) return;
        setIsProcessingBatch(true);
        const db = getFirestore();
        const batch = writeBatch(db);
        let updateCount = 0;
        try {
            selectedIds.forEach(id => {
                const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'customers', id);
                const customer = customers.find(c => c.id === id);
                if (!customer) return;
                if (batchAction === 'fill') {
                    if (batchFillData.value !== '') { batch.update(docRef, { [batchFillData.field]: batchFillData.value }); updateCount++; }
                } else if (batchAction === 'replace') {
                    const currentValue = customer[batchReplaceData.field] || '';
                    if (typeof currentValue === 'string' && currentValue.includes(batchReplaceData.findText)) {
                        const newValue = currentValue.replaceAll(batchReplaceData.findText, batchReplaceData.replaceText);
                        batch.update(docRef, { [batchReplaceData.field]: newValue });
                        updateCount++;
                    }
                }
            });
            if (updateCount > 0) { await batch.commit(); alert(`成功更新 ${updateCount} 筆資料！`); setBatchAction(null); setSelectedIds([]); setIsSelectionMode(false); } else { alert("沒有資料需要更新"); }
        } catch (error) { console.error("Batch Error:", error); alert("批量更新失敗"); } finally { setIsProcessingBatch(false); }
    };

    const handleDownloadTemplate = () => {
        const template = [{ "姓名": "王小明", "電話": "0912345678", "分類": "買方", "狀態": "new", "等級": "A", "來源": "FB", "區域": "鳳山區", "有興趣的案場": "美術一號院", "預算": "1500", "備註": "急尋三房", "建檔日期": "2023-10-01", "次要服務專員": "" }];
        const ws = XLSX.utils.json_to_sheet(template);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "匯入範本");
        XLSX.writeFile(wb, "客戶匯入範本.xlsx");
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 });
                let headerRowIndex = -1;
                for (let i = 0; i < rawData.length; i++) {
                    const rowStr = rawData[i].join("").replace(/\s/g, "");
                    if (rowStr.includes("姓名") || rowStr.includes("電話") || rowStr.includes("手機")) { headerRowIndex = i; break; }
                }
                if (headerRowIndex === -1) { alert("⚠️ 無法識別標題列！"); return; }
                const jsonData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });
                
                const columnMap = { "姓名": "name", "客戶姓名": "name", "Name": "name", "name": "name", "電話": "phone", "手機": "phone", "聯絡電話": "phone", "Phone": "phone", "phone": "phone", "分類": "category", "類別": "category", "狀態": "status", "等級": "level", "來源": "source", "區域": "reqRegion", "需求區域": "reqRegion", "地點": "reqRegion", "有興趣的案場": "project", "案場": "project", "建案": "project", "預算": "value", "總價": "totalPrice", "開價": "totalPrice", "備註": "remarks", "備註事項": "remarks", "建檔日期": "createdAt", "日期": "createdAt", "次要服務專員": "subAgent", "服務專員": "subAgent" };
                const excelDateToJSDate = (serial) => {
                   if (typeof serial === 'string') {
                       const rocMatch = serial.trim().match(/^(\d{2,3})[./-](\d{1,2})[./-](\d{1,2})$/);
                       if (rocMatch) { return `${parseInt(rocMatch[1]) + 1911}-${rocMatch[2].padStart(2, '0')}-${rocMatch[3].padStart(2, '0')}`; }
                       if (serial.includes('/') || serial.includes('-')) return serial.replace(/\//g, '-');
                       return serial;
                   }
                   if (!serial || isNaN(serial)) return new Date().toISOString().split('T')[0];
                   const utc_days  = Math.floor(serial - 25569);
                   const utc_value = utc_days * 86400;                                 
                   const date_info = new Date(utc_value * 1000);
                   return date_info.toISOString().split('T')[0]; 
                };
                const formattedData = jsonData.map(row => {
                    const newRow = {};
                    Object.keys(row).forEach(key => {
                        const rawKey = key.toString().replace(/\s+/g, '');
                        const mappedKey = columnMap[rawKey];
                        if (mappedKey) {
                            let val = row[key];
                            if (mappedKey === 'createdAt') val = excelDateToJSDate(val);
                            if (mappedKey === 'phone') val = String(val).trim();
                            if (mappedKey === 'status' && val) { const statusMap = { '新進': 'new', '洽談': 'contacting', '接洽中': 'contacting', '委託': 'commissioned', '下斡': 'offer', '成交': 'closed', '無效': 'lost' }; if (statusMap[val]) val = statusMap[val]; }
                            if (mappedKey === 'project') { if (typeof val === 'string' && (val.includes(',') || val.includes('、'))) { val = val.split(/[,、]/).map(s => s.trim()).filter(s => s); } else if (val) { val = [String(val).trim()]; } else { val = []; } }
                            newRow[mappedKey] = val;
                        } else { newRow[rawKey] = row[key]; }
                    });
                    if (!newRow.name) newRow.name = "未命名匯入"; if (!newRow.phone) newRow.phone = "無電話"; if (!newRow.status) newRow.status = 'new'; if (!newRow.category) newRow.category = '買方'; if (!newRow.source) newRow.source = '其他'; if (!newRow.project) newRow.project = []; if (!newRow.createdAt) newRow.createdAt = new Date().toISOString().split('T')[0];
                    return newRow;
                });
                if (confirm(`讀取到 ${formattedData.length} 筆資料，確定匯入嗎？`)) { onImport(formattedData); }
                e.target.value = ''; 
            } catch (error) { console.error(error); alert("檔案解析失敗"); }
        };
        reader.readAsBinaryString(file);
    };

    const getGroupKey = (c) => {
        if (sortMode === 'agent') return c.ownerName || '未知業務';
        if (sortMode === 'region') return c.reqRegion?.split(',')[0].trim() || '未分類區域';
        if (sortMode === 'project') return Array.isArray(c.project) ? (c.project[0] || '未分類案場') : (c.project || '未分類案場');
        return '全部';
    };

    const filteredCustomers = useMemo(() => {
        let data = customers.filter(c => {
            const isMyData = c.owner === currentUser?.username;
            const catRaw = c.category || '';
            const isCase = catRaw.includes('賣') || catRaw.includes('出租') || catRaw.includes('屋主');
            
            if (!isAdmin && !isCase && !isMyData) return false; 
            
            const matchSearch = (c.name?.includes(searchTerm) || c.phone?.includes(searchTerm) || c.caseName?.includes(searchTerm));
            
            let matchCat = true;
            if (filterCategory === 'buyer') {
                matchCat = (catRaw.includes('買') || catRaw.includes('承租') || catRaw.includes('租客') || catRaw.includes('租方')) && !catRaw.includes('出租');
            } else if (filterCategory === 'seller') {
                matchCat = catRaw.includes('賣') || catRaw.includes('出租') || catRaw.includes('屋主');
            } else if (filterCategory === 'no_remarks') {
                matchCat = !c.remarks || c.remarks.trim() === '';
            }

            let matchTime = true;
            // ★★★ 核心修正：使用嚴格日期 (只看客戶回報) ★★★
            const { date: effectiveDateStr } = getStrictDate(c);
            const effectiveDate = effectiveDateStr ? new Date(effectiveDateStr) : null;

            if (listMode === 'month') {
                if (!effectiveDate) matchTime = false;
                else matchTime = effectiveDate.getFullYear() === listYear && (effectiveDate.getMonth() + 1) === listMonth;
            } else if (listMode === 'week') {
                const targetDate = new Date(listWeekDate); 
                const day = targetDate.getDay(); 
                const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); 
                const startOfWeek = new Date(targetDate.setDate(diff)); 
                startOfWeek.setHours(0,0,0,0);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);

                if (!effectiveDate) matchTime = false;
                else matchTime = effectiveDate >= startOfWeek && effectiveDate <= endOfWeek;
            } else if (listMode === 'custom') {
                matchTime = customDates.includes(effectiveDateStr);
            }
            return matchSearch && matchCat && matchTime;
        });

        data.sort((a, b) => {
            // ★★★ 核心修正：排序也用嚴格日期 ★★★
            const { date: dateStrA } = getStrictDate(a);
            const { date: dateStrB } = getStrictDate(b);

            if (sortMode !== 'date') {
                const keyA = getGroupKey(a);
                const keyB = getGroupKey(b);
                if (keyA !== keyB) return keyA.localeCompare(keyB, 'zh-Hant');
            }
            return String(dateStrB).localeCompare(String(dateStrA));
        });
        return data;
    }, [customers, searchTerm, filterCategory, listMode, listYear, listMonth, listWeekDate, customDates, sortMode, isAdmin, currentUser]);

    const handleSelectOne = (id) => { if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(pid => pid !== id)); else setSelectedIds(prev => [...prev, id]); };
    const toggleSelect = () => { if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) setSelectedIds([]); else setSelectedIds(filteredCustomers.map(c => c.id)); };
    const handleGroupSelect = (e, groupKey) => {
        e.stopPropagation(); 
        const idsInGroup = filteredCustomers.filter(c => getGroupKey(c) === groupKey).map(c => c.id);
        const isGroupAllSelected = idsInGroup.length > 0 && idsInGroup.every(id => selectedIds.includes(id));
        if (isGroupAllSelected) { setSelectedIds(prev => prev.filter(id => !idsInGroup.includes(id))); } else { setSelectedIds(prev => [...new Set([...prev, ...idsInGroup])]); }
    };
    const handleCardClick = (customer) => { 
        if (isBroadcastMode) { onBroadcast(customer.id, true); } 
        else if (isSelectionMode) { handleSelectOne(customer.id); } 
        else { sessionStorage.setItem('crm_scroll_position', window.scrollY); onCustomerClick(customer); }
    };

    const getGroupCount = (groupKey) => filteredCustomers.filter(c => getGroupKey(c) === groupKey).length;
    const getGroupIcon = () => { if (sortMode === 'region') return <MapPin className="w-4 h-4 text-green-500"/>; if (sortMode === 'project') return <Building className="w-4 h-4 text-purple-500"/>; return <Users className="w-4 h-4 text-blue-500"/>; };

    return (
        <div className="pb-20">
            {batchAction && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-2xl border dark:border-slate-700">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 dark:text-white">
                            {batchAction === 'fill' ? <Edit className="w-5 h-5 text-blue-500"/> : <RefreshCw className="w-5 h-5 text-orange-500"/>}
                            {batchAction === 'fill' ? '批量快速填入' : '搜尋取代'}
                        </h3>
                        {batchAction === 'fill' ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">選擇欄位</label>
                                    <select value={batchFillData.field} onChange={(e) => setBatchFillData({...batchFillData, field: e.target.value})} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                        <option value="status">狀態 (Status)</option>
                                        <option value="level">等級 (Level)</option>
                                        <option value="source">來源 (Source)</option>
                                        <option value="ownerName">負責人 (需手動輸入)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">設定新值</label>
                                    <input value={batchFillData.value} onChange={(e) => setBatchFillData({...batchFillData, value: e.target.value})} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="輸入要填入的內容..." />
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">目標欄位</label>
                                    <select value={batchReplaceData.field} onChange={(e) => setBatchReplaceData({...batchReplaceData, field: e.target.value})} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                        <option value="remarks">備註 (Remarks)</option>
                                        <option value="reqRegion">需求區域/地址</option>
                                        <option value="name">姓名</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">尋找</label>
                                        <input value={batchReplaceData.findText} onChange={(e) => setBatchReplaceData({...batchReplaceData, findText: e.target.value})} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="舊內容" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">取代為</label>
                                        <input value={batchReplaceData.replaceText} onChange={(e) => setBatchReplaceData({...batchReplaceData, replaceText: e.target.value})} className="w-full p-2 rounded border dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="新內容" />
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex gap-2 mt-6">
                            <button onClick={() => setBatchAction(null)} className="flex-1 py-2 rounded-lg bg-gray-100 text-gray-600 font-bold hover:bg-gray-200">取消</button>
                            <button onClick={executeBatchOperation} disabled={isProcessingBatch} className="flex-1 py-2 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 disabled:opacity-50">
                                {isProcessingBatch ? '處理中...' : '執行更新'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`sticky top-0 z-10 px-4 pt-10 pb-2 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>客戶列表</h1>
                    <div className="flex gap-2">
                        <button onClick={onOpenProfile} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`} title="個人資料設定"><UserCircle className="w-5 h-5"/></button>
                        <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200'}`}>{darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                        <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 text-red-400"><LogOut className="w-5 h-5"/></button>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className={`flex-1 flex items-center px-3 py-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`}><Search className="w-5 h-5 text-gray-400 mr-2" /><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋..." className="bg-transparent border-none outline-none w-full text-sm"/></div>
                        {!isSelectionMode && <button onClick={() => { setIsBroadcastMode(!isBroadcastMode); setIsSelectionMode(false); }} className={`px-3 rounded-xl flex items-center gap-1 font-bold shadow-md ${isBroadcastMode ? 'bg-purple-600 text-white' : 'bg-white text-purple-600 border border-purple-200'}`}>{isBroadcastMode ? <X className="w-5 h-5"/> : <Megaphone className="w-5 h-5"/>} <span className="hidden sm:inline">{isBroadcastMode ? '退出' : '廣播'}</span></button>}
                        {!isSelectionMode && !isBroadcastMode && <button onClick={() => setView('add')} className="bg-blue-600 text-white px-3 rounded-xl font-bold shadow-lg"><Plus className="w-5 h-5" /></button>}
                        {!isBroadcastMode && <button onClick={() => { setIsSelectionMode(!isSelectionMode); if (isSelectionMode) setSelectedIds([]); }} className={`px-3 rounded-xl flex items-center gap-1 font-bold ${isSelectionMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-600'}`}><CheckSquare className="w-5 h-5" /></button>}
                    </div>
                    {isSelectionMode && selectedIds.length > 0 && (
                        <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2 border border-blue-100 dark:border-blue-900">
                            <span className="text-xs font-bold text-blue-600 ml-2">已選 {selectedIds.length} 筆</span>
                            <div className="flex gap-2">
                                <button onClick={() => setBatchAction('fill')} className="px-3 py-1 bg-white text-blue-600 border border-blue-200 text-xs rounded font-bold hover:bg-blue-50 flex items-center gap-1"><Edit className="w-3 h-3"/> 填入</button>
                                <button onClick={() => setBatchAction('replace')} className="px-3 py-1 bg-white text-orange-600 border border-orange-200 text-xs rounded font-bold hover:bg-orange-50 flex items-center gap-1"><RefreshCw className="w-3 h-3"/> 取代</button>
                                {selectedIds.length === 1 && <button onClick={() => onBroadcast(selectedIds[0], true)} className="px-3 py-1 bg-purple-600 text-white text-xs rounded font-bold">廣播</button>}
                                <button onClick={() => { onBatchDelete(selectedIds); setSelectedIds([]); }} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-bold"><Trash2 className="w-3 h-3 inline mr-1"/>刪除</button>
                            </div>
                        </div>
                    )}
                    {!isBroadcastMode && (
                        <div className="flex flex-col gap-2">
                            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                                <div className={`flex items-center px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><ArrowUpDown className="w-3 h-3 text-gray-500 mr-1"/><select value={sortMode} onChange={handleSortChange} className={`bg-transparent border-none text-xs font-bold outline-none ${darkMode?'text-white':'text-gray-700'}`}><option value="date">最新動態 (優先)</option><option value="agent">分組: 業務</option><option value="region">分組: 區域</option><option value="project">分組: 案場</option></select></div>
                                <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>
                                <select value={filterCategory} onChange={handleCategoryChange} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                    <option value="all">全部分類</option>
                                    <option value="buyer">買方/租客</option>
                                    <option value="seller">賣方/屋主</option>
                                    <option value="no_remarks">無備註資料</option>
                                </select>
                                <select value={listMode} onChange={(e) => setListMode(e.target.value)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><option value="all">全部時間</option><option value="month">本月</option><option value="week">本週</option><option value="custom">自訂多選</option></select>
                                {listMode === 'month' && <><select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select><select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select></>}
                                {listMode === 'week' && <input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`} />}
                                <div className="flex-1"></div>
                                {isAdmin && <button onClick={handleDownloadTemplate} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"><FileSpreadsheet className="w-4 h-4"/></button>}
                                <label className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer flex items-center"><Upload className="w-4 h-4"/><input type="file" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" /></label>
                            </div>
                            {listMode === 'custom' && (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg flex flex-wrap items-center gap-2 animate-in slide-in-from-top-1">
                                    <Calendar className="w-4 h-4 text-orange-600"/>
                                    <input type="date" value={tempDateInput} onChange={(e) => setTempDateInput(e.target.value)} className="p-1 rounded text-xs border border-orange-200" />
                                    <button onClick={addCustomDate} className="bg-orange-600 text-white px-2 py-1 rounded text-xs font-bold">加入</button>
                                    <div className="h-4 w-px bg-orange-300 mx-1"></div>
                                    <div className="flex gap-1 flex-wrap">
                                        {customDates.map(d => (<span key={d} className="bg-white border border-orange-200 text-orange-700 px-2 py-0.5 rounded text-xs flex items-center gap-1 font-mono">{d} <button onClick={() => removeCustomDate(d)} className="hover:text-red-500">×</button></span>))}
                                        {customDates.length === 0 && <span className="text-xs text-gray-400">尚未選擇日期...</span>}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-4 space-y-3">
                {filteredCustomers.length === 0 ? <div className="text-center py-20 text-gray-400"><div className="bg-gray-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 opacity-50"/></div><p>找不到符合條件的資料</p></div> : filteredCustomers.map((customer, index) => {
                    const isRental = customer.category.includes('出租');
                    const currentGroupKey = getGroupKey(customer);
                    const showGroupHeader = sortMode !== 'date' && currentGroupKey !== (index > 0 ? getGroupKey(filteredCustomers[index - 1]) : null);
                    
                    const isGroupExpanded = expandedGroups[currentGroupKey] !== undefined ? expandedGroups[currentGroupKey] : (searchTerm !== '');
                    const idsInGroup = filteredCustomers.filter(c => getGroupKey(c) === currentGroupKey).map(c => c.id);
                    const isGroupAllSelected = idsInGroup.length > 0 && idsInGroup.every(id => selectedIds.includes(id));
                    const isGroupPartialSelected = !isGroupAllSelected && idsInGroup.some(id => selectedIds.includes(id));
                    
                    // ★★★ 顯示邏輯：只顯示最後一筆回報日，或建檔日 ★★★
                    const { date: displayDate, type: dateType } = getStrictDate(customer);

                    return (
                        <React.Fragment key={customer.id}>
                            {showGroupHeader && (
                                <div className="flex items-center gap-2 mt-4 mb-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded p-1" onClick={() => toggleGroup(currentGroupKey)}>
                                    {isGroupExpanded ? <ChevronDown className="w-4 h-4 text-gray-500"/> : <ChevronRight className="w-4 h-4 text-gray-500"/>}
                                    {isSelectionMode && (<div onClick={(e) => handleGroupSelect(e, currentGroupKey)} className="mr-1">{isGroupAllSelected ? <CheckCircle className="w-5 h-5 text-blue-600 fill-blue-100"/> : (<div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isGroupPartialSelected ? 'border-blue-600' : 'border-gray-300'}`}>{isGroupPartialSelected && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full"></div>}</div>)}</div>)}
                                    {getGroupIcon()} <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">{currentGroupKey} ({getGroupCount(currentGroupKey)})</h3>
                                    <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                                </div>
                            )}
                            {(isGroupExpanded || sortMode === 'date') && (
                                <div onClick={() => handleCardClick(customer)} className={`relative bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer select-none animate-in fade-in slide-in-from-top-1 ${isBroadcastMode ? 'border-purple-400 ring-1 ring-purple-300 hover:bg-purple-50' : selectedIds.includes(customer.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 'border-gray-100 dark:border-slate-800 hover:shadow-md'}`}>
                                    {isSelectionMode && <div className="absolute top-4 right-4 pointer-events-none"><div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(customer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>{selectedIds.includes(customer.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}</div></div>}
                                    {isBroadcastMode && <div className="absolute top-4 right-4"><Megaphone className="w-5 h-5 text-purple-500"/></div>}
                                    <div className="flex items-start gap-4 pr-8">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${['賣方', '出租', '出租方'].includes(customer.category) ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{customer.name?.[0]}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1"><h3 className="font-bold text-lg truncate text-gray-900 dark:text-white">{customer.name}</h3><StatusBadge status={customer.status} category={customer.category} /></div>
                                            <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                {Array.isArray(customer.project) && customer.project.length > 0 ? (<div className="flex flex-wrap gap-1 mb-1">{customer.project.map((p, idx) => (<span key={idx} className="flex items-center gap-1 text-xs font-bold bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded dark:bg-purple-900/30 dark:text-purple-300"><Building className="w-3 h-3"/> {p}</span>))}</div>) : customer.project && <div className="flex items-center gap-1 font-bold text-purple-600 dark:text-purple-400 mb-1"><Building className="w-3 h-3"/> {customer.project}</div>}
                                                {['賣方', '出租', '出租方'].includes(customer.category) ? <div className="font-medium text-gray-700 dark:text-gray-300">{customer.caseName || '未命名案件'}</div> : <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {customer.reqRegion || '未指定區域'}</div>}
                                                <div className="text-xs font-mono text-blue-500 font-bold">{['賣方', '出租', '出租方'].includes(customer.category) ? `開價 ${customer.totalPrice || 0} ${isRental ? '元' : '萬'}` : `預算 ${customer.value || 0} ${isRental ? '元' : '萬'}`}</div>
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800">
                                                    <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{customer.ownerName}</span>
                                                    {/* ★★★ 清楚標示是回報日還是建檔日 ★★★ */}
                                                    <span className={`text-[10px] ${dateType === 'update' ? 'text-blue-600 font-bold' : 'opacity-70'}`}>
                                                        {dateType === 'update' ? '更新: ' : '建檔: '}{displayDate}
                                                    </span>
                                                </div>
                                                <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                                                    <select value={customer.source || ''} onChange={(e) => handleQuickSourceChange(customer.id, e.target.value)} className="text-[10px] p-1 border rounded bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300 w-full max-w-[120px]">
                                                        <option value="">選擇來源...</option>
                                                        {sourceOptions.map(opt => (<option key={opt} value={opt}>{opt}</option>))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
            {isSelectionMode && <button onClick={toggleSelect} className="fixed bottom-20 right-4 bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border dark:border-slate-700 z-30">{selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? <CheckCircle className="w-6 h-6 text-blue-600"/> : <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>}</button>}
        </div>
    );
};

export default ClientsView;