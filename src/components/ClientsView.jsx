import React, { useRef, useState, useMemo } from 'react';
import { 
  Building2, Sun, Moon, LogOut, Search, Users, Loader2, UserCircle, CalendarDays, Clock, ChevronRight,
  Upload, FileText, Plus, Trash2, CheckSquare, Square, X, ListChecks, Radio, Briefcase, AlertCircle, Filter, User
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { STATUS_CONFIG } from '../config/constants';
import { formatDateString, isDateInRange, getWeekRangeDisplay } from '../utils/helpers';

const StatusBadge = ({ status }) => {
    // 寬鬆對應表
    const labelMap = { 
        'new': '新案件/客戶', 'contacting': '洽談/接洽', 'commissioned': '已委託', 
        'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' 
    };
    
    // 如果 status 是中文，直接顯示中文；如果是代碼，轉成中文
    const displayLabel = labelMap[status] || status || '新案件/客戶';
    
    // 決定顏色 (若無對應則用灰色)
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const Icon = config.icon || Users; 
    
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}><Icon className="w-3 h-3 mr-1" />{displayLabel}</span>;
};

const ClientCard = ({ c, darkMode, onClick, displayDate, isSelected, onToggleSelect, isSelectionMode }) => {
    const showDate = displayDate || c.lastContact || formatDateString(c.createdAt);
    const isHistoricalView = displayDate && displayDate !== c.lastContact;
    const isSeller = ['賣方', '出租', '出租方'].includes(c.category);

    const today = new Date();
    let alertMsg = null;
    if (isSeller && c.commissionEndDate && !c.isRenewed) {
        const diff = Math.ceil((new Date(c.commissionEndDate) - today) / (86400000));
        if (diff >= 0 && diff <= 7) alertMsg = `委託剩 ${diff} 天`;
        else if (diff < 0) alertMsg = `委託已過期`;
    } else if (!isSeller && c.scribeDetails && Array.isArray(c.scribeDetails)) {
        const expiring = c.scribeDetails.find(item => {
            if (item.payDate && !item.isPaid) {
                const diff = Math.ceil((new Date(item.payDate) - today) / 86400000);
                return diff <= 7;
            }
            return false;
        });
        if (expiring) alertMsg = `有款項即將到期`;
    }

    return (
        <div onClick={() => onClick(c)} className={`group rounded-xl p-4 border cursor-pointer active:scale-[0.98] transition-all relative ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : (darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm')}`}>
            {isSelectionMode && (<div onClick={(e) => { e.stopPropagation(); onToggleSelect(c.id); }} className="absolute top-3 left-3 z-10 p-1 text-gray-400 hover:text-blue-500 cursor-pointer">{isSelected ? <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100" /> : <Square className="w-5 h-5" />}</div>)}
            <div className={`flex justify-between items-start mb-2 ${isSelectionMode ? 'pl-6' : ''}`}> 
                <div className="flex items-center min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0 ${isSeller ? 'bg-orange-100 text-orange-600' : (darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600')}`}>{isSeller ? <Briefcase className="w-5 h-5"/> : c.name?.[0]}</div>
                    <div className="min-w-0">
                        <h3 className={`font-bold text-base leading-none mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.name} <span className="text-xs font-normal text-gray-400 ml-1">({c.category || '未分類'})</span></h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 truncate">{isSeller ? (c.caseName || '未命名案件') : (c.project ? c.project : (c.company || '未填寫案場'))}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 rounded flex items-center gap-1 flex-shrink-0"><CalendarDays className="w-3 h-3"/> {formatDateString(c.createdAt)}</span>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 ml-2"><StatusBadge status={c.status} /></div>
            </div>
            
            {alertMsg && <div className="ml-12 mb-1 text-[10px] font-bold text-red-500 flex items-center gap-1 animate-pulse"><AlertCircle className="w-3 h-3"/> {alertMsg}</div>}
            
            {!isSeller && c.subAgent && (<div className={`mt-1 text-[10px] text-gray-400 ${isSelectionMode ? 'pl-12' : 'pl-12'}`}>次要: <span className="text-blue-500 font-bold">{c.subAgent}</span></div>)}
            <div className={`flex items-center justify-between mt-3 text-[11px] text-gray-400 font-medium pl-12`}>
                <span className="flex items-center gap-3">
                    <span className={`flex items-center ${isHistoricalView ? 'text-orange-500 font-bold' : ''}`} title={isHistoricalView ? "此為該區間的活動紀錄" : "最後動態時間"}><Clock className="w-3 h-3 mr-1" /> {showDate} {isHistoricalView && <span className="ml-1 text-[9px]">(歷史)</span>}</span>
                    <span className="text-blue-500 font-bold">
                        {isSeller ? (
                            (c.category && c.category.includes('出租')) 
                                ? `${c.totalPrice || 0}${Number(c.totalPrice) < 1000 ? '萬' : '元'}` 
                                : `開價: ${c.totalPrice || 0}萬`
                        ) : `預算: ${c.value?.toLocaleString() || 0}萬`}
                    </span>
                </span>
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
    );
};

const ClientsView = ({ 
    currentUser, darkMode, toggleDarkMode, handleLogout,
    listMode, setListMode, listYear, setListYear, listMonth, setListMonth, listWeekDate, setListWeekDate,
    searchTerm, setSearchTerm,
    loading, customers = [], isAdmin, setView, setSelectedCustomer,
    onImport, onBatchDelete, onBroadcast,
    companyProjects, onUpdateProjects 
}) => {
    const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i); 
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);
    const [isBroadcasting, setIsBroadcasting] = useState(false);
    const [isCaseFolderMode, setIsCaseFolderMode] = useState(false);

    // 篩選狀態
    const [filterRegion, setFilterRegion] = useState('');
    const [filterProject, setFilterProject] = useState('');
    const [filterUser, setFilterUser] = useState('');
    const [filterMinPrice, setFilterMinPrice] = useState('');
    const [filterMaxPrice, setFilterMaxPrice] = useState('');
    const [filterMinPing, setFilterMinPing] = useState('');
    const [filterMaxPing, setFilterMaxPing] = useState('');

    const availableAgents = useMemo(() => {
        const agents = new Set();
        customers.forEach(c => { if (c.ownerName) agents.add(c.ownerName); });
        return Array.from(agents).sort();
    }, [customers]);

    const visibleCustomers = useMemo(() => {
        if (!customers || !Array.isArray(customers)) return [];
        let base = [...customers];
        
        if (isCaseFolderMode) {
            base = base.filter(c => ['賣方', '出租', '出租方'].includes(c.category));
        } else if (!isAdmin) {
            base = base.filter(c => c.owner === currentUser?.username);
        }
        
        if (listMode !== 'all') {
            base = base.filter(c => {
                const activityDates = [];
                if (c.lastContact) activityDates.push(c.lastContact);
                if (c.notes && Array.isArray(c.notes)) c.notes.forEach(n => activityDates.push(n.date));
                if (c.createdAt) { try { const d = c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt); if (!isNaN(d.getTime())) activityDates.push(d.toISOString().split('T')[0]); } catch(e){} }
                return activityDates.some(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
            });
        }

        if (listMode === 'all') {
            if (filterRegion) {
                if (isCaseFolderMode) base = base.filter(c => c.assignedRegion === filterRegion);
                else {
                    const projectsInRegion = companyProjects?.[filterRegion] || [];
                    base = base.filter(c => projectsInRegion.includes(c.project) || c.reqRegion === filterRegion);
                }
            }
            if (filterProject) {
                if (isCaseFolderMode) base = base.filter(c => c.caseName?.includes(filterProject));
                else base = base.filter(c => c.project === filterProject);
            }
            if (isAdmin && filterUser) base = base.filter(c => c.ownerName === filterUser);

            if (isCaseFolderMode) {
                if (filterMinPrice) base = base.filter(c => parseFloat(c.totalPrice) >= parseFloat(filterMinPrice));
                if (filterMaxPrice) base = base.filter(c => parseFloat(c.totalPrice) <= parseFloat(filterMaxPrice));
                if (filterMinPing) base = base.filter(c => (parseFloat(c.landPing) || parseFloat(c.buildPing)) >= parseFloat(filterMinPing));
                if (filterMaxPing) base = base.filter(c => (parseFloat(c.landPing) || parseFloat(c.buildPing)) <= parseFloat(filterMaxPing));
            }
        }

        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            base = base.filter(c => (c.name?.toLowerCase().includes(term) || c.company?.toLowerCase().includes(term) || c.ownerName?.toLowerCase().includes(term) || c.project?.toLowerCase().includes(term)));
        }
        return base;
    }, [customers, isAdmin, currentUser, searchTerm, listMode, listYear, listMonth, listWeekDate, isCaseFolderMode, filterRegion, filterProject, filterUser, filterMinPrice, filterMaxPrice, filterMinPing, filterMaxPing, companyProjects]);

    const groupedCustomers = useMemo(() => { if (!isAdmin || isCaseFolderMode) return null; const groups = {}; visibleCustomers.forEach(c => { const owner = c.ownerName || c.owner || '未知業務'; if (!groups[owner]) groups[owner] = []; groups[owner].push(c); }); return groups; }, [visibleCustomers, isAdmin, isCaseFolderMode]);
    
    // 日期解析
    const parseExcelDate = (val) => {
        if (!val) return new Date().toISOString().split('T')[0]; 
        let strVal = String(val).trim();
        const numVal = Number(strVal);
        if (!isNaN(numVal) && numVal > 20000 && numVal < 60000) {
            let dateObj = new Date((numVal - 25569) * 86400 * 1000);
            return dateObj.toISOString().split('T')[0];
        } else {
            let cleanStr = strVal.replace(/\//g, '-').replace(/\./g, '-');
            const parts = cleanStr.split('-');
            if (parts.length === 3) {
                if (parts[0].length < 4 && parseInt(parts[0]) < 1911) {
                    parts[0] = String(parseInt(parts[0]) + 1911);
                }
                cleanStr = parts.join('-');
            }
            const timestamp = Date.parse(cleanStr);
            if (!isNaN(timestamp)) {
                let dateObj = new Date(timestamp);
                const y = dateObj.getFullYear();
                const m = String(dateObj.getMonth() + 1).padStart(2, '0');
                const d = String(dateObj.getDate()).padStart(2, '0');
                if (y > 1900 && y < 2100) return `${y}-${m}-${d}`;
            }
        }
        return new Date().toISOString().split('T')[0];
    };

    const processImportData = (jsonData) => {
        const parsedData = [];
        
        const headerMap = {
            "姓名": "name", "電話": "phone", "手機": "phone", 
            "分類": "category", "類別": "category",
            "狀態": "status", "目前狀態": "status", "Status": "status",
            "等級": "level", 
            "來源": "source", "客戶來源": "source", "Source": "source",
            
            "區域": "reqRegion", "地區": "reqRegion", "Region": "reqRegion", "案件區域": "assignedRegion", 
            "案件名稱": "caseName", "案名": "caseName", "有興趣的案場": "project", "需求案場": "project", "案場": "project",
            
            "總價": "totalPrice", "開價": "totalPrice", "預算": "value", "總價/預算": "genericPrice", 
            "土地坪數": "landPing", "地坪": "landPing", "建物坪數": "buildPing", "建坪": "buildPing",
            
            "樓層": "floor", "屋齡": "houseAge", "備註": "remarks", 
            "建檔日期": "createdAt", "日期": "createdAt",
            "次要專員": "subAgent", "次要服務專員": "subAgent"
        };

        const statusMap = { '新案件': 'new', '新客戶': 'new', '洽談中': 'contacting', '已委託': 'commissioned', '已收斡': 'offer', '已成交': 'closed', '已無效': 'lost' };

        jsonData.forEach(row => {
            const obj = {};
            
            Object.keys(row).forEach(key => {
                const cleanKey = key.trim();
                let mappedKey = headerMap[cleanKey] || cleanKey;
                let value = row[key];

                if (value !== undefined && value !== null) {
                    value = String(value).trim();
                } else {
                    value = '';
                }

                if (mappedKey === 'createdAt') {
                    obj.createdAt = parseExcelDate(value);
                } else if (mappedKey === 'status') {
                    // ★ 修正：如果狀態有對應代碼就轉，沒有就保留原文字 (如"成交") ★
                    obj.status = statusMap[value] || statusMap[value.replace(/\s/g, '')] || value; 
                } else {
                    obj[mappedKey] = value;
                }
            });

            // 預設與修正
            if (!obj.category) obj.category = '買方';
            // ★ 修正：若無來源，先留空，不強制寫 Excel匯入，除非真的沒資料
            if (!obj.source && obj.source !== '') obj.source = 'Excel匯入'; 
            if (!obj.level) obj.level = 'C';

            const isSeller = ['賣方', '出租', '出租方'].includes(obj.category);
            
            if (obj.genericPrice) {
                if (isSeller) obj.totalPrice = obj.genericPrice;
                else obj.value = obj.genericPrice;
                delete obj.genericPrice;
            }
            
            // 地區與案場互轉
            if (isSeller) {
                if (obj.reqRegion && !obj.assignedRegion) obj.assignedRegion = obj.reqRegion;
                if (obj.project && !obj.caseName) obj.caseName = obj.project;
            } else {
                // 買方
                if (obj.caseName && !obj.project) obj.project = obj.caseName;
            }

            if (obj.name) {
                parsedData.push(obj);
            }
        });
        return parsedData;
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsImporting(true);
        try {
            const fileName = file.name.toLowerCase();
            let jsonData = [];
            if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                const data = await file.arrayBuffer();
                const workbook = XLSX.read(data);
                jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { raw: false });
            } else {
                const text = await new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsText(file); });
                const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
                const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
                jsonData = lines.slice(1).map(line => { const r = {}; const v = line.split(','); headers.forEach((h, i) => r[h] = v[i] ? v[i].replace(/^"|"$/g, '').trim() : ''); return r; });
            }
            
            const parsed = processImportData(jsonData);
            
            // ★★★ 自動歸類案場邏輯 ★★★
            if (onUpdateProjects && companyProjects) {
                const currentProjects = new Set();
                Object.values(companyProjects).flat().forEach(p => currentProjects.add(p));
                let newProjectsFound = false;
                const updatedCompanyProjects = { ...companyProjects };
                if (!updatedCompanyProjects['其他']) updatedCompanyProjects['其他'] = [];

                parsed.forEach(item => {
                    const pName = item.project || item.caseName;
                    if (pName && !currentProjects.has(pName)) {
                        updatedCompanyProjects['其他'].push(pName);
                        currentProjects.add(pName);
                        newProjectsFound = true;
                    }
                });

                if (newProjectsFound) {
                    await onUpdateProjects(updatedCompanyProjects);
                }
            }

            const sample = parsed[0];
            const sampleInfo = sample ? `\n\n範例資料:\n姓名: ${sample.name}\n狀態: ${sample.status}\n來源: ${sample.source}\n日期: ${sample.createdAt}` : '';
            
            if (parsed.length > 0 && confirm(`準備匯入 ${parsed.length} 筆資料？${sampleInfo}`)) {
                onImport(parsed);
            }
        } catch (err) {
            console.error(err);
            alert("匯入失敗，請確認檔案格式");
        } finally {
            setIsImporting(false);
            e.target.value = '';
        }
    };

    const toggleSelectionMode = () => { if (isSelectionMode) setSelectedIds([]); setIsSelectionMode(!isSelectionMode); };
    const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    const handleSelectAll = () => setSelectedIds(selectedIds.length === visibleCustomers.length && visibleCustomers.length > 0 ? [] : visibleCustomers.map(c => c.id));
    const handleBatchDeleteClick = () => { onBatchDelete(selectedIds); setSelectedIds([]); setIsSelectionMode(false); };
    const handleCardClick = (client) => { if (isSelectionMode) { toggleSelect(client.id); } else if (isBroadcasting) { if(confirm(`確定要廣播「${client.name}」的資料給所有人看嗎？`)) { onBroadcast(client.id, true); } } else { setSelectedCustomer(client); setView('detail'); } };
    const toggleBroadcastMode = () => { const newState = !isBroadcasting; setIsBroadcasting(newState); if (!newState) { onBroadcast(null, false); } };

    return (
      <div className="pb-24 w-full">
        {isBroadcasting && <div className="fixed top-0 left-0 w-full bg-red-600 text-white text-center py-1 z-50 font-bold animate-pulse">🔴 廣播模式已啟動：點擊卡片將同步畫面給所有人員</div>}
        <div className={`w-full px-4 pt-10 pb-4 sticky top-0 z-10 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
           <div className="w-full">
             <div className="flex justify-between items-center mb-4">
                <div><h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isCaseFolderMode ? '📂 案件資料夾' : '客戶列表'}</h1><p className="text-xs text-gray-500 mt-1 flex items-center gap-2"><span>{currentUser?.name}</span><span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold"><Building2 className="w-3 h-3"/> {currentUser?.companyCode}</span></p></div>
                <div className="flex gap-2 items-center">
                   <button onClick={() => setIsCaseFolderMode(!isCaseFolderMode)} className={`p-2 rounded-full border transition-all ${isCaseFolderMode ? 'bg-orange-500 text-white border-orange-600 shadow-md transform scale-105' : 'bg-white text-gray-600'}`} title="切換案件/客戶列表"><Briefcase className="w-5 h-5" /></button>
                   <button onClick={toggleBroadcastMode} className={`p-2 rounded-full border transition-all ${isBroadcasting ? 'bg-red-600 text-white border-red-700 shadow-lg shadow-red-500/50 animate-pulse' : 'bg-white text-gray-400'}`} title="開啟全屏廣播模式"><Radio className="w-5 h-5" /></button>
                   {isSelectionMode ? (<><button onClick={handleSelectAll} className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"><ListChecks className="w-5 h-5" /></button>{selectedIds.length > 0 && <button onClick={handleBatchDeleteClick} className="bg-red-600 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"><Trash2 className="w-4 h-4" /> 刪除 ({selectedIds.length})</button>}<button onClick={toggleSelectionMode} className="p-2 rounded-full bg-gray-200 text-gray-600"><X className="w-5 h-5" /></button></>) : (<><button onClick={toggleSelectionMode} className={`p-2 rounded-full border ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}><CheckSquare className="w-5 h-5" /></button><button onClick={() => setView('add')} className="bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> 新增</button><button onClick={() => fileInputRef.current.click()} disabled={isImporting} className="bg-white text-green-600 border px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1">{isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} 匯入</button></>)}<input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} /><button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200'}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button><button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 text-red-400"><LogOut className="w-5 h-5"/></button>
                </div>
             </div>
             
             {/* 時間篩選 */}
             <div className="flex flex-col gap-2 mb-3">
                 <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                     {['week', 'month', 'year', 'all'].map(m => <button key={m} onClick={() => setListMode(m)} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === m ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>{m === 'week' ? '週' : m === 'month' ? '月' : m === 'year' ? '年' : '全部'}檢視</button>)}
                 </div>
                 {listMode !== 'all' && (
                     <div className="flex gap-2">
                         {listMode === 'week' ? (<div className="flex items-center flex-1 gap-2"><input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`} /><span className="text-xs text-gray-500 font-medium">{getWeekRangeDisplay(listWeekDate)}</span></div>) : (<><select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>{years.map(y => <option key={y} value={y}>{y}年</option>)}</select>{listMode === 'month' && <select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select>}</>)}
                     </div>
                 )}
                 
                 {/* 進階篩選 */}
                 {listMode === 'all' && (
                     <div className="bg-blue-50 dark:bg-slate-800 p-2 rounded-lg border border-blue-100 dark:border-slate-700 text-sm space-y-2 animate-in fade-in slide-in-from-top-2">
                         <div className="flex gap-2 items-center text-blue-600 font-bold mb-1"><Filter className="w-3 h-3"/> {isCaseFolderMode ? '案件篩選' : '客戶篩選'}</div>
                         
                         <div className="flex gap-2 flex-wrap">
                             <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterProject(''); }} className="flex-1 min-w-[30%] p-1 rounded border text-xs"><option value="">所有區域</option>{companyProjects && Object.keys(companyProjects).map(r => <option key={r} value={r}>{r}</option>)}</select>
                             <select value={filterProject} onChange={e => setFilterProject(e.target.value)} className="flex-1 min-w-[30%] p-1 rounded border text-xs"><option value="">{isCaseFolderMode?'所有案名':'所有案場'}</option>{filterRegion && companyProjects[filterRegion]?.map(p => <option key={p} value={p}>{p}</option>)}</select>
                             {isAdmin && (
                                 <div className="flex-1 min-w-[30%] flex items-center bg-white border rounded px-1">
                                    <User className="w-3 h-3 text-gray-400 mr-1"/>
                                    <select value={filterUser} onChange={e => setFilterUser(e.target.value)} className="w-full p-1 text-xs border-none outline-none">
                                        <option value="">所有人員</option>
                                        {availableAgents.map(name => <option key={name} value={name}>{name}</option>)}
                                    </select>
                                 </div>
                             )}
                         </div>

                         {isCaseFolderMode && (
                             <>
                                 <div className="flex gap-2 items-center"><span className="text-xs text-gray-500 w-8">總價</span><input placeholder="最少" value={filterMinPrice} onChange={e=>setFilterMinPrice(e.target.value)} className="w-full p-1 rounded border text-xs"/><span className="text-gray-400">~</span><input placeholder="最多" value={filterMaxPrice} onChange={e=>setFilterMaxPrice(e.target.value)} className="w-full p-1 rounded border text-xs"/></div>
                                 <div className="flex gap-2 items-center"><span className="text-xs text-gray-500 w-8">坪數</span><input placeholder="最少" value={filterMinPing} onChange={e=>setFilterMinPing(e.target.value)} className="w-full p-1 rounded border text-xs"/><span className="text-gray-400">~</span><input placeholder="最多" value={filterMaxPing} onChange={e=>setFilterMaxPing(e.target.value)} className="w-full p-1 rounded border text-xs"/></div>
                             </>
                         )}
                     </div>
                 )}
             </div>

             <div className={`rounded-xl p-2 flex items-center border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}><Search className="w-5 h-5 text-gray-400 ml-2" /><input type="text" placeholder="搜尋..." className="w-full px-3 py-1 bg-transparent outline-none text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
           </div>
        </div>
        <div className="px-4 mt-4 w-full">
           {loading ? <div className="text-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-50" /></div> : visibleCustomers.length === 0 ? <div className="text-center py-20 opacity-40"><Users className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="font-bold text-gray-500">無資料</p></div> : (groupedCustomers ? (<div className="space-y-8">{Object.entries(groupedCustomers).map(([ownerName, list]) => (<div key={ownerName}><h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2"><UserCircle className="w-4 h-4"/> {ownerName} <span className="text-gray-400 text-xs font-normal">({list.length}位)</span></h3><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{list.map(c => { let displayDate = null; if (listMode !== 'all') { const dates = []; if(c.lastContact) dates.push(c.lastContact); if(c.notes) c.notes.forEach(n => dates.push(n.date)); if(c.createdAt) try { dates.push(typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date(c.createdAt.seconds*1000).toISOString().split('T')[0]) } catch(e){} const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate)); if (validDates.length > 0) displayDate = validDates.sort((a,b) => new Date(b)-new Date(a))[0]; } return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={handleCardClick} displayDate={displayDate} isSelected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} isSelectionMode={isSelectionMode} />; })}</div></div>))}</div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">{visibleCustomers.map(c => { let displayDate = null; if (listMode !== 'all') { const dates = []; if(c.lastContact) dates.push(c.lastContact); if(c.notes) c.notes.forEach(n => dates.push(n.date)); if(c.createdAt) try { dates.push(typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date(c.createdAt.seconds*1000).toISOString().split('T')[0]) } catch(e){} const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate)); if (validDates.length > 0) displayDate = validDates.sort((a,b) => new Date(b)-new Date(a))[0]; } return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={handleCardClick} displayDate={displayDate} isSelected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} isSelectionMode={isSelectionMode} />; })}</div>))}
        </div>
      </div>
    );
};

export default ClientsView;