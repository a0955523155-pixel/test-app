import React, { useState, useMemo } from 'react';
import { Search, Wrench, User, MapPin } from 'lucide-react';

const REGIONS_DATA = {
    "高雄市": ["楠梓區", "左營區", "鼓山區", "三民區", "苓雅區", "新興區", "前金區", "鹽埕區", "前鎮區", "旗津區", "小港區", "鳳山區", "大寮區", "鳥松區", "林園區", "仁武區", "大樹區", "大社區", "岡山區", "路竹區", "橋頭區", "梓官區", "彌陀區", "永安區", "燕巢區", "田寮區", "阿蓮區", "茄萣區", "湖內區", "旗山區", "美濃區", "六龜區", "甲仙區", "杉林區", "內門區", "茂林區", "桃源區", "那瑪夏區"],
    "屏東縣": ["屏東市", "潮州鎮", "東港鎮", "恆春鎮", "萬丹鄉", "長治鄉", "麟洛鄉", "九如鄉", "里港鄉", "鹽埔鄉", "高樹鄉", "萬巒鄉", "內埔鄉", "竹田鄉", "新埤鄉", "枋寮鄉", "新園鄉", "崁頂鄉", "林邊鄉", "南州鄉", "佳冬鄉", "琉球鄉", "車城鄉", "滿州鄉", "枋山鄉", "三地門鄉", "霧台鄉", "瑪家鄉", "泰武鄉", "來義鄉", "春日鄉", "獅子鄉", "牡丹鄉"]
};

const INDUSTRY_GROUPS = [
    { label: "S大類 - 其他服務業", options: ["汽車維修及美容業", "機車維修業", "個人及家庭用品維修", "洗衣業", "美髮及美容美體業", "殯葬服務業"] },
    { label: "F/H類 - 營建與居住", options: ["營建工程業", "房屋修繕/裝潢設計", "機電/電信/電路", "水電/消防/空調", "清潔/環保/廢棄物", "搬家/運輸/倉儲", "保全/樓管服務"] },
    { label: "A/C類 - 農林漁牧製造", options: ["農林漁牧業", "食品及飼料製造業", "金屬/機械製造業", "電子/電力設備製造", "印刷/資料儲存媒體"] },
    { label: "G類 - 批發零售", options: ["農畜水產品批發", "食品什貨批發", "建材/五金批發", "汽機車零配件零售", "綜合零售 (超商/賣場)", "無店面零售 (網拍/電商)"] },
    { label: "專業服務", options: ["金融/保險/代書", "不動產服務業", "法律/會計/顧問", "廣告/設計/行銷", "資訊/軟體/通訊", "醫療/保健/生技", "住宿/餐飲業", "教育/補習/培訓"] }
];

const VendorsView = ({ customers, currentUser, isAdmin }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedCity, setSelectedCity] = useState('all');
    const [selectedDistrict, setSelectedDistrict] = useState('all');

    const filteredVendors = useMemo(() => {
        return customers.filter(c => {
            if (!c.industry || c.industry.trim() === '') return false;
            
            if (selectedIndustry !== 'all' && !c.industry.includes(selectedIndustry)) return false;

            const regionString = (c.vendorCity || '') + (c.vendorDistrict || '');
            if (selectedCity !== 'all') {
                if (!regionString.includes(selectedCity)) return false;
                if (selectedDistrict !== 'all' && !regionString.includes(selectedDistrict)) return false;
            }

            if (searchTerm) {
                const s = searchTerm.toLowerCase();
                return (
                    c.industry.toLowerCase().includes(s) ||
                    (c.serviceItems && c.serviceItems.toLowerCase().includes(s)) ||
                    c.name.toLowerCase().includes(s) ||
                    c.phone.includes(s)
                );
            }
            return true;
        });
    }, [customers, searchTerm, selectedIndustry, selectedCity, selectedDistrict]);

    return (
        <div className="p-4 space-y-4 pb-24 animate-in fade-in relative">
            {/* ★★★ 修正版面擠壓：增加 z-index 與不透明背景 ★★★ */}
            <div className="sticky top-0 z-30 bg-gray-50 dark:bg-slate-900 pt-2 pb-4 border-b border-gray-200 dark:border-slate-700 shadow-sm">
                <div className="flex items-center px-3 py-2 rounded-lg border bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-600 mb-2">
                    <Wrench className="w-5 h-5 text-gray-400 mr-2" />
                    <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="搜尋：水電、廠商名稱、關鍵字..." className="bg-transparent border-none outline-none w-full text-sm dark:text-white"/>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select value={selectedIndustry} onChange={(e) => setSelectedIndustry(e.target.value)} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                        <option value="all">所有行業</option>
                        {INDUSTRY_GROUPS.map((group, idx) => (<optgroup key={idx} label={group.label}>{group.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}</optgroup>))}
                    </select>
                    <select value={selectedCity} onChange={(e) => { setSelectedCity(e.target.value); setSelectedDistrict('all'); }} className="w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white">
                        <option value="all">所有縣市</option>
                        {Object.keys(REGIONS_DATA).map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    <select value={selectedDistrict} onChange={(e) => setSelectedDistrict(e.target.value)} disabled={selectedCity === 'all'} className={`w-full p-2 rounded-lg border text-sm dark:bg-slate-800 dark:border-slate-600 dark:text-white ${selectedCity === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <option value="all">全區</option>
                        {selectedCity !== 'all' && REGIONS_DATA[selectedCity]?.map(dist => (<option key={dist} value={dist}>{dist}</option>))}
                    </select>
                </div>
            </div>

            {filteredVendors.length === 0 ? (
                <div className="text-center py-20 text-gray-400 border-2 border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3"><Wrench className="w-8 h-8 opacity-50"/></div>
                    <p className="font-bold">找不到符合條件的廠商</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredVendors.map(vendor => {
                        return (
                            <div key={vendor.id} className="p-5 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all flex flex-col justify-between group">
                                <div>
                                    <div className="flex justify-between items-start mb-3">
                                        <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm truncate max-w-[70%]">{vendor.industry}</span>
                                        <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="w-3 h-3"/> {vendor.vendorCity}{vendor.vendorDistrict}</div>
                                    </div>
                                    <h4 className="font-bold text-xl text-gray-800 dark:text-white mb-3 flex items-center gap-2">{vendor.name}</h4>
                                    
                                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-900/50 p-3 rounded-lg mb-1 border border-gray-100 dark:border-slate-700/50 min-h-[60px]">
                                        <span className="font-bold text-xs text-gray-400 block mb-1 uppercase tracking-wider">服務項目</span>
                                        <p className="line-clamp-2">{vendor.serviceItems || '未填寫細項'}</p>
                                    </div>
                                </div>
                                
                                {/* 移除電話顯示，僅保留引薦人 */}
                                <div className="pt-3 mt-3 border-t border-dashed border-gray-200 dark:border-slate-700">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-gray-400">如需服務請洽引薦人</span>
                                        <div className="flex items-center gap-1 text-sm font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg">
                                            <User className="w-4 h-4"/> {vendor.ownerName}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default VendorsView;