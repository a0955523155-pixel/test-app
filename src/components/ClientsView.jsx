import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, Plus, Filter, Download, Upload, FileSpreadsheet, 
  ChevronDown, ChevronRight, User, Phone, MapPin, Tag, Calendar, MoreHorizontal, LayoutGrid, List as ListIcon, 
  ExternalLink, Trash2, MessageCircle, Moon, Sun, LogOut, CheckCircle, CheckSquare, ArrowUpDown, Users,
  Building, FolderOpen, Megaphone, X
} from 'lucide-react';
import * as XLSX from 'xlsx'; 

import { STATUS_CONFIG } from '../config/constants';

const StatusBadge = ({ status, category }) => {
    const isCase = ['賣方', '出租', '出租方'].includes(category);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];

    const labelMap = {
        'new': isCase ? '新案件' : '新客戶',
        'contacting': isCase ? '洽談中' : '接洽中',
        'commissioned': '已委託',
        'offer': '已收斡',
        'closed': '已成交',
        'lost': '已無效'
    };

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
            {labelMap[status] || config.label}
        </span>
    );
};

const ClientsView = ({ 
    customers, currentUser, darkMode, toggleDarkMode, handleLogout, 
    listMode, setListMode, listYear, setListYear, listMonth, setListMonth, 
    listWeekDate, setListWeekDate, searchTerm, setSearchTerm, loading, isAdmin,
    setView, setSelectedCustomer, onCustomerClick, 
    onImport, onBatchDelete, onBroadcast,
    companyProjects, onUpdateProjects 
}) => {
    
    const [selectedIds, setSelectedIds] = useState([]);
    const [filterCategory, setFilterCategory] = useState('all'); 
    const [sortMode, setSortMode] = useState('agent'); 
    const [expandedGroups, setExpandedGroups] = useState({});

    // 模式控制
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isBroadcastMode, setIsBroadcastMode] = useState(false); // ★ 新增：廣播模式狀態

    const pressTimer = useRef(null);

    useEffect(() => {
        setListMode('week'); 
    }, []);

    const toggleGroup = (groupName) => {
        setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
    };

    const handleDownloadTemplate = () => {
        const template = [
            { "姓名": "王小明", "電話": "0912345678", "分類": "買方", "預算": "1500", "區域": "鳳山區, 三民區", "備註": "急尋三房" },
            { "姓名": "陳大美", "電話": "0988765432", "分類": "賣方", "預算": "", "區域": "", "備註": "屋主自售" }
        ];
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
                const data = XLSX.utils.sheet_to_json(ws);
                onImport(data);
                e.target.value = '';
            } catch (error) {
                console.error("Excel 解析失敗:", error);
                alert("檔案解析失敗，請確認檔案格式是否正確。");
            }
        };
        reader.readAsBinaryString(file);
    };

    const getGroupKey = (c) => {
        if (sortMode === 'agent') return c.ownerName || '未知業務';
        if (sortMode === 'region') {
            if (c.reqRegion) return c.reqRegion.split(',')[0].trim(); 
            if (c.assignedRegion) return c.assignedRegion;
            return '未分類區域';
        }
        if (sortMode === 'project') {
            if (c.project) return c.project.split(',')[0].trim();
            if (c.assignedRegion) return `${c.assignedRegion} (歸檔)`;
            return '未分類案場';
        }
        return '全部';
    };

    const filteredCustomers = useMemo(() => {
        let data = customers.filter(c => {
            // ★★★ 核心權限邏輯 (RBAC) ★★★
            // 1. 如果是管理員 (isAdmin)，看全部
            // 2. 如果不是管理員：
            //    a. 案件/賣方 (isCase) -> 大家都能看 (案源共享)
            //    b. 客戶/買方 -> 只能看自己的 (客源保密)
            const isCase = ['賣方', '出租', '出租方'].includes(c.category);
            const isMyData = c.owner === currentUser?.username;

            if (!isAdmin && !isCase && !isMyData) {
                return false; // 隱藏別人的私有客戶
            }
            // -----------------------------

            const matchSearch = (c.name?.includes(searchTerm) || c.phone?.includes(searchTerm) || c.caseName?.includes(searchTerm));
            
            let matchCat = true;
            if (filterCategory === 'buyer') matchCat = c.category === '買方' || c.category === '租客';
            else if (filterCategory === 'seller') matchCat = ['賣方', '出租', '出租方'].includes(c.category);

            let matchTime = true;
            const dateRef = new Date(c.lastContact || c.createdAt);
            if (isNaN(dateRef.getTime())) return matchSearch && matchCat; 

            if (listMode === 'month') {
                matchTime = dateRef.getFullYear() === listYear && (dateRef.getMonth() + 1) === listMonth;
            } else if (listMode === 'week') {
                const targetDate = new Date(listWeekDate);
                const first = targetDate.getDate() - targetDate.getDay(); 
                const firstDay = new Date(targetDate.setDate(first));
                const lastDay = new Date(targetDate.setDate(first + 6));
                firstDay.setHours(0,0,0,0);
                lastDay.setHours(23,59,59,999);
                matchTime = dateRef >= firstDay && dateRef <= lastDay;
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

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(pid => pid !== id));
        else setSelectedIds(prev => [...prev, id]);
    };

    const toggleSelect = () => {
        if (selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0) setSelectedIds([]);
        else setSelectedIds(filteredCustomers.map(c => c.id));
    };

    // ★★★ 點擊處理邏輯 (分流：廣播 / 多選 / 詳情) ★★★
    const handleCardClick = (customer) => {
        if (isBroadcastMode) {
            // 廣播模式：直接觸發廣播
            onBroadcast(customer.id, true);
        } else if (isSelectionMode) {
            // 多選模式：選取
            handleSelectOne(customer.id);
        } else {
            // 一般模式：進詳情
            onCustomerClick(customer);
        }
    };

    const handleTouchStart = (id) => {
        if (isBroadcastMode) return; // 廣播模式下不觸發長按
        pressTimer.current = setTimeout(() => {
            setIsSelectionMode(true);
            handleSelectOne(id);
            if (navigator.vibrate) navigator.vibrate(50);
        }, 600);
    };

    const handleTouchEnd = () => {
        if (pressTimer.current) clearTimeout(pressTimer.current);
    };

    const getGroupCount = (groupKey) => {
        return filteredCustomers.filter(c => getGroupKey(c) === groupKey).length;
    };

    const getGroupIcon = () => {
        if (sortMode === 'region') return <MapPin className="w-4 h-4 text-green-500"/>;
        if (sortMode === 'project') return <Building className="w-4 h-4 text-purple-500"/>;
        return <Users className="w-4 h-4 text-blue-500"/>;
    };

    return (
        <div className="pb-20">
            <div className={`sticky top-0 z-10 px-4 pt-10 pb-2 border-b transition-colors ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-gray-50 border-gray-200'}`}>
                <div className="flex justify-between items-center mb-4">
                    <h1 className={`text-2xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-gray-900'}`}>客戶列表</h1>
                    <div className="flex gap-2">
                        <button onClick={toggleDarkMode} className={`p-2 rounded-full ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-gray-200'}`}>{darkMode ? <Sun className="w-5 h-5"/> : <Moon className="w-5 h-5"/>}</button>
                        <button onClick={handleLogout} className="p-2 rounded-full bg-gray-200 text-red-400"><LogOut className="w-5 h-5"/></button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <div className="flex gap-2">
                        <div className={`flex-1 flex items-center px-3 py-2 rounded-xl border transition-colors ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-300'}`}>
                            <Search className="w-5 h-5 text-gray-400 mr-2" />
                            <input 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜尋..." 
                                className="bg-transparent border-none outline-none w-full text-sm"
                            />
                        </div>
                        
                        {/* ★★★ 廣播模式獨立按鍵 ★★★ */}
                        {!isSelectionMode && (
                            <button 
                                onClick={() => {
                                    setIsBroadcastMode(!isBroadcastMode);
                                    setIsSelectionMode(false);
                                }} 
                                className={`px-3 rounded-xl flex items-center gap-1 font-bold transition-all shadow-md active:scale-95 ${isBroadcastMode ? 'bg-purple-600 text-white ring-2 ring-purple-300' : 'bg-white text-purple-600 border border-purple-200'}`}
                            >
                                {isBroadcastMode ? <X className="w-5 h-5"/> : <Megaphone className="w-5 h-5"/>} 
                                <span className="hidden sm:inline">{isBroadcastMode ? '退出' : '廣播'}</span>
                            </button>
                        )}

                        {/* 新增按鈕 (非廣播模式才顯示) */}
                        {!isSelectionMode && !isBroadcastMode && (
                            <button onClick={() => setView('add')} className="bg-blue-600 hover:bg-blue-700 text-white px-3 rounded-xl flex items-center gap-1 font-bold shadow-lg transition-all active:scale-95">
                                <Plus className="w-5 h-5" /> 
                            </button>
                        )}

                        {/* 多選按鈕 (非廣播模式才顯示) */}
                        {!isBroadcastMode && (
                            <button 
                                onClick={() => {
                                    setIsSelectionMode(!isSelectionMode);
                                    if (isSelectionMode) setSelectedIds([]); 
                                }} 
                                className={`px-3 rounded-xl flex items-center gap-1 font-bold transition-all ${isSelectionMode ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                            >
                                <CheckSquare className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    {/* 廣播模式提示條 */}
                    {isBroadcastMode && (
                        <div className="bg-purple-100 text-purple-700 text-xs font-bold px-3 py-2 rounded-lg flex items-center animate-in fade-in">
                            <Megaphone className="w-4 h-4 mr-2 animate-pulse"/>
                            廣播模式：點擊任一客戶/案件即可立即發送廣播
                        </div>
                    )}

                    {!isBroadcastMode && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                            <div className={`flex items-center px-2 py-1.5 rounded-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                <ArrowUpDown className="w-3 h-3 text-gray-500 mr-1"/>
                                <select value={sortMode} onChange={(e) => setSortMode(e.target.value)} className={`bg-transparent border-none text-xs font-bold outline-none ${darkMode?'text-white':'text-gray-700'}`}>
                                    <option value="agent">分組: 業務</option>
                                    <option value="region">分組: 區域</option>
                                    <option value="project">分組: 案場</option>
                                    <option value="date">不分組</option>
                                </select>
                            </div>

                            <div className="h-6 w-px bg-gray-300 dark:bg-slate-700 mx-1"></div>

                            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                <option value="all">全部分類</option>
                                <option value="buyer">買方/租客</option>
                                <option value="seller">賣方/屋主</option>
                            </select>

                            <select value={listMode} onChange={(e) => setListMode(e.target.value)} className={`px-3 py-1.5 rounded-lg border text-xs font-bold outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`}>
                                <option value="all">全部時間</option>
                                <option value="month">本月</option>
                                <option value="week">本週</option>
                            </select>

                            {listMode === 'month' && (
                                <>
                                    <select value={listYear} onChange={(e) => setListYear(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:5},(_,i)=>new Date().getFullYear()-i).map(y=><option key={y} value={y}>{y}年</option>)}</select>
                                    <select value={listMonth} onChange={(e) => setListMonth(Number(e.target.value))} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>{Array.from({length:12},(_,i)=>i+1).map(m=><option key={m} value={m}>{m}月</option>)}</select>
                                </>
                            )}
                            {listMode === 'week' && <input type="date" value={listWeekDate} onChange={(e) => setListWeekDate(e.target.value)} className={`px-2 py-1.5 rounded-lg border text-xs ${darkMode ? 'bg-slate-800' : 'bg-white'}`} />}
                        
                            <div className="flex-1"></div>
                            
                            {isAdmin && (
                                <>
                                    <button onClick={handleDownloadTemplate} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg" title="下載匯入範本">
                                        <FileSpreadsheet className="w-4 h-4"/>
                                    </button>
                                    <label className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer flex items-center" title="匯入Excel">
                                        <Upload className="w-4 h-4"/>
                                        <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} className="hidden" />
                                    </label>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {isSelectionMode && selectedIds.length > 0 && (
                    <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2">
                        <span className="text-xs font-bold text-blue-600 ml-2">已選 {selectedIds.length} 筆</span>
                        <div className="flex gap-2">
                            {/* 多選模式的廣播按鈕保留，供批量操作 */}
                            {selectedIds.length === 1 && <button onClick={() => onBroadcast(selectedIds[0], true)} className="px-3 py-1 bg-purple-600 text-white text-xs rounded font-bold">廣播</button>}
                            {isAdmin && <button onClick={() => { onBatchDelete(selectedIds); setSelectedIds([]); }} className="px-3 py-1 bg-red-600 text-white text-xs rounded font-bold">刪除</button>}
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 space-y-3">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <div className="bg-gray-100 dark:bg-slate-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Search className="w-8 h-8 opacity-50"/>
                        </div>
                        <p>找不到符合條件的資料</p>
                    </div>
                ) : (
                    filteredCustomers.map((customer, index) => {
                        const isRental = customer.category.includes('出租');
                        const currentGroupKey = getGroupKey(customer);
                        const prevGroupKey = index > 0 ? getGroupKey(filteredCustomers[index - 1]) : null;
                        const showGroupHeader = sortMode !== 'date' && currentGroupKey !== prevGroupKey;
                        const isGroupExpanded = expandedGroups[currentGroupKey] || (searchTerm !== '');

                        return (
                            <React.Fragment key={customer.id}>
                                {showGroupHeader && (
                                    <div 
                                        className="flex items-center gap-2 mt-4 mb-2 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800 rounded p-1"
                                        onClick={() => toggleGroup(currentGroupKey)}
                                    >
                                        {isGroupExpanded ? <ChevronDown className="w-4 h-4 text-gray-500"/> : <ChevronRight className="w-4 h-4 text-gray-500"/>}
                                        {getGroupIcon()}
                                        <h3 className="font-bold text-sm text-gray-700 dark:text-gray-300">
                                            {currentGroupKey} ({getGroupCount(currentGroupKey)})
                                        </h3>
                                        <div className="h-px bg-gray-200 dark:bg-slate-700 flex-1"></div>
                                    </div>
                                )}

                                {(isGroupExpanded || sortMode === 'date') && (
                                    <div 
                                        onClick={() => handleCardClick(customer)}
                                        onTouchStart={() => handleTouchStart(customer.id)}
                                        onTouchEnd={handleTouchEnd}
                                        onMouseDown={() => handleTouchStart(customer.id)}
                                        onMouseUp={handleTouchEnd}
                                        className={`relative bg-white dark:bg-slate-900 p-4 rounded-2xl border transition-all active:scale-[0.99] cursor-pointer select-none animate-in fade-in slide-in-from-top-1 
                                            ${isBroadcastMode ? 'border-purple-400 ring-1 ring-purple-300 hover:bg-purple-50' : 
                                              selectedIds.includes(customer.id) ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : 
                                              'border-gray-100 dark:border-slate-800 hover:shadow-md'}`}
                                    >
                                        {isSelectionMode && (
                                            <div className="absolute top-4 right-4 pointer-events-none">
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${selectedIds.includes(customer.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300 dark:border-slate-600'}`}>
                                                    {selectedIds.includes(customer.id) && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* 廣播模式下的圖示 */}
                                        {isBroadcastMode && (
                                            <div className="absolute top-4 right-4">
                                                <Megaphone className="w-5 h-5 text-purple-500"/>
                                            </div>
                                        )}

                                        <div className="flex items-start gap-4 pr-8">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${['賣方', '出租', '出租方'].includes(customer.category) ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                                                {customer.name?.[0]}
                                            </div>
                                            
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-bold text-lg truncate text-gray-900 dark:text-white">{customer.name}</h3>
                                                    <StatusBadge status={customer.status} category={customer.category} />
                                                </div>
                                                
                                                <div className="flex flex-col gap-1 text-sm text-gray-500 dark:text-gray-400">
                                                    {['賣方', '出租', '出租方'].includes(customer.category) ? (
                                                        <div className="font-medium text-gray-700 dark:text-gray-300">{customer.caseName || '未命名案件'}</div>
                                                    ) : (
                                                        <div className="flex items-center gap-1"><MapPin className="w-3 h-3"/> {customer.reqRegion || '未指定區域'}</div>
                                                    )}

                                                    <div className="text-xs font-mono text-blue-500 font-bold">
                                                        {['賣方', '出租', '出租方'].includes(customer.category) ? 
                                                            `開價 ${customer.totalPrice || 0} ${isRental ? '元' : '萬'}` : 
                                                            `預算 ${customer.value || 0} ${isRental ? '元' : '萬'}`
                                                        }
                                                    </div>

                                                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-dashed border-gray-200 dark:border-slate-800">
                                                        <span className="text-[10px] bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded">{customer.ownerName}</span>
                                                        <span className="text-[10px] opacity-70">{customer.lastContact}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </React.Fragment>
                        );
                    })
                )}
            </div>
            
            {isSelectionMode && (
                <button 
                    onClick={toggleSelect}
                    className="fixed bottom-20 right-4 bg-white dark:bg-slate-800 p-3 rounded-full shadow-xl border dark:border-slate-700 z-30"
                >
                    {selectedIds.length === filteredCustomers.length && filteredCustomers.length > 0 ? <CheckCircle className="w-6 h-6 text-blue-600"/> : <div className="w-6 h-6 rounded-full border-2 border-gray-400"></div>}
                </button>
            )}
        </div>
    );
};

export default ClientsView;