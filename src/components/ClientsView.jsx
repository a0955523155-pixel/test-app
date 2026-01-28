import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Upload, FileSpreadsheet, 
  ChevronDown, ChevronRight, Users, MapPin, Building,
  Megaphone, X, UserCircle, CheckSquare, CheckCircle, ArrowUpDown, LogOut, Sun, Moon, Trash2
} from 'lucide-react';
import * as XLSX from 'xlsx'; 

import { STATUS_CONFIG } from '../config/constants';

const StatusBadge = ({ status, category }) => {
    const isCase = ['賣方', '出租', '出租方'].includes(category);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const labelMap = { 'new': isCase?'新案件':'新客戶', 'contacting': isCase?'洽談中':'接洽中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{labelMap[status] || config.label}</span>;
};

// 輔助函式：安全取得日期字串
const getSafeDateString = (dateVal) => {
    if (!dateVal) return '-';
    if (typeof dateVal === 'string') return dateVal.split('T')[0];
    if (dateVal?.toDate) return dateVal.toDate().toISOString().split('T')[0];
    if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
    return String(dateVal);
};

const ClientsView = ({ 
    customers, currentUser, darkMode, toggleDarkMode, handleLogout, listMode, setListMode, listYear, setListYear, listMonth, setListMonth, listWeekDate, setListWeekDate, searchTerm, setSearchTerm, loading, isAdmin, setView, setSelectedCustomer, onCustomerClick, onImport, onBatchDelete, onBroadcast, companyProjects, onUpdateProjects, onOpenProfile 
}) => {
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterCategory, setFilterCategory] = useState(() => localStorage.getItem('crm_filter_category') || 'all'); 
    const [sortMode, setSortMode] = useState(() => localStorage.getItem('crm_sort_mode') || 'agent'); 
    const [expandedGroups, setExpandedGroups] = useState({});
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBroadcastMode, setIsBroadcastMode] = useState(false); 
    const fileInputRef = useRef(null); 

    const handleCategoryChange = (e) => { setFilterCategory(e.target.value); localStorage.setItem('crm_filter_category', e.target.value); };
    const handleSortChange = (e) => { setSortMode(e.target.value); localStorage.setItem('crm_sort_mode', e.target.value); };
    const toggleGroup = (groupName) => setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));

    const handleDownloadTemplate = () => {
        const template = [{ "姓名": "王小明", "電話": "0912345678", "分類": "買方", "狀態": "new", "等級": "A", "來源": "FB", "區域": "鳳山區", "有興趣的案場": "美術一號院, 遠雄THE ONE", "預算": "1500", "備註": "急尋三房", "建檔日期": "2023-10-01", "次要服務專員": "" }];
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
                    if (rowStr.includes("姓名") || rowStr.includes("電話") || rowStr.includes("手機")) {
                        headerRowIndex = i; break;
                    }
                }
                if (headerRowIndex === -1) { alert("⚠️ 無法識別標題列！\n請確認 Excel 中包含「姓名」或「電話」欄位。"); return; }

                const jsonData = XLSX.utils.sheet_to_json(ws, { range: headerRowIndex, defval: "" });
                const columnMap = {
                    "姓名": "name", "客戶姓名": "name", "Name": "name", "name": "name", "客戶": "name",
                    "電話": "phone", "手機": "phone", "聯絡電話": "phone", "Phone": "phone", "phone": "phone",
                    "分類": "category", "類別": "category", "狀態": "status", "等級": "level", "來源": "source",
                    "區域": "reqRegion", "需求區域": "reqRegion", "地點": "reqRegion",
                    "有興趣的案場": "project", "案場": "project", "建案": "project",
                    "預算": "value", "總價": "totalPrice", "開價": "totalPrice",
                    "備註": "remarks", "建檔日期": "createdAt", "日期": "createdAt",
                    "次要服務專員": "subAgent", "服務專員": "subAgent"
                };

                const excelDateToJSDate = (serial) => {
                   if (typeof serial === 'string') {
                       // 支援民國年
                       const rocMatch = serial.trim().match(/^(\d{2,3})[./-](\d{1,2})[./-](\d{1,2})$/);
                       if (rocMatch) {
                           const year = parseInt(rocMatch[1]) + 1911;
                           const month = rocMatch[2].padStart(2, '0');
                           const day = rocMatch[3].padStart(2, '0');
                           return `${year}-${month}-${day}`;
                       }
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
                            if (mappedKey === 'status' && val) {
                                const statusMap = { '新進': 'new', '洽談': 'contacting', '接洽中': 'contacting', '委託': 'commissioned', '下斡': 'offer', '成交': 'closed', '無效': 'lost' };
                                if (statusMap[val]) val = statusMap[val];
                            }
                            if (mappedKey === 'project') {
                                if (typeof val === 'string' && (val.includes(',') || val.includes('、'))) {
                                    val = val.split(/[,、]/).map(s => s.trim()).filter(s => s);
                                } else if (val) {
                                    val = [String(val).trim()];
                                } else {
                                    val = [];
                                }
                            }
                            newRow[mappedKey] = val;
                        } else {
                            newRow[rawKey] = row[key];
                        }
                    });

                    if (!newRow.name) newRow.name = "未命名匯入";
                    if (!newRow.phone) newRow.phone = "無電話";
                    if (!newRow.status) newRow.status = 'new';
                    if (!newRow.category) newRow.category = '買方';
                    if (!newRow.source) newRow.source = '其他';
                    if (!newRow.project) newRow.project = []; 
                    if (!newRow.createdAt) newRow.createdAt = new Date().toISOString().split('T')[0];

                    return newRow;
                });

                const validCount = formattedData.filter(d => d.name && d.phone).length;
                if (confirm(`讀取到 ${formattedData.length} 筆資料 (有效 ${validCount} 筆)，確定匯入嗎？`)) {
                    onImport(formattedData);
                }
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

    // ★★★ 核心篩選邏輯 (含回報紀錄檢查) ★★★
    const filteredCustomers = useMemo(() => {
        let data = customers.filter(c => {
            const isCase = ['賣方', '出租', '出租方'].includes(c.category);
            const isMyData = c.owner === currentUser?.username;
            if (!isAdmin && !isCase && !isMyData) return false; 
            
            const matchSearch = (c.name?.includes(searchTerm) || c.phone?.includes(searchTerm) || c.caseName?.includes(searchTerm));
            
            let matchCat = true;
            if (filterCategory === 'buyer') matchCat = c.category === '買方' || c.category === '租客';
            else if (filterCategory === 'seller') matchCat = ['賣方', '出租', '出租方'].includes(c.category);

            let matchTime = true;
            
            // 安全取得日期物件
            const safeDate = (d) => {
                if(!d) return null;
                const ds = getSafeDateString(d);
                const obj = new Date(ds);
                return isNaN(obj.getTime()) ? null : obj;
            };

            const createdDate = safeDate(c.createdAt);
            const contactDate = safeDate(c.lastContact);

            if (listMode === 'month') {
                const targetYear = listYear;
                const targetMonth = listMonth;
                const matchCreated = createdDate && createdDate.getFullYear() === targetYear && (createdDate.getMonth() + 1) === targetMonth;
                const matchContact = contactDate && contactDate.getFullYear() === targetYear && (contactDate.getMonth() + 1) === targetMonth;
                
                // 檢查 Note 是否在本月
                let matchNote = false;
                if (Array.isArray(c.notes)) {
                     matchNote = c.notes.some(n => {
                         const nd = safeDate(n.date);
                         return nd && nd.getFullYear() === targetYear && (nd.getMonth() + 1) === targetMonth;
                     });
                }
                matchTime = matchCreated || matchContact || matchNote;

            } else if (listMode === 'week') {
                // 計算本週範圍
                const targetDate = new Date(listWeekDate); // 選擇的週
                const day = targetDate.getDay(); 
                const diff = targetDate.getDate() - day + (day === 0 ? -6 : 1); // 調整至週一
                
                const startOfWeek = new Date(targetDate.setDate(diff));
                startOfWeek.setHours(0,0,0,0);
                
                const endOfWeek = new Date(startOfWeek);
                endOfWeek.setDate(startOfWeek.getDate() + 6);
                endOfWeek.setHours(23,59,59,999);

                const inRange = (d) => d && d >= startOfWeek && d <= endOfWeek;

                const matchCreated = inRange(createdDate);
                const matchContact = inRange(contactDate);
                
                // ★ 關鍵：檢查每條回報紀錄 (Notes) 的日期 ★
                let matchNote = false;
                if (Array.isArray(c.notes)) {
                    matchNote = c.notes.some(n => inRange(safeDate(n.date)));
                }

                matchTime = matchCreated || matchContact || matchNote;
            }
            return matchSearch && matchCat && matchTime;
        });

        data.sort((a, b) => {
            if (sortMode === 'date') return (b.lastContact || '').localeCompare(a.lastContact || '');
            const keyA = getGroupKey(a);
            const keyB = getGroupKey(b);
            if (keyA !== keyB) return keyA.localeCompare(keyB, 'zh-Hant');
            return (b.lastContact || '').localeCompare(a.lastContact || '');
        });
        return data;
    }, [customers, searchTerm, filterCategory, listMode, listYear, listMonth, listWeekDate, sortMode, isAdmin, currentUser]);

    const handleSelectOne = (id) => { if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(pid => pid !== id)); else setSelectedIds(prev => [...prev, id]); };
    
    // ★ 分組全選：只選取「目前篩選後」的資料
    const toggleSelect = () => { 
        if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) setSelectedIds([]); 
        else setSelectedIds(filteredCustomers.map(c => c.id)); 
    };

    const handleCardClick = (customer) => { if (isBroadcastMode) onBroadcast(customer.id, true); else if (isSelectionMode) handleSelectOne(customer.id); else onCustomerClick(customer); };
    const getGroupCount = (groupKey) => filteredCustomers.filter(c => getGroupKey(c) === groupKey).length;
    const getGroupIcon = () => { if (sortMode === 'region') return <MapPin className="w-4 h-4 text-green-500"/>; if (sortMode === 'project') return <Building className="w-4 h-4 text-purple-500"/>; return <Users className="w-4 h-4 text-blue-500"/>; };

    return (
        <div className="pb-20">
            <div className={`sticky top-0 z-10 px-4 pt-10 pb-2 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>客戶列表</h1>
                    <div className="flex gap-2">
                        <button onClick={onOpenProfile} className={`p-2 rounded-full ${darkMode ? 'hover:bg-slate-800 text-blue-400' : 'hover:bg-gray-200 text-blue-600'}`} title="個人資料設定">
                            <UserCircle className="w-5 h-5"/>
                        </button>
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
                    {isBroadcastMode && <div className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center"><Megaphone className="w-4 h-4 mr-2 animate-pulse"/>廣播模式：點擊任一客戶/案件即可立即發送廣播</div>}
                    {!isBroadcastMode && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            <div className={`flex items-center px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><ArrowUpDown className="w-3 h-3 text-gray-500 mr-1"/><select value={sortMode} onChange={handleSortChange} className={`bg-transparent border-none text-xs font-bold outline-none ${darkMode?'text-white':'text-gray-700'}`}><option value="agent">分組: 業務</option><option value="region">分組: 區域</option><option value="project">分組: 案場</option><option value="date">不分組</option></select></div>
                            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>
                            <select value={filterCategory} onChange={handleCategoryChange} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><option value="all">全部分類</option><option value="buyer">買方/租客</option><option value="seller">賣方/屋主</option></select>
                            <select value={listMode} onChange={(e) => setListMode(e.target.value)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}><option value="all">全部時間</option><option value="month">本月</option><option value="week">本週</option></select>
                            {listMode === 'month' && <><select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select><select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select></>}
                            {listMode === 'week' && <input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`} />}
                            <div className="flex-1"></div>
                            {isAdmin && <button onClick={handleDownloadTemplate} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg"><FileSpreadsheet className="w-4 h-4"/></button>}
                            <label className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer flex items-center"><Upload className="w-4 h-4"/><input type="file" ref={fileInputRef} accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" /></label>
                        </div>
                    )}
                </div>
                {isSelectionMode && selectedIds.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2"><span className="text-xs font-bold text-blue-600 ml-2">已選 {selectedIds.length} 筆</span><div className="flex gap-2">{selectedIds.length === 1 && <button onClick={() => onBroadcast(selectedIds[0], true)} className="px-3 py-1 bg-purple-600 text-white text-xs rounded font-bold">廣播</button>}<button onClick={() => { onBatchDelete(selectedIds); setSelectedIds([]); }} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-bold"><Trash2 className="w-3 h-3 inline mr-1"/>刪除</button></div></div>
                )}
            </div>

            <div className="p-4 space-y-3">
                {filteredCustomers.length === 0 ? <div className="text-center py-20 text-gray-400"><div className="bg-gray-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"><Search className="w-8 h-8 opacity-50"/></div><p>找不到符合條件的資料</p></div> : filteredCustomers.map((customer, index) => {
                    const isRental = customer.category.includes('出租');
                    const currentGroupKey = getGroupKey(customer);
                    const showGroupHeader = sortMode !== 'date' && currentGroupKey !== (index > 0 ? getGroupKey(filteredCustomers[index - 1]) : null);
                    const isGroupExpanded = expandedGroups[currentGroupKey] || searchTerm !== '';

                    return (
                        <React.Fragment key={customer.id}>
                            {showGroupHeader && <div className="flex items-center gap-2 mt-4 mb-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded p-1" onClick={() => toggleGroup(currentGroupKey)}>{isGroupExpanded ? <ChevronDown className="w-4 h-4 text-gray-500"/> : <ChevronRight className="w-4 h-4 text-gray-500"/>}{getGroupIcon()} <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">{currentGroupKey} ({getGroupCount(currentGroupKey)})</h3><div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div></div>}
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
                                                <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800"><span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{customer.ownerName}</span><span className="text-[10px] opacity-70">{getSafeDateString(customer.createdAt)}</span></div>
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