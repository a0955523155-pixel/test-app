import React, { useRef, useState } from 'react';
import { 
  Building2, Sun, Moon, LogOut, Search, Users, Loader2, UserCircle, CalendarDays, Clock, ChevronRight,
  Upload, FileText, Plus // <--- 注意這裡是用大寫 Plus
} from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';
import { formatDateString, isDateInRange, getWeekRangeDisplay } from '../utils/helpers';

// --- 子元件：狀態標籤 ---
const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const Icon = config.icon || Users; 
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</span>;
};

// --- 子元件：客戶卡片 ---
const ClientCard = ({ c, darkMode, onClick, displayDate }) => {
    const showDate = displayDate || c.lastContact || formatDateString(c.createdAt);
    const isHistoricalView = displayDate && displayDate !== c.lastContact;

    return (
        <div onClick={() => onClick(c)} className={`group rounded-xl p-4 border cursor-pointer active:scale-[0.98] transition-all ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-blue-400 shadow-sm'}`}>
            <div className="flex justify-between items-start mb-2">
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
            <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400 font-medium pl-12">
                <span className="flex items-center gap-3">
                    <span className={`flex items-center ${isHistoricalView ? 'text-orange-500 font-bold' : ''}`} title={isHistoricalView ? "此為該區間的活動紀錄" : "最後動態時間"}>
                        <Clock className="w-3 h-3 mr-1" />
                        {showDate}
                        {isHistoricalView && <span className="ml-1 text-[9px]">(歷史)</span>}
                    </span>
                    <span className="text-blue-500">預算: {c.value?.toLocaleString() || 0}</span>
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
    loading, visibleCustomers, isAdmin, groupedCustomers, myCustomers,
    setView, setSelectedCustomer,
    onImport 
}) => {
    const years = Array.from({length: 10}, (_, i) => new Date().getFullYear() - i); 
    const months = Array.from({length: 12}, (_, i) => i + 1);
    const fileInputRef = useRef(null);
    const [isImporting, setIsImporting] = useState(false);

    // --- Google 表單 CSV 解析邏輯 ---
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        setIsImporting(true);
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const text = event.target.result;
                const lines = text.split(/\r\n|\n/).filter(line => line.trim() !== '');
                if (lines.length < 2) { alert("檔案內容為空或格式錯誤"); return; }

                // 處理標題列 (移除引號)
                const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
                
                const parsedData = [];
                
                for (let i = 1; i < lines.length; i++) {
                    let row = lines[i].split(','); 
                    const obj = {};
                    let remarksBuffer = [];

                    headers.forEach((header, index) => {
                        let value = row[index] ? row[index].replace(/^"|"$/g, '').trim() : '';
                        
                        if (header.includes('時間戳記') || header.includes('Timestamp')) {
                            try {
                                const d = new Date(value);
                                if (!isNaN(d.getTime())) {
                                    const y = d.getFullYear();
                                    const m = String(d.getMonth()+1).padStart(2,'0');
                                    const day = String(d.getDate()).padStart(2,'0');
                                    obj.createdAt = `${y}-${m}-${day}`;
                                } else {
                                    obj.createdAt = new Date().toISOString().split('T')[0];
                                }
                            } catch(e) { obj.createdAt = new Date().toISOString().split('T')[0]; }
                        }
                        else if (header.includes('姓名') || header.includes('稱呼') || header.includes('Name')) obj.name = value;
                        else if (header.includes('電話') || header.includes('手機') || header.includes('Phone')) obj.phone = value;
                        else if (header.includes('公司')) obj.company = value;
                        else if (header.includes('預算')) obj.value = value;
                        else if (header.includes('區域') || header.includes('地區')) obj.reqRegion = value;
                        else if (header.includes('坪數')) obj.reqPing = value;
                        else if (header.includes('來源')) obj.source = value;
                        else {
                            if (value) remarksBuffer.push(`${header}: ${value}`);
                        }
                    });

                    if (!obj.createdAt) obj.createdAt = new Date().toISOString().split('T')[0];
                    if (!obj.source) obj.source = "Google表單";
                    if (!obj.status) obj.status = "new";
                    if (!obj.category) obj.category = "買方"; 
                    if (!obj.level) obj.level = "C"; 
                    
                    if (remarksBuffer.length > 0) {
                        obj.remarks = remarksBuffer.join('\n');
                    }

                    if (obj.name || obj.phone) {
                        parsedData.push(obj);
                    }
                }

                if (parsedData.length > 0) {
                    if(confirm(`解析成功！準備匯入 ${parsedData.length} 筆資料。\n(來源: Google表單/Excel CSV)`)) {
                        onImport(parsedData);
                    }
                } else {
                    alert("無法解析資料，請確認 CSV 檔案格式。");
                }

            } catch (err) {
                console.error("CSV Parse Error", err);
                alert("檔案解析失敗");
            } finally {
                setIsImporting(false);
                if (fileInputRef.current) fileInputRef.current.value = ''; 
            }
        };
        reader.readAsText(file);
    };

    return (
      <div className="pb-24 w-full">
        <div className={`w-full px-4 pt-10 pb-4 sticky top-0 z-10 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
           <div className="w-full">
             <div className="flex justify-between items-center mb-4">
                <div>
                   <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>客戶列表</h1>
                   <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                      <span>{currentUser?.name} ({currentUser?.role === 'super_admin' ? '經營者' : currentUser?.role === 'admin' ? '行政及管理員' : '業務'})</span>
                      <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded flex items-center gap-1 font-bold"><Building2 className="w-3 h-3"/> {currentUser?.companyCode}</span>
                   </p>
                </div>
                <div className="flex gap-2">
                   {/* ★★★ 新增客戶按鈕 (在這裡) ★★★ */}
                   <button 
                        onClick={() => setView('add')} 
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold border transition-transform active:scale-95 ${darkMode ? 'bg-blue-600 text-white border-blue-500 hover:bg-blue-500' : 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'}`}
                    >
                        <Plus className="w-4 h-4" />
                        <span className="hidden sm:inline">新增客戶</span>
                   </button>

                   {/* 隱藏的檔案輸入框 */}
                   <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".csv" 
                        onChange={handleFileChange} 
                   />
                   
                   {/* 匯入按鈕 */}
                   <button 
                        onClick={() => fileInputRef.current.click()} 
                        disabled={isImporting}
                        className={`flex items-center gap-2 px-3 py-2 rounded-full text-xs font-bold border transition-transform active:scale-95 ${darkMode ? 'bg-slate-800 text-green-400 border-slate-700 hover:bg-slate-700' : 'bg-white text-green-600 border-gray-200 hover:bg-gray-50'}`}
                        title="匯入 Google 表單 CSV"
                   >
                        {isImporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Upload className="w-4 h-4" />}
                        <span className="hidden sm:inline">匯入表單</span>
                   </button>

                   <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200 text-gray-600'} hover:scale-110 transition-transform`}>{darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>
                   <button onClick={handleLogout} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-red-400' : 'bg-gray-200 text-gray-600'} hover:scale-110 transition-transform`}><LogOut className="w-5 h-5" /></button>
                </div>
             </div>
             {/* ... 以下保持不變 ... */}
             <div className="flex flex-col gap-2 mb-3">
                 <div className="flex bg-gray-200 dark:bg-slate-800 rounded-lg p-1">
                     <button onClick={() => setListMode('week')} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === 'week' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500'}`}>週檢視</button>
                     <button onClick={() => setListMode('month')} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === 'month' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500'}`}>月檢視</button>
                     <button onClick={() => setListMode('year')} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === 'year' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500'}`}>年檢視</button>
                     <button onClick={() => setListMode('all')} className={`flex-1 py-1 text-xs font-bold rounded ${listMode === 'all' ? 'bg-white dark:bg-slate-600 shadow text-blue-600' : 'text-gray-500'}`}>全部</button>
                 </div>
                 {listMode !== 'all' && (
                     <div className="flex gap-2">
                         {listMode === 'week' ? (
                             <div className="flex items-center flex-1 gap-2">
                                <input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`flex-1 py-1 px-2 rounded border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`} />
                                <span className="text-xs text-gray-500 whitespace-nowrap font-medium">{getWeekRangeDisplay(listWeekDate)}</span>
                             </div>
                         ) : (
                             <>
                                 <select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`}>{years.map(y => <option key={y} value={y}>{y}年</option>)}</select>
                                 {listMode === 'month' && <select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`flex-1 py-1 px-2 rounded border text-xs outline-none ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-gray-300'}`}>{months.map(m => <option key={m} value={m}>{m}月</option>)}</select>}
                             </>
                         )}
                     </div>
                 )}
             </div>
             <div className={`rounded-xl p-2 flex items-center border transition-all ${darkMode ? 'bg-slate-900 border-slate-800 focus-within:border-blue-500' : 'bg-white border-gray-300 focus-within:border-blue-500'}`}>
                <Search className="w-5 h-5 text-gray-400 ml-2" />
                <input type="text" placeholder="搜尋客戶..." className={`w-full px-3 py-1 bg-transparent outline-none text-sm font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
             </div>
           </div>
        </div>
        <div className="px-4 mt-4 w-full">
           {loading ? (
             <div className="text-center py-20"><Loader2 className="w-8 h-8 text-blue-500 animate-spin mx-auto opacity-50" /></div>
           ) : visibleCustomers.length === 0 ? (
             <div className="text-center py-20 opacity-40"><Users className="w-12 h-12 mx-auto mb-3 text-gray-400" /><p className="font-bold text-gray-500 font-bold">目前無符合條件的客戶</p></div>
           ) : (isAdmin && groupedCustomers ? (
             <div className="space-y-8">
               {Object.entries(groupedCustomers).map(([ownerName, list]) => (
                 <div key={ownerName}>
                    <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2"><UserCircle className="w-4 h-4"/> {ownerName} <span className="text-gray-400 text-xs font-normal">({list.length}位)</span></h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                        {list.map(c => {
                             let displayDate = null;
                             if (listMode !== 'all') {
                                 const dates = [];
                                 if (c.createdAt) dates.push(formatDateString(c.createdAt));
                                 if (c.notes && Array.isArray(c.notes)) c.notes.forEach(n => dates.push(n.date));
                                 if (c.lastContact) dates.push(c.lastContact);
                                 
                                 const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
                                 if (validDates.length > 0) {
                                     validDates.sort((a, b) => new Date(b) - new Date(a));
                                     displayDate = validDates[0];
                                 }
                             }

                             return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={(client) => { setSelectedCustomer(client); setView('detail'); }} displayDate={displayDate} />;
                        })}
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3">
                {myCustomers.map(c => {
                    let displayDate = null;
                    if (listMode !== 'all') {
                        const dates = [];
                        if (c.createdAt) dates.push(formatDateString(c.createdAt));
                        if (c.notes && Array.isArray(c.notes)) c.notes.forEach(n => dates.push(n.date));
                        if (c.lastContact) dates.push(c.lastContact);
                        
                        const validDates = dates.filter(d => isDateInRange(d, listMode, listYear, listMonth, listWeekDate));
                        if (validDates.length > 0) {
                             validDates.sort((a, b) => new Date(b) - new Date(a));
                             displayDate = validDates[0];
                        }
                    }
                    return <ClientCard key={c.id} c={c} darkMode={darkMode} onClick={(client) => { setSelectedCustomer(client); setView('detail'); }} displayDate={displayDate} />;
                })}
             </div>
           ))}
        </div>
      </div>
    );
};

export default ClientsView;