import React, { useState } from 'react';
import { Monitor, Edit, Trash2, ExternalLink } from 'lucide-react';

// ★★★ 修正：直接在此定義區域資料，移除錯誤的 import ★★★
const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

const AdWallsPanel = ({ adWalls, onAddOption, companyProjects }) => {
    const [form, setForm] = useState({ city: '高雄市', district: '', road: '', size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const handleSave = () => {
        if (!form.district || !form.road) return alert("請完整填寫地址");
        const fullAddress = `${form.city}${form.district}${form.road}`;
        let updatedList;
        if (isEditing && editingId) {
            updatedList = adWalls.map(w => w.id === editingId ? { ...form, address: fullAddress, id: editingId } : w);
        } else {
            updatedList = [...adWalls, { ...form, address: fullAddress, id: Date.now() }];
        }
        onAddOption('adWalls', updatedList);
        resetForm();
    };

    const resetForm = () => {
        setForm({ city: '高雄市', district: '', road: '', size: '', price: '', expiryDate: '', project: '', googleMapUrl: '' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEdit = (item) => {
        setForm({ 
            city: item.city || '高雄市', district: item.district || '', road: item.road || '', 
            size: item.size || '', price: item.price || '', expiryDate: item.expiryDate || '', 
            project: item.project || '', googleMapUrl: item.googleMapUrl || '' 
        });
        setIsEditing(true);
        setEditingId(item.id);
    };

    const handleDelete = (id) => {
        if(confirm("確定刪除此廣告牆資料？")) {
            const updated = adWalls.filter(w => w.id !== id);
            onAddOption('adWalls', updated);
            if (id === editingId) resetForm();
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
            <div className="p-4 rounded-2xl border bg-white border-gray-200 dark:bg-slate-800 dark:border-slate-700">
                <h3 className="font-bold mb-4 flex items-center gap-2 dark:text-white"><Monitor className="w-5 h-5 text-blue-500"/> 廣告牆管理</h3>
                
                <div className={`bg-gray-50 dark:bg-slate-900 p-4 rounded-xl mb-4 space-y-3 border ${isEditing ? 'border-orange-400 ring-1 ring-orange-400' : 'border-gray-200 dark:border-slate-700'}`}>
                    {isEditing && <div className="text-xs font-bold text-orange-500 mb-2 flex items-center gap-1"><Edit className="w-3 h-3"/> 正在編輯項目...</div>}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs text-gray-500 font-bold block mb-1">縣市</label>
                            <select value={form.city} onChange={e => setForm({...form, city: e.target.value, district: ''})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                {Object.keys(REGIONS_DATA).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 font-bold block mb-1">區域</label>
                            <select value={form.district} onChange={e => setForm({...form, district: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                                <option value="">請選擇</option>
                                {REGIONS_DATA[form.city]?.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    </div>
                    <div><label className="text-xs text-gray-500 font-bold block mb-1">路名與詳細位置</label><input value={form.road} onChange={e => setForm({...form, road: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="例如: 中正路100號旁" /></div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <div><label className="text-xs text-gray-500">尺寸</label><input value={form.size} onChange={e => setForm({...form, size: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="10x20" /></div>
                        <div><label className="text-xs text-gray-500">價格</label><input value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="月租" /></div>
                        <div><label className="text-xs text-gray-500">期限</label><input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" /></div>
                        <div><label className="text-xs text-gray-500">綁定案場</label><select value={form.project} onChange={e => setForm({...form, project: e.target.value})} className="w-full p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white"><option value="">(無/不綁定)</option>{companyProjects && Object.entries(companyProjects).map(([region, projects]) => (<optgroup key={region} label={region}>{Array.isArray(projects) && projects.map(p => (<option key={p} value={p}>{p}</option>))}</optgroup>))}</select></div>
                    </div>
                    <div><label className="text-xs text-gray-500 font-bold block mb-1">Google 地圖連結</label><div className="flex gap-2"><input value={form.googleMapUrl} onChange={e => setForm({...form, googleMapUrl: e.target.value})} className="flex-1 p-2 rounded border text-sm bg-white dark:bg-slate-800 dark:border-slate-600 dark:text-white" placeholder="http://..." /><button onClick={generateMapLink} className="px-3 bg-blue-100 text-blue-600 rounded font-bold text-xs hover:bg-blue-200 whitespace-nowrap">📍 轉連結</button></div></div>
                    <div className="flex gap-2">{isEditing && (<button onClick={resetForm} className="flex-1 bg-gray-200 text-gray-600 p-2 rounded font-bold text-sm hover:bg-gray-300">取消</button>)}<button onClick={handleSave} className={`flex-1 text-white p-2 rounded font-bold text-sm shadow-md ${isEditing ? 'bg-orange-500 hover:bg-orange-600' : 'bg-blue-600 hover:bg-blue-700'}`}>{isEditing ? '儲存變更' : '新增廣告牆資料'}</button></div>
                </div>

                <div className="space-y-2">
                    {adWalls.map(w => { 
                        const days = w.expiryDate ? Math.ceil((new Date(w.expiryDate) - new Date()) / 86400000) : 999; 
                        return (
                            <div key={w.id} className={`flex justify-between items-center p-3 border rounded-lg transition-colors bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 ${editingId === w.id ? 'bg-orange-50 border-orange-300' : 'hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                                <div>
                                    <div className="font-bold flex items-center gap-2 dark:text-white">{w.address} <span className="text-xs text-gray-400 font-normal">({w.size})</span>{w.googleMapUrl && (<a href={w.googleMapUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-700"><ExternalLink className="w-4 h-4"/></a>)}</div>
                                    <div className="text-xs text-gray-500">案場: {w.project || '無'} | 價格: {w.price}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`text-xs font-bold mr-2 ${days < 0 ? 'text-red-500' : days < 30 ? 'text-orange-500' : 'text-green-500'}`}>{days < 0 ? '已過期' : `剩 ${days} 天`}</div>
                                    <button onClick={() => handleEdit(w)} className="p-1 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"><Edit className="w-4 h-4"/></button>
                                    <button onClick={() => handleDelete(w.id)} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ); 
                    })}
                </div>
            </div>
        </div>
    );
};

export default AdWallsPanel;