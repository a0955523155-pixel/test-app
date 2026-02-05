import React, { useState, useEffect } from 'react';
import { 
    X, Save, Calculator, MapPin, Image as ImageIcon, Users, FolderOpen, Calendar, 
    CreditCard, Plus, Trash2, Warehouse, AlertCircle, Building, UserCheck, Briefcase, 
    Tag, Map, Navigation, Layout, Grid, FileText, Edit, Wand2, Sparkles
} from 'lucide-react';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore'; 
import { appId, DEFAULT_SOURCES, DEFAULT_CATEGORIES, DEFAULT_LEVELS } from '../config/constants';

// --- 1. 常數定義 (保留下拉選單群組) ---
const INDUSTRY_GROUPS = [
    { label: "S大類 - 其他服務業", options: ["汽車維修及美容業", "機車維修業", "個人及家庭用品維修", "洗衣業", "美髮及美容美體業", "殯葬服務業"] },
    { label: "F/H類 - 營建與居住", options: ["營建工程業", "房屋修繕/裝潢設計", "機電/電信/電路", "水電/消防/空調", "清潔/環保/廢棄物", "搬家/運輸/倉儲", "保全/樓管服務"] },
    { label: "A/C類 - 農林漁牧製造", options: ["農林漁牧業", "食品及飼料製造業", "金屬/機械製造業", "電子/電力設備製造", "印刷/資料儲存媒體"] },
    { label: "G類 - 批發零售", options: ["農畜水產品批發", "食品什貨批發", "建材/五金批發", "汽機車零配件零售", "綜合零售 (超商/賣場)", "無店面零售 (網拍)"] },
    { label: "專業服務", options: ["金融/保險/代書", "不動產服務業", "法律/會計/顧問", "廣告/設計/行銷", "資訊/軟體/通訊", "醫療/保健/生技", "住宿/餐飲業", "教育/補習/培訓"] }
];

// --- 2. 智慧辨識引擎 (加強版) ---
const detectIndustry = (inputText) => {
    if (!inputText) return [];

    const text = inputText.toLowerCase();
    const suggestions = new Set();

    // 定義行業別與關鍵字映射表 (包含洗選蛋邏輯)
    const MAPPINGS = [
        {
            category: "農林漁牧業",
            keywords: ["蛋", "雞", "鴨", "鵝", "畜", "牧", "農", "養殖", "飼料", "肥料", "植", "花", "果", "菜", "豬", "牛", "羊", "魚", "蝦", "洗選", "肉品", "屠宰", "種"]
        },
        {
            category: "食品及飼料製造業", // 對應工廠/製造
            keywords: ["食品", "飼料", "加工", "冷凍", "調理", "飲料", "糖", "烘焙", "點心", "蛋糕"]
        },
        {
            category: "住宿/餐飲業",
            keywords: ["食", "餐", "飲", "飯", "麵", "茶", "咖啡", "酒", "雞排", "早餐", "小吃", "餐廳", "飯店"]
        },
        {
            category: "食品什貨批發", // 對應批發
            keywords: ["商行", "百貨", "超市", "賣場", "批發", "零售", "雜貨", "生鮮", "水果", "蔬菜"]
        },
        {
            category: "金屬/機械製造業",
            keywords: ["工廠", "製造", "加工", "金屬", "塑膠", "橡膠", "電子", "機械", "設備", "零件", "模具", "鋼", "鐵", "鋁", "五金", "CNC", "車床"]
        },
        {
            category: "營建工程業",
            keywords: ["營造", "建設", "工程", "土木", "建築", "蓋房子"]
        },
        {
            category: "房屋修繕/裝潢設計",
            keywords: ["裝潢", "設計", "室內", "油漆", "木工", "磁磚", "防水", "門窗", "玻璃"]
        },
        {
            category: "水電/消防/空調",
            keywords: ["水電", "冷氣", "空調", "消防", "管線"]
        },
        {
            category: "搬家/運輸/倉儲",
            keywords: ["貨運", "物流", "快遞", "搬家", "交通", "運輸", "倉儲", "報關", "海運", "空運", "車隊", "配送"]
        },
        {
            category: "汽車維修及美容業",
            keywords: ["汽車", "修車", "保養", "輪胎", "板金", "烤漆", "美容", "洗車"]
        },
        {
            category: "醫療/保健/生技",
            keywords: ["診所", "醫院", "藥", "醫材", "生技", "護理", "長照", "保健", "化工"]
        }
    ];

    // 進行比對
    MAPPINGS.forEach(group => {
        if (group.keywords.some(keyword => text.includes(keyword))) {
            suggestions.add(group.category);
        }
    });

    return Array.from(suggestions);
};

const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

// 圖片壓縮函式
const compressImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxWidth = 1024; 
                const scaleSize = maxWidth / img.width;
                const width = img.width > maxWidth ? maxWidth : img.width;
                const height = img.width > maxWidth ? img.height * scaleSize : img.height;
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
            img.onerror = (error) => reject(error);
        };
        reader.onerror = (error) => reject(error);
    });
};

const CustomerForm = ({ onSubmit, onCancel, initialData, appSettings, companyProjects, allUsers = [], currentUser, customers = [] }) => {
    // 表單狀態
    const [formData, setFormData] = useState({
        name: '', phone: '', category: '買方',
        status: 'new', level: 'C', source: '網路廣告',
        project: [], // 案場陣列
        subAgent: '', assignedAgent: '', 
        
        industry: '', vendorCity: '高雄市', vendorDistrict: '', serviceItems: '', 
        
        road: '', houseNumber: '', landSection: '', landNumber: '',
        photoUrl: '', imgCadastral: '', imgRoute: '', imgLocation: '', imgPlan: '',

        minPing: '', maxPing: '', targetPropertyType: '', 
        caseName: '', assignedRegion: '', reqRegion: '', 
        propertyType: '', totalPrice: '', unitPrice: '', 
        landPing: '', buildPing: '', rightsScope: '', effectivePing: '', 
        
        floor: '', totalFloor: '', 
        
        completeDate: '', houseAge: '', roadWidth: '', faceWidth: '', depth: '', schoolDist: '', 
        taxGeneral: '', taxSelf: '', mortgageBank: '', mortgageAmount: '', nearby: '', googleMapUrl: '', agents: [], 
        commissionStartDate: '', commissionEndDate: '', scribeDetails: [], 
        caseDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0]
    });

    // UI 輔助狀態
    const [selectedIndustries, setSelectedIndustries] = useState([]);
    const [industryInput, setIndustryInput] = useState(''); 
    const [showRegionModal, setShowRegionModal] = useState(false); 
    const [showProjectModal, setShowProjectModal] = useState(false); 
    const [isCompressing, setIsCompressing] = useState(false);

    // 計算屬性
    const isCaseMode = ['賣方', '出租', '出租方'].includes(formData.category);
    const isRental = formData.category.includes('出租');
    const projectRegions = Object.keys(companyProjects || {});
    const PROPERTY_TYPES = ["一般住宅", "透天", "大樓/華廈", "工業地", "農地", "建地", "廠房", "商辦", "店面", "其他"];

    // 日期安全轉換
    const safeDateStr = (dateVal) => {
        if (!dateVal) return new Date().toISOString().split('T')[0];
        try {
            if (dateVal.toDate && typeof dateVal.toDate === 'function') return dateVal.toDate().toISOString().split('T')[0];
            if (dateVal instanceof Date) return dateVal.toISOString().split('T')[0];
            if (typeof dateVal === 'string') return dateVal.split('T')[0];
        } catch (e) {
            console.error("Date parse error", e);
        }
        return new Date().toISOString().split('T')[0];
    };

    // 載入初始資料
    useEffect(() => {
        if (initialData) {
            let loadedProjects = [];
            if (initialData.project) {
                if (Array.isArray(initialData.project)) {
                    loadedProjects = initialData.project;
                } else if (typeof initialData.project === 'string' && initialData.project.trim()) {
                    loadedProjects = initialData.project.split(',').map(p => p.trim()).filter(Boolean);
                }
            }

            if (initialData.industry) {
                setSelectedIndustries(initialData.industry.split(',').filter(s => s.trim()));
            } else {
                setSelectedIndustries([]);
            }

            setFormData({
                ...initialData,
                project: loadedProjects,
                createdAt: safeDateStr(initialData.createdAt),
                caseDate: safeDateStr(initialData.caseDate),
                totalFloor: initialData.totalFloor || '',
                vendorCity: initialData.vendorCity || '高雄市'
            });
        }
    }, [initialData]);

    // 同步 selectedIndustries 到 formData.industry
    useEffect(() => { 
        setFormData(prev => ({ ...prev, industry: selectedIndustries.join(',') })); 
    }, [selectedIndustries]);

    // ★★★ 監聽廠商資訊輸入，自動辨識 ★★★
    useEffect(() => {
        // 如果使用者輸入了服務項目 (且目前沒有選任何行業，或想自動增加)
        if (formData.serviceItems) {
            const results = detectIndustry(formData.serviceItems);
            if (results.length > 0) {
                // 自動將辨識結果加入 selectedIndustries (不重複)
                setSelectedIndustries(prev => {
                    const newSet = new Set([...prev, ...results]);
                    return Array.from(newSet);
                });
            }
        }
    }, [formData.serviceItems]);

    // 自動計算屋齡
    useEffect(() => { if (formData.completeDate) { const y = new Date(formData.completeDate).getFullYear(); const c = new Date().getFullYear(); if (!isNaN(y)) setFormData(p => ({ ...p, houseAge: (c - y).toString() })); } }, [formData.completeDate]);
    // 自動計算持分後坪數
    useEffect(() => { setFormData(prev => { let eff = prev.landPing; if (prev.landPing && prev.rightsScope) { try { let r = 1; if (prev.rightsScope.includes('/')) { const [n, d] = prev.rightsScope.split('/'); r = Number(n)/Number(d); } else { r = Number(prev.rightsScope); } if (!isNaN(r)) eff = (Number(prev.landPing) * r).toFixed(2); } catch (e) {} } return { ...prev, effectivePing: eff }; }); }, [formData.landPing, formData.rightsScope]);

    const handleTotalPriceChange = (val) => { const total = parseFloat(val); const ping = parseFloat(formData.effectivePing) || parseFloat(formData.landPing) || parseFloat(formData.buildPing); let newUnit = formData.unitPrice; if (!isNaN(total) && !isNaN(ping) && ping > 0) newUnit = (total / ping).toFixed(1).replace(/\.0$/, ''); else if (val === '') newUnit = ''; setFormData(prev => ({ ...prev, totalPrice: val, unitPrice: newUnit })); };
    const handleUnitPriceChange = (val) => { const unit = parseFloat(val); const ping = parseFloat(formData.effectivePing) || parseFloat(formData.landPing) || parseFloat(formData.buildPing); let newTotal = formData.totalPrice; if (!isNaN(unit) && !isNaN(ping) && ping > 0) newTotal = (unit * ping).toFixed(0); else if (val === '') newTotal = ''; setFormData(prev => ({ ...prev, unitPrice: val, totalPrice: newTotal })); };
    const handlePingChange = (field, val) => { const ping = parseFloat(val); const total = parseFloat(formData.totalPrice); let newUnit = formData.unitPrice; if (!isNaN(total) && !isNaN(ping) && ping > 0) newUnit = (total / ping).toFixed(1).replace(/\.0$/, ''); setFormData(prev => ({ ...prev, [field]: val, unitPrice: newUnit })); };

    const handleFileUpload = async (e, fieldName) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.type === 'application/pdf') {
            if (file.size > 800 * 1024) return alert("PDF 檔案過大 (請小於 800KB)，建議改傳圖片。");
            const reader = new FileReader();
            reader.onloadend = () => setFormData(p => ({ ...p, [fieldName]: reader.result }));
            reader.readAsDataURL(file);
            return;
        }
        if (file.type.startsWith('image/')) {
            try {
                setIsCompressing(true);
                const compressedDataUrl = await compressImage(file);
                setFormData(p => ({ ...p, [fieldName]: compressedDataUrl }));
                setIsCompressing(false);
            } catch (error) {
                console.error("圖片壓縮失敗", error);
                alert("圖片處理失敗");
                setIsCompressing(false);
            }
            return;
        }
        alert("不支援的檔案格式，請上傳 JPG, PNG 或 PDF");
    };

    const handleRemoveImage = (fieldName) => {
        if (confirm("確定要刪除此圖片/文件嗎？")) {
            setFormData(prev => ({ ...prev, [fieldName]: '' }));
        }
    };

    // ★★★ 手動觸發智慧辨識 ★★★
    const handleSmartIndustryDetect = (textSource) => {
        // 優先使用輸入框文字，若無則使用服務項目，再無則使用名稱
        const text = textSource || industryInput.trim() || formData.serviceItems || formData.name;
        
        if (!text) {
            return alert("請先輸入文字、服務項目或名稱，才能進行辨識");
        }

        const results = detectIndustry(text);
        
        if (results.length > 0) {
            const newAdded = results.filter(r => !selectedIndustries.includes(r));
            if (newAdded.length > 0) {
                setSelectedIndustries(prev => [...prev, ...newAdded]);
                // 如果是透過輸入框觸發，自動填入服務項目
                if (industryInput.trim()) {
                    setFormData(prev => ({ ...prev, serviceItems: prev.serviceItems ? `${prev.serviceItems}, ${industryInput}` : industryInput }));
                    setIndustryInput('');
                }
                // alert(`已自動加入：${newAdded.join(', ')}`); // 選擇性提示
            } else {
                alert("相關行業已在列表中");
            }
        } else {
            // 如果 detectIndustry 沒抓到，嘗試用原本的群組比對 (Fallback)
            let matched = null;
            INDUSTRY_GROUPS.forEach(group => {
                group.options.forEach(opt => {
                    if (text.includes(opt) || opt.includes(text)) matched = opt;
                });
            });
            
            if (matched && !selectedIndustries.includes(matched)) {
                setSelectedIndustries(prev => [...prev, matched]);
                setIndustryInput('');
            } else if (!matched) {
                alert("系統無法辨識相關行業，請手動選擇");
            }
        }
    };

    const addIndustry = (e) => { const val = e.target.value; if (val && !selectedIndustries.includes(val)) setSelectedIndustries([...selectedIndustries, val]); e.target.value = ""; };
    const removeIndustry = (ind) => { setSelectedIndustries(prev => prev.filter(i => i !== ind)); };
    const addScribeItem = () => { setFormData(prev => ({ ...prev, scribeDetails: [...(prev.scribeDetails || []), { item: '', amount: '', payDate: '', method: '', isPaid: false }] })); };
    const removeScribeItem = (idx) => { setFormData(prev => ({ ...prev, scribeDetails: prev.scribeDetails.filter((_, i) => i !== idx) })); };
    const handleScribeChange = (idx, field, val) => { const updated = [...(formData.scribeDetails || [])]; updated[idx] = { ...updated[idx], [field]: val }; setFormData(prev => ({ ...prev, scribeDetails: updated })); };
    const handleChange = (e) => { const { name, value } = e.target; setFormData(prev => { const newData = { ...prev, [name]: value }; if (name === 'category') { const isNowCase = ['賣方', '出租', '出租方'].includes(value); const wasCase = ['賣方', '出租', '出租方'].includes(prev.category); if (isNowCase !== wasCase) newData.status = 'new'; } return newData; }); };
    
    const toggleRegion = (region) => { let current = formData.reqRegion ? formData.reqRegion.split(',').map(s => s.trim()).filter(Boolean) : []; if (current.includes(region)) current = current.filter(r => r !== region); else current.push(region); setFormData({ ...formData, reqRegion: current.join(',') }); };
    const removeRegion = (regionToRemove) => { let current = formData.reqRegion ? formData.reqRegion.split(',').map(s => s.trim()).filter(Boolean) : []; current = current.filter(r => r !== regionToRemove); setFormData({ ...formData, reqRegion: current.join(',') }); };
    const toggleProject = (project) => { let current = Array.isArray(formData.project) ? [...formData.project] : []; if (current.includes(project)) { current = current.filter(p => p !== project); } else { current.push(project); } setFormData({ ...formData, project: current }); };
    const removeProject = (projToRemove) => { setFormData(prev => ({ ...prev, project: (prev.project || []).filter(p => p !== projToRemove) })); };
    const generateMapLink = () => { const addr = (formData.road && formData.houseNumber) ? formData.road + formData.houseNumber : (formData.landSection && formData.landNumber) ? formData.landSection + formData.landNumber : formData.landNo; if (!addr) return alert("請先輸入地址或地號資訊"); const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`; setFormData({ ...formData, googleMapUrl: link }); };
    
    const handleSubmit = async (e) => { e.preventDefault(); if (!initialData && formData.phone && currentUser?.companyCode) { const duplicate = customers.find(c => c.phone === formData.phone); if (duplicate) { try { const db = getFirestore(); await addDoc(collection(db, 'artifacts', appId, 'public', 'system', 'alerts'), { type: 'duplicate_phone', companyCode: currentUser.companyCode, msg: `${currentUser.name} 輸入了重複的電話 (${formData.phone})。原開發者: ${duplicate.ownerName}, 客戶: ${duplicate.name}`, timestamp: serverTimestamp(), agentName: currentUser.name, clientName: formData.name, duplicateId: duplicate.id }); } catch (err) {} } } onSubmit(formData); };

    const caseSources = ["網路", "自行開發", "介紹", "同業", "其他"];
    const caseStatuses = [ { val: "new", label: "新案件" }, { val: "contacting", label: "洽談中" }, { val: "commissioned", label: "已收委託" }, { val: "closed", label: "已成交" }, { val: "lost", label: "已無效" } ];
    const currentRegions = formData.reqRegion ? formData.reqRegion.split(',').map(s => s.trim()).filter(Boolean) : [];

    const renderPreview = (dataUrl) => {
        if (!dataUrl) return null;
        if (dataUrl.startsWith('data:application/pdf')) {
            return (
                <div className="h-full w-full flex flex-col items-center justify-center bg-red-50 rounded border border-red-200">
                    <FileText className="w-8 h-8 text-red-500 mb-1"/>
                    <span className="text-[10px] text-red-600 font-bold">PDF 文件</span>
                </div>
            );
        }
        return <img src={dataUrl} className="h-full w-full object-cover rounded" alt="Preview"/>;
    };

    const renderUploadBox = (label, fieldName, icon) => (
        <div className="text-center relative group">
            <label className="block text-[10px] text-gray-500 mb-1">{label}</label>
            <input type="file" accept="image/*,application/pdf" onChange={(e)=>handleFileUpload(e, fieldName)} className="hidden" id={`img-${fieldName}`}/>
            <label htmlFor={`img-${fieldName}`} className="block w-full h-20 rounded border border-dashed flex items-center justify-center cursor-pointer hover:bg-gray-50 bg-white relative overflow-hidden">
                {formData[fieldName] ? renderPreview(formData[fieldName]) : <div className="text-gray-400">{icon}</div>}
            </label>
            {formData[fieldName] && (
                <button type="button" onClick={(e) => { e.preventDefault(); handleRemoveImage(fieldName); }} className="absolute top-6 right-1 bg-red-500 text-white p-1 rounded-full shadow hover:bg-red-600 z-10" title="刪除"><X size={12} /></button>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl my-10 border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">{initialData ? '編輯資料' : '新增資料'}<span className={`text-xs px-2 py-1 rounded-full ${isCaseMode ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{isCaseMode ? '案件模式' : '客戶模式'}</span></h2>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5 dark:text-gray-400"/></button>
                </div>
                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                        {/* 基本資料 */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">分類</label><select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">{(appSettings?.categories || DEFAULT_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">{isCaseMode ? '屋主姓名' : '客戶姓名'}</label><input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="姓名" /></div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">聯絡電話</label><input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="09xx-xxx-xxx" /></div>
                        </div>

                        {/* 廠商資訊區塊 (含智慧辨識) */}
                        <div className="bg-green-50 dark:bg-green-900/10 p-4 rounded-xl border border-green-100 dark:border-green-900/30">
                            <h3 className="text-sm font-bold text-green-700 dark:text-green-400 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4"/> 配合廠商資訊 (選填)</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">廠商縣市</label>
                                    <select name="vendorCity" value={formData.vendorCity} onChange={(e) => setFormData({...formData, vendorCity: e.target.value, vendorDistrict: ''})} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                        {Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">廠商地區</label>
                                    <select name="vendorDistrict" value={formData.vendorDistrict || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                        <option value="">請選擇區域</option>
                                        {(REGIONS_DATA[formData.vendorCity] || []).map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* ★★★ 智慧行業辨識 UI ★★★ */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">行業別 (可多選)</label>
                                    
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            value={industryInput}
                                            onChange={(e) => setIndustryInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSmartIndustryDetect())}
                                            placeholder="輸入文字 (如: 洗選蛋)"
                                            className="flex-1 p-2 rounded-lg border text-sm dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                        />
                                        <button type="button" onClick={() => handleSmartIndustryDetect()} className="bg-purple-100 text-purple-700 p-2 rounded-lg hover:bg-purple-200 flex items-center gap-1 font-bold text-xs" title="自動辨識行業">
                                            <Sparkles className="w-3 h-3"/> 辨識
                                        </button>
                                    </div>

                                    <div className="space-y-2">
                                        <select onChange={addIndustry} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                            <option value="">或直接選擇...</option>
                                            {INDUSTRY_GROUPS.map((group, gIdx) => (
                                                <optgroup key={gIdx} label={group.label}>
                                                    {group.options.map(opt => (<option key={opt} value={opt} disabled={selectedIndustries.includes(opt)}>{opt}</option>))}
                                                </optgroup>
                                            ))}
                                        </select>
                                        <div className="flex flex-wrap gap-2 min-h-[30px]">
                                            {selectedIndustries.map(ind => (
                                                <span key={ind} className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-md font-bold flex items-center gap-1">
                                                    <Tag className="w-3 h-3"/>{ind}
                                                    <button type="button" onClick={() => removeIndustry(ind)} className="hover:text-red-600"><X className="w-3 h-3"/></button>
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">服務項目細項 (手動/自動填入)</label>
                                    <input name="serviceItems" value={formData.serviceItems || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="例如：洗選蛋加工買賣..." />
                                </div>
                            </div>
                        </div>

                        {/* 案件與買方模式區塊 */}
                        {isCaseMode && (
                            <div className="space-y-6 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1">案件名稱</label><input name="caseName" value={formData.caseName || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-lg" placeholder="例如：美術特區景觀三房" /></div>
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1 flex items-center gap-1"><UserCheck className="w-3 h-3"/> 指定承辦專員 (列印聯絡人)</label><select name="assignedAgent" value={formData.assignedAgent || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">(預設為當前登入者)</option>{allUsers.map(user => (<option key={user.id} value={user.name}>{user.name}</option>))}</select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1"><MapPin className="inline w-3 h-3"/> 物件行政區</label><div onClick={() => setShowRegionModal(true)} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer min-h-[42px]">{formData.reqRegion ? formData.reqRegion : <span className="text-gray-400">點擊選擇...</span>}</div></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1"><FolderOpen className="inline w-3 h-3"/> 歸檔資料夾</label><select name="assignedRegion" value={formData.assignedRegion || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">(不歸檔)</option>{projectRegions.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                                    <div className="md:col-span-2"><label className="block text-xs font-bold text-gray-500 mb-1"><Warehouse className="inline w-3 h-3"/> 物件類型</label><select name="propertyType" value={formData.propertyType || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">未指定</option>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">道路名稱</label><input name="road" value={formData.road || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="XX路" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">門牌號碼</label><input name="houseNumber" value={formData.houseNumber || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="100號" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">地段</label><input name="landSection" value={formData.landSection || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="XX段" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">地號</label><input name="landNumber" value={formData.landNumber || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="0000-0000" /></div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="block text-xs font-bold text-blue-500 mb-1">{isRental ? '租金' : '總價'}</label><input type="number" name="totalPrice" value={formData.totalPrice || ''} onChange={(e) => handleTotalPriceChange(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 dark:bg-slate-900 dark:border-blue-900 dark:text-white font-bold text-lg" /></div>
                                        <div><label className="block text-xs font-bold text-green-500 mb-1">單價</label><input type="number" name="unitPrice" value={formData.unitPrice || ''} onChange={(e) => handleUnitPriceChange(e.target.value)} className="w-full p-2 rounded-lg border border-green-200 dark:bg-slate-900 dark:border-green-900 dark:text-white font-bold" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">土地坪數</label><input type="number" step="0.01" name="landPing" value={formData.landPing || ''} onChange={(e) => handlePingChange('landPing', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">建物坪數</label><input type="number" step="0.01" name="buildPing" value={formData.buildPing || ''} onChange={(e) => handlePingChange('buildPing', e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">權利範圍</label><input name="rightsScope" value={formData.rightsScope || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-purple-500 mb-1">持分後坪數</label><input readOnly value={formData.effectivePing || ''} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-700 border-none text-purple-600 font-bold" /></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">出售樓層 / 總樓層</label>
                                        <div className="flex gap-2">
                                            <input name="floor" value={formData.floor || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="出售" />
                                            <span className="self-center">/</span>
                                            <input name="totalFloor" value={formData.totalFloor || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="總樓" />
                                        </div>
                                    </div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">完工日期</label><input type="date" name="completeDate" value={formData.completeDate || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div><div><label className="block text-xs font-bold text-orange-500 mb-1">屋齡</label><input readOnly value={formData.houseAge || ''} className="w-full p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 border-none text-orange-600 font-bold" /></div><div><label className="block text-xs font-bold text-gray-500 mb-1">學區</label><input name="schoolDist" value={formData.schoolDist || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                </div>
                                
                                {/* 圖片上傳區 */}
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                    {renderUploadBox("封面現況圖", "photoUrl", <ImageIcon className="w-6 h-6"/>)}
                                    {renderUploadBox("地籍圖", "imgCadastral", <Map className="w-6 h-6"/>)}
                                    {renderUploadBox("路線圖", "imgRoute", <Navigation className="w-6 h-6"/>)}
                                    {renderUploadBox("位置圖", "imgLocation", <MapPin className="w-6 h-6"/>)}
                                    {renderUploadBox("規劃圖", "imgPlan", <Layout className="w-6 h-6"/>)}
                                </div>

                                <div><label className="block text-xs font-bold text-gray-500 mb-1"><MapPin className="inline w-3 h-3"/> Google 地圖連結</label><div className="flex gap-1"><input name="googleMapUrl" value={formData.googleMapUrl || ''} onChange={handleChange} className="flex-1 p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm" placeholder="http://..." /><button type="button" onClick={generateMapLink} className="bg-blue-100 text-blue-600 px-3 rounded-lg text-xs font-bold whitespace-nowrap hover:bg-blue-200">📍 轉連結</button></div></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">附近機能或優勢</label><textarea name="nearby" value={formData.nearby || ''} onChange={handleChange} rows="3" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="例如：近捷運、公園首排..." /></div>
                            </div>
                        )}

                        {/* 買方模式區塊 */}
                        {!isCaseMode && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">預算</label><input name="value" value={formData.value || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="輸入數字" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">需求區域</label><div onClick={() => setShowRegionModal(true)} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer min-h-[42px]">{formData.reqRegion ? formData.reqRegion : <span className="text-gray-400">點擊選擇...</span>}</div></div>
                                    
                                    {/* ★ 案場多選觸發按鈕 ★ */}
                                    <div className="col-span-1">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">有興趣案場 (可多選)</label>
                                        <div onClick={() => setShowProjectModal(true)} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white cursor-pointer min-h-[42px] flex flex-wrap gap-1">
                                            {Array.isArray(formData.project) && formData.project.length > 0 ? (
                                                formData.project.map((p, idx) => (
                                                    <span key={idx} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs flex items-center gap-1">{p}<button type="button" onClick={(e) => { e.stopPropagation(); removeProject(p); }}><X className="w-3 h-3"/></button></span>
                                                ))
                                            ) : <span className="text-gray-400">點擊選擇...</span>}
                                        </div>
                                    </div>
                                    
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">次要專員</label><select name="subAgent" value={formData.subAgent || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"><option value="">無</option>{allUsers.map(u => <option key={u.id || u.name} value={u.name}>{u.name}</option>)}</select></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">需求類型</label><select name="targetPropertyType" value={formData.targetPropertyType || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white"><option value="">不限</option>{PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}</select></div>
                                    <div className="col-span-2 md:col-span-3 flex gap-2 items-end"><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">最小坪數</label><input type="number" name="minPing" value={formData.minPing || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Min" /></div><span className="mb-3 text-gray-400">~</span><div className="flex-1"><label className="block text-xs font-bold text-gray-500 mb-1">最大坪數</label><input type="number" name="maxPing" value={formData.maxPing || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="Max" /></div></div>
                                    <div className="col-span-2 md:col-span-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30"><div className="flex justify-between items-center mb-3"><h3 className="text-sm font-bold text-blue-700 flex items-center gap-2"><CreditCard className="w-4 h-4"/> 代書作業款項</h3><button type="button" onClick={addScribeItem} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700"><Plus className="w-3 h-3"/> 新增款項</button></div><div className="space-y-3">{formData.scribeDetails && formData.scribeDetails.map((item, idx) => (<div key={idx} className="flex flex-wrap gap-2 items-end border-b border-blue-200 pb-2"><div className="flex-1 min-w-[80px]"><label className="text-[10px] text-gray-500">項目</label><input value={item.item || ''} onChange={e=>handleScribeChange(idx,'item',e.target.value)} className="w-full p-1 text-sm border rounded" placeholder="如:簽約款" /></div><div className="flex-1 min-w-[80px]"><label className="text-[10px] text-gray-500">金額</label><input value={item.amount || ''} onChange={e=>handleScribeChange(idx,'amount',e.target.value)} className="w-full p-1 text-sm border rounded" /></div><div className="flex-1 min-w-[120px]"><label className="text-[10px] text-red-500 font-bold">付款期限</label><input type="date" value={item.payDate || ''} onChange={e=>handleScribeChange(idx,'payDate',e.target.value)} className="w-full p-1 text-sm border rounded" /></div><button type="button" onClick={() => removeScribeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button></div>))}</div></div>
                                </div>
                            </div>
                        )}

                        {/* 通用資訊 */}
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">備註事項</label><textarea name="remarks" value={formData.remarks || ''} onChange={handleChange} rows="3" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="更多詳細資訊..." /></div>
                        <div className="grid grid-cols-3 gap-4"><div><label className="block text-xs font-bold text-gray-500 mb-1">來源</label><select name="source" value={formData.source} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{isCaseMode ? caseSources.map(s => <option key={s} value={s}>{s}</option>) : (appSettings?.sources || DEFAULT_SOURCES).map(s => <option key={s} value={s}>{s}</option>)}</select></div><div><label className="block text-xs font-bold text-gray-500 mb-1">狀態</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{isCaseMode ? caseStatuses.map(s => <option key={s.val} value={s.val}>{s.label}</option>) : <><option value="new">新客戶</option><option value="contacting">接洽中</option><option value="offer">已收斡</option><option value="closed">已成交</option><option value="lost">已無效</option></>}</select></div><div><label className="block text-xs font-bold text-gray-500 mb-1">等級</label><select name="level" value={formData.level} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{(appSettings?.levels || DEFAULT_LEVELS).map(l => <option key={l} value={l}>{l}</option>)}</select></div></div>
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">{isCaseMode ? '案件日期' : '建檔日期'}</label><input type="date" name={isCaseMode ? "caseDate" : "createdAt"} value={isCaseMode ? formData.caseDate : (typeof formData.createdAt === 'string' ? formData.createdAt.split('T')[0] : '')} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                        {isCompressing && <p className="text-center text-blue-500 font-bold animate-pulse">圖片壓縮處理中...</p>}
                    </form>
                </div>
                <div className="p-5 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3"><button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">取消</button><button type="submit" form="customerForm" className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-2"><Save className="w-4 h-4" /> 儲存資料</button></div>
            </div>

            {/* Region Modal (區域多選) */}
            {showRegionModal && (<div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4"><div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto"><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg dark:text-white">選擇區域</h3><button onClick={() => setShowRegionModal(false)}><X/></button></div><div className="mb-4 flex flex-wrap gap-2">{currentRegions.map((region, idx) => (<span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center gap-1 font-bold">{region}<button onClick={() => removeRegion(region)} className="hover:text-red-500"><X className="w-3 h-3"/></button></span>))}</div><div className="space-y-4">{Object.entries(REGIONS_DATA).map(([city, districts]) => (<div key={city}><h4 className="font-bold text-blue-600 mb-2">{city}</h4><div className="grid grid-cols-3 gap-2">{districts.map(d => (<button key={d} type="button" onClick={() => toggleRegion(d)} className={`text-xs p-2 rounded border ${currentRegions.includes(d) ? 'bg-blue-500 text-white border-blue-500' : 'bg-gray-50 text-gray-700 border-gray-200'}`}>{d}</button>))}</div></div>))}</div><button onClick={() => setShowRegionModal(false)} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-bold">完成</button></div></div>)}
            
            {/* ★ 案場 Modal (多選邏輯) ★ */}
            {showProjectModal && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg p-5 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg dark:text-white">選擇案場 (可多選)</h3><button onClick={() => setShowProjectModal(false)}><X/></button></div>
                        <div className="space-y-4">
                            {companyProjects && Object.entries(companyProjects).map(([region, projects]) => (
                                <div key={region}>
                                    <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-1"><Building className="w-4 h-4"/> {region}</h4>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Array.isArray(projects) && projects.map(p => (
                                            <button key={p} type="button" onClick={() => toggleProject(p)} 
                                                className={`text-xs p-2 rounded border text-left truncate ${formData.project?.includes(p) ? 'bg-purple-600 text-white border-purple-600' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'}`}
                                            >
                                                {p}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowProjectModal(false)} className="w-full mt-4 py-2 bg-blue-600 text-white rounded-lg font-bold">完成</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerForm;