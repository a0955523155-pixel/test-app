import React, { useState } from 'react';
import { Monitor, Edit, Trash2, ExternalLink, Plus, MapPin, Save, X } from 'lucide-react';

const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

const AdWallsPanel = ({ adWalls = [], onAddOption, onDeleteOption, companyProjects }) => {
    // 預設表單狀態
    const initialFormState = { 
        city: '高雄市', 
        district: '', 
        road: '', 
        size: '', 
        price: '', 
        expiryDate: '', 
        project: '', 
        googleMapUrl: '' 
    };

    const [form, setForm] = useState(initialFormState);
    const [isEditing, setIsEditing] = useState(false);
    const [editingItem, setEditingItem] = useState(null); // 儲存正在編輯的原始物件

    // ★★★ 核心修正：儲存邏輯 (支援新增與編輯) ★★★
    const handleSave = async () => {
        // 1. 驗證
        if (!form.district || !form.road) return alert("請完整填寫地址 (區域與路名)");
        
        const fullAddress = `${form.city}${form.district}${form.road}`;
        
        const newItem = { 
            ...form, 
            address: fullAddress, // App.js 用 address 來判斷重複
            id: isEditing && editingItem ? editingItem.id : Date.now() 
        };

        try {
            if (isEditing && editingItem) {
                // [編輯模式]
                // 因為 App.js 的 handleAddOption 會擋住重複地址
                // 所以策略是：先刪除舊的 -> 再新增新的 (確保是 Update)
                if (onDeleteOption) {
                    await onDeleteOption('adWalls', editingItem); // 刪除舊資料
                }
                await onAddOption('adWalls', newItem); // 新增新資料
                alert("更新成功！");
            } else {
                // [新增模式]
                // 直接傳遞「單筆物件」，而不是整個列表
                await onAddOption('adWalls', newItem);
            }
            
            resetForm();
        } catch (error) {
            console.error(error);
            alert("操作失敗，請重試");
        }
    };

    const resetForm = () => {
        setForm(initialFormState);
        setIsEditing(false);
        setEditingItem(null);
    };

    const handleEdit = (item) => {
        // 解析地址 (簡單反推)
        let city = item.city || '高雄市';
        let district = item.district || '';
        let road = item.road || '';

        // 如果舊資料沒有詳細欄位，嘗試從 address 解析 (僅作簡單處理)
        if (!district && item.address) {
            if (item.address.includes('高雄市')) city = '高雄市';
            else if (item.address.includes('屏東縣')) city = '屏東縣';
            road = item.address.replace(city, ''); 
        }

        setForm({ 
            city, 
            district, 
            road, 
            size: item.size || '', 
            price: item.price || '', 
            expiryDate: item.expiryDate || '', 
            project: item.project || '', 
            googleMapUrl: item.googleMapUrl || '' 
        });
        setIsEditing(true);
        setEditingItem(item);
        
        // 滾動到編輯區
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async (item) => {
        if (confirm(`確定刪除「${item.address}」嗎？`)) {
            if (onDeleteOption) {
                await onDeleteOption('adWalls', item);
                if (isEditing && editingItem?.id === item.id) resetForm();
            } else {
                alert("錯誤：無法執行刪除 (Missing onDeleteOption)");
            }
        }
    };

    const generateMapLink = () => {
        const fullAddr = `${form.city}${form.district}${form.road}`;
        if (!form.district || !form.road) { alert("請先選擇區域並輸入路名"); return; }
        const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddr)}`;
        setForm({ ...form, googleMapUrl: link });
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* 1. 編輯/新增區塊 */}
            <div className={`p-5 rounded-2xl border transition-all ${isEditing ? 'bg-orange-50 border-orange-200 dark:bg-orange-900/10 dark:border-orange-800' : 'bg-white border-gray-200 dark:bg-slate-900 dark:border-slate-800'}`}>
                <h3 className={`font-bold mb-4 flex items-center gap-2 ${isEditing ? 'text-orange-600' : 'text-gray-800 dark:text-white'}`}>
                    {isEditing ? <Edit className="w-5 h-5"/> : <Plus className="w-5 h-5 text-blue-500"/>}
                    {isEditing ? '編輯廣告牆' : '新增廣告牆'}
                </h3>
                
                <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 font-bold block mb-1">縣市</label>
                            <select value={form.city} onChange={e => setForm({...form, city: e.target.value, district: ''})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none">
                                {Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold block mb-1">區域</label>
                            <select value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none">
                                <option value="">請選擇</option>
                                {REGIONS_DATA[form.city]?.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">詳細位置 (路名/地標)</label>
                        <input value={form.road} onChange={e => setForm({...form, road: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" placeholder="例如: 中正路100號對面" />
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">尺寸</label>
                            <input value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" placeholder="例: 20x30" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">價格</label>
                            <input value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" placeholder="輸入金額" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">到期日</label>
                            <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" />
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 block mb-1">綁定案場</label>
                            <select value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="w-full p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none">
                                <option value="">(無/不綁定)</option>
                                {companyProjects && Object.entries(companyProjects).map(([region, projects]) => (
                                    <optgroup key={region} label={region}>
                                        {Array.isArray(projects) && projects.map(p => (<option key={p} value={p}>{p}</option>))}
                                    </optgroup>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-gray-500 font-bold block mb-1">Google 地圖連結</label>
                        <div className="flex gap-2">
                            <input value={form.googleMapUrl} onChange={e => setForm({...form, googleMapUrl: e.target.value})} className="flex-1 p-2 rounded-lg border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white outline-none" placeholder="https://maps.google.com/..." />
                            <button onClick={generateMapLink} className="px-3 bg-blue-100 text-blue-600 rounded-lg font-bold text-xs hover:bg-blue-200 whitespace-nowrap flex items-center gap-1">
                                <MapPin className="w-3 h-3"/> 生成
                            </button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-2">
                        {isEditing && (
                            <button onClick={resetForm} className="flex-1 bg-gray-200 text-gray-600 p-2.5 rounded-xl font-bold text-sm hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                                <X className="w-4 h-4"/> 取消
                            </button>
                        )}
                        <button onClick={handleSave} className={`flex-1 text-white p-2.5 rounded-xl font-bold text-sm shadow-md transition-colors flex items-center justify-center gap-2 ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            <Save className="w-4 h-4"/> {isEditing ? '儲存變更' : '新增廣告牆'}
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. 列表區塊 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-purple-500"/> 列表 ({adWalls.length})
                </h3>
                
                <div className="space-y-3">
                    {adWalls.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-sm">尚無廣告牆資料</p>
                    ) : (
                        adWalls.map(w => { 
                            const days = w.expiryDate ? Math.ceil((new Date(w.expiryDate) - new Date()) / 86400000) : 999; 
                            const isExpired = days < 0;
                            const isExpiring = days >= 0 && days <= 30;

                            return (
                                <div key={w.id} className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl transition-all bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 ${editingItem?.id === w.id ? 'ring-2 ring-orange-400 bg-orange-50 dark:bg-orange-900/10' : 'hover:shadow-md'}`}>
                                    <div className="flex-1 mb-2 sm:mb-0">
                                        <div className="font-bold flex items-center gap-2 text-gray-800 dark:text-white text-lg">
                                            {w.address} 
                                            {w.googleMapUrl && (
                                                <a href={w.googleMapUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700 bg-blue-50 dark:bg-slate-700 p-1 rounded-full">
                                                    <ExternalLink className="w-3.5 h-3.5"/>
                                                </a>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                                            {w.project && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-bold">{w.project}</span>}
                                            {w.size && <span>尺寸: {w.size}</span>}
                                            {w.price && <span>價格: {w.price}</span>}
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-gray-100 dark:border-slate-700">
                                        <div className={`text-sm font-bold px-3 py-1 rounded-full ${isExpired ? 'bg-red-100 text-red-600' : isExpiring ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {w.expiryDate ? (isExpired ? '已過期' : `剩 ${days} 天`) : '無期限'}
                                        </div>
                                        <div className="flex gap-1">
                                            <button onClick={() => handleEdit(w)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="編輯">
                                                <Edit className="w-4 h-4"/>
                                            </button>
                                            <button onClick={() => handleDelete(w)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="刪除">
                                                <Trash2 className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ); 
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdWallsPanel;