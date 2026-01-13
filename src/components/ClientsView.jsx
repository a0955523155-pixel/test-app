import React, { useRef, useState, useMemo } from 'react';
import { 
  Building2, Sun, Moon, LogOut, Search, Users, Loader2, UserCircle, CalendarDays, Clock, ChevronRight,
  Upload, FileText, Plus, Trash2, CheckSquare, Square, X, ListChecks
} from 'lucide-react';
import * as XLSX from 'xlsx'; 
import { STATUS_CONFIG } from '../config/constants';
import { formatDateString, isDateInRange, getWeekRangeDisplay } from '../utils/helpers';

// --- 子元件：狀態標籤 ---
const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const Icon = config.icon || Users; 
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</span>;
};

// --- 子元件：客戶卡片 ---
const ClientCard = ({ c, darkMode, onClick, displayDate, isSelected, onToggleSelect, isSelectionMode }) => {
    // 優先顯示該區間觸發顯示的日期，若無則顯示最後動態，再無則顯示建檔日
    const showDate = displayDate || c.lastContact || formatDateString(c.createdAt);
    const isHistoricalView = displayDate && displayDate !== c.lastContact;

    return (
        <div 
            onClick={() => onClick(c)} 
            className={`group rounded-xl p-4 border cursor-pointer active:scale-[0.98] transition-all relative ${isSelected ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' : (darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm')}`}
        >
            {isSelectionMode && (
                <div 
                    onClick={(e) => { e.stopPropagation(); onToggleSelect(c.id); }}
                    className="absolute top-3 left-3 z-10 p-1 text-gray-400 hover:text-blue-500 cursor-pointer"
                >
                    {isSelected ? <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-100" /> : <Square className="w-5 h-5" />}
                </div>
            )}

            <div className={`flex justify-between items-start mb-2 ${isSelectionMode ? 'pl-6' : ''}`}> 
                <div className="flex items-center min-w-0">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold mr-3 flex-shrink-0 ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>{c.name?.[0]}</div>
                    <div className="min-w-0">
                        <h3 className={`font-bold text-base leading-none mb-1 truncate ${darkMode ? 'text-white' : 'text-gray-900'}`}>{c.name} <span className="text-xs font-normal text-gray-400 ml-1">({c.category || '未分類'})</span></h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-gray-500 truncate">{c.project ? c.project : (c.company || '未填寫案場')}</span>
                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-slate-800 px-1.5 rounded flex items-center gap-1 flex-shrink-0">
                                <CalendarDays className="w-3 h-3"/>
                                {formatDateString(c.createdAt)}
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0 ml-2">
                    <StatusBadge status={c.status} />
                </div>
            </div>
            <div className={`flex items-center justify-between mt-3 text-[11px] text-gray-400 font-medium pl-12`}>
                <span className="flex items-center gap-3">
                    <span className={`flex items-center ${isHistoricalView ? 'text-orange-500 font-bold' : ''}`} title={isHistoricalView ? "此為該區間的活動紀錄" : "最後動態時間"}>
                        <Clock className="w-3 h-3 mr-1" />
                        {showDate}
                        {isHistoricalView && <span className="ml-1 text-[9px]">(歷史)</span>}
                    </span>
                    <span className="text-blue-500 font-bold">預算: {c.value?.toLocaleString() || 0}</span>
                </span>
                <ChevronRight className="w-4 h-4" />
            </div>
        </div>
    );
};

// --- 主元件 ---
const ClientsView = ({ 
    currentUser, darkMode, toggleDarkMode, handleLogout,
    listMode, setListMode, listYear, setListYear, listMonth, setListMonth, listWeekDate, setListWeekDate,
    searchTerm, setSearchTerm,
    loading, customers = [], // 預設值防止崩潰
    isAdmin, setView, setSelectedCustomer,
    onImport, onBatchDelete
}) => {
    const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i); 
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);
    
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState([]);

    // ★★★ 核心邏輯：平衡時間過濾器 ★★★
    const visibleCustomers = useMemo(() => {
        if (!customers || !Array.isArray(customers)) return [];
        
        let base = [...customers];
        
        // 1. 權限過濾
        if (!isAdmin) {
            base = base.filter(c => c.owner === currentUser?.username);
        }
        
        // 2. 時間區間過濾 (包含建檔日、最後動態、記事日期)
        if (listMode !== 'all') {
            base = base.filter(c => {
                const activityDates = [];
                
                // (A) 檢查最後動態日期
                if (c.lastContact) activityDates.push(c.lastContact);
                
                // (B) 檢查所有記事日期
                if (c.notes && Array.isArray(c.notes)) {
                    c.notes.forEach(n => activityDates.push(n.date));
                }

                // (C) 補回建檔日期 (確保剛建檔的會出現)
                if (c.createdAt) {
                    try {
                        const d = c.createdAt.seconds ? new Date(c.createdAt.seconds * 1000) : new Date(c.createdAt);
                        if (!isNaN(d.getTime())) {
                            activityDates.push(d.toISOString().split('T')[0]);
                        }
                    } catch(e) {}
                }

                // 只要上述任一日期落在區間內，就顯示
                return activityDates.some(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
            });
        }

        // 3. 搜尋過濾
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            base = base.filter(c => 
              (c.name?.toLowerCase().includes(term) || 
               c.company?.toLowerCase().includes(term) || 
               c.ownerName?.toLowerCase().includes(term) || 
               c.project?.toLowerCase().includes(term))
            );
        }
        return base;
    }, [customers, isAdmin, currentUser, searchTerm, listMode, listYear, listMonth, listWeekDate]);

    // 分組邏輯
    const groupedCustomers = useMemo(() => {
        if (!isAdmin) return null;
        const groups = {};
        visibleCustomers.forEach(c => {
            const owner = c.ownerName || c.owner || '未知業務';
            if (!groups[owner]) groups[owner] = [];
            groups[owner].push(c);
        });
        return groups;
    }, [visibleCustomers, isAdmin]);

    const toggleSelectionMode = () => {
        if (isSelectionMode) setSelectedIds([]);
        setIsSelectionMode(!isSelectionMode);
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const handleSelectAll = () => {
        if (selectedIds.length === visibleCustomers.length && visibleCustomers.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(visibleCustomers.map(c => c.id));
        }
    };

    const handleBatchDeleteClick = () => {
        onBatchDelete(selectedIds);
        setSelectedIds([]);
        setIsSelectionMode(false); 
    };

    // --- Import Logic ---
    const processImportData = (jsonData) => {
        const parsedData = [];
        jsonData.forEach(row => {
            const obj = {};
            let remarksBuffer = [];
            Object.keys(row).forEach(header => {
                let value = row[header] ? String(row[header]).trim() : '';
                if (header.match(/(時間戳記|Timestamp|Date|日期|建檔日期)/i)) {
                    try {
                        const d = new Date(value);
                        if (!isNaN(d.getTime())) {
                            const y = d.getFullYear();
                            const m = String(d.getMonth()+1).padStart(2,'0');
                            const day = String(d.getDate()).padStart(2,'0');
                            obj.createdAt = `${y}-${m}-${day}`;
                        }
                    } catch(e) {}
                }
                else if (header.match(/(姓名|稱呼|Name)/i)) obj.name = value;
                else if (header.match(/(電話|手機|Phone|Mobile)/i)) obj.phone = value;
                else if (header.match(/(公司|Company)/i)) obj.company = value;
                else if (header.match(/(預算|Budget|Price)/i)) obj.value = value;
                else if (header.match(/(區域|地區|Region)/i)) obj.reqRegion = value;
                else if (header.match(/(坪數|Ping|Area)/i)) obj.reqPing = value;
                else if (header.match(/(來源|Source)/i)) obj.source = value;
                else {
                    if (value && !header.startsWith('__EMPTY')) remarksBuffer.push(`${header}: ${value}`);
                }
            });
            if (!obj.createdAt) obj.createdAt = new Date().toISOString().split('T')[0];
            obj.lastContact = obj.createdAt; 
            if (!obj.source) obj.source = "Excel匯入";
            if (!obj.status) obj.status = "new";
            if (!obj.category) obj.category = "買方"; 
            if (!obj.level) obj.level = "C"; 
            if (remarksBuffer.length > 0) obj.remarks = remarksBuffer.join('\n');
            if (obj.name || obj.phone) parsedData.push(obj);
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
                jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            } else {
                const text = await new Promise((res) => { const r = new FileReader(); r.onload = (e) => res(e.target.result); r.readAsText(file); });
                const lines = text.split(/\r\n|\n/).filter(l => l.trim() !== '');
                const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
                jsonData = lines.slice(1).map(line => {
                    const r = {}; const v = line.split(',');
                    headers.forEach((h, i) => r[h] = v[i] ? v[i].replace(/^"|"$/g, '').trim() : '');
                    return r;
                });
            }
            const parsed = processImportData(jsonData);
            if (parsed.length > 0 && confirm(`準備匯入 ${parsed.length} 筆資料？`)) onImport(parsed);
        } catch (err) { alert("匯入失敗"); } finally { setIsImporting(false); e.target.value = ''; }
    };

    return (
      <div className="pb-24 w-full">
        <div className={`w-full px-4 pt-10 pb-4 sticky top-0 z-10 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
           <div className="w-full">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>客戶列表</h1>
                   <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>{currentUser?.name}</span>
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold"><Building2 className="w-3 h-3"/> {currentUser?.companyCode}</span>
                   </p>
                </div>
                <div className="flex gap-2 items-center">
                   {isSelectionMode ? (
                        <>
                           <button onClick={handleSelectAll} className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"><ListChecks className="w-5 h-5" /></button>
                           {selectedIds.length > 0 && <button onClick={handleBatchDeleteClick} className="bg-red-600 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1 animate-pulse"><Trash2 className="w-4 h-4" /> 刪除 ({selectedIds.length})</button>}
                           <button onClick={toggleSelectionMode} className="p-2 rounded-full bg-gray-200 text-gray-600"><X className="w-5 h-5" /></button>
                        </>
                   ) : (
                       <>
                           <button onClick={toggleSelectionMode} className={`p-2 rounded-full border ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-white text-blue-600'}`}><CheckSquare className="w-5 h-5" /></button>
                           <button onClick={() => setView('add')} className="bg-blue-600 text-white px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1"><Plus className="w-4 h-4" /> 新增客戶</button>
                           <button onClick={() => fileInputRef.current.click()} disabled={isImporting} className="bg-white text-green-600 border px-3 py-2 rounded-full text-xs font-bold flex items-center gap-1">{isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />} 匯入</button>
                       </>
                   )}
                   <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                   <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200'}`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                   <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 text-red-400"><LogOut className="w-5 h-5" /></button>
                </div>
             </div>
             
             <div className="flex flex-col gap-2 mb-3">
                 <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                     {['week', 'month', 'year', 'all'].map(m => <button key={m} onClick={() => setListMode(m)} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === m ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>{m === 'week' ? '週' : m === 'month' ? '月' : m === 'year' ? '年' : '全部'}檢視</button>)}
                 </div>
                 {listMode !== 'all' && (
                     <div className="flex gap-2">
                         {listMode === 'week' ? (
                             <div className="flex items-center flex-1 gap-2">
                                <input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`} />
                                <span className="text-xs text-gray-500 font-medium">{getWeekRangeDisplay(listWeekDate)}</span>
                             </div>
                         ) : (
                             <>
                                 <select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>{years.map(y => <option key={y} value={y}>{y}年</option>)}</select>
                                 {listMode === 'month' && <select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white'}`}>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select>}
                             </>
                         )}
                     </div>
                 )}
             </div>
             <div className={`rounded-xl p-2 flex items-center border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-300'}`}>
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input type="text" placeholder="搜尋客戶..." className="w-full px-3 py-1 bg-transparent outline-none text-sm font-medium" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
           </div>
        </div>
        <div className="px-4 mt-4 w-full">
           {loading ? (
             <div className="text-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-50" /></div>
           ) : visibleCustomers.length === 0 ? (
             <div className="text-center py-20 opacity-40"><Users className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="font-bold text-gray-500">此區間目前無動態客戶</p></div>
           ) : (isAdmin && groupedCustomers ? (
             <div className="space-y-8">
               {Object.entries(groupedCustomers).map(([ownerName, list]) => (
                 <div key={ownerName}>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2"><UserCircle className="w-4 h-4"/> {ownerName} <span className="text-gray-400 text-xs font-normal">({list.length}位)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {list.map(c => {
                             let displayDate = null;
                             if (listMode !== 'all') {
                                 // 計算要顯示的日期：取該區間內最新的日期
                                 const dates = [];
                                 if(c.lastContact) dates.push(c.lastContact);
                                 if(c.notes) c.notes.forEach(n => dates.push(n.date));
                                 if(c.createdAt) {
                                     try { dates.push(typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date(c.createdAt.seconds*1000).toISOString().split('T')[0]) } catch(e){}
                                 }
                                 
                                 const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
                                 if (validDates.length > 0) displayDate = validDates.sort((a,b) => new Date(b)-new Date(a))[0];
                             }
                             return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={(client) => isSelectionMode ? toggleSelect(client.id) : (setSelectedCustomer(client), setView('detail'))} displayDate={displayDate} isSelected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} isSelectionMode={isSelectionMode} />;
                        })}
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {visibleCustomers.map(c => {
                    let displayDate = null;
                    if (listMode !== 'all') {
                        const dates = [];
                        if(c.lastContact) dates.push(c.lastContact);
                        if(c.notes) c.notes.forEach(n => dates.push(n.date));
                        if(c.createdAt) {
                             try { dates.push(typeof c.createdAt === 'string' ? c.createdAt.split('T')[0] : new Date(c.createdAt.seconds*1000).toISOString().split('T')[0]) } catch(e){}
                        }
                        const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
                        if (validDates.length > 0) displayDate = validDates.sort((a,b) => new Date(b)-new Date(a))[0];
                    }
                    return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={(client) => isSelectionMode ? toggleSelect(client.id) : (setSelectedCustomer(client), setView('detail'))} displayDate={displayDate} isSelected={selectedIds.includes(c.id)} onToggleSelect={toggleSelect} isSelectionMode={isSelectionMode} />;
                })}
             </div>
           ))}
        </div>
      </div>
    );
};

export default ClientsView;