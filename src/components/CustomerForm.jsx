import React, { useState, useEffect } from 'react';
import { X, Save, Calculator, MapPin, Image as ImageIcon, Users, FolderOpen, Calendar, CreditCard, Plus, Trash2 } from 'lucide-react';
import { DEFAULT_SOURCES, DEFAULT_CATEGORIES, DEFAULT_LEVELS } from '../config/constants';

const CustomerForm = ({ onSubmit, onCancel, initialData, appSettings, companyProjects, allUsers = [] }) => {
    const [formData, setFormData] = useState(initialData || {
        name: '', phone: '', category: '買方',
        status: 'new', level: 'C', source: '網路廣告',
        project: '', subAgent: '', 
        
        // 案件欄位
        caseName: '', assignedRegion: '', 
        totalPrice: '', unitPrice: '', 
        landNo: '', buildNo: '', landPing: '', buildPing: '', rightsScope: '', effectivePing: '', 
        floor: '', completeDate: '', houseAge: '', roadWidth: '', faceWidth: '', depth: '', schoolDist: '', 
        taxGeneral: '', taxSelf: '', mortgageBank: '', mortgageAmount: '', nearby: '', googleMapUrl: '', photoUrl: '', agents: [], 
        
        // 監控用欄位
        commissionStartDate: '', commissionEndDate: '', 
        scribeDetails: [], // [{ item: '', amount: '', payDate: '', method: '', isPaid: false }]

        caseDate: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0]
    });

    const isCaseMode = ['賣方', '出租', '出租方'].includes(formData.category);
    const isRental = formData.category.includes('出租');
    const projectRegions = Object.keys(companyProjects || {});

    // 1. 屋齡計算
    useEffect(() => {
        if (formData.completeDate) {
            const y = new Date(formData.completeDate).getFullYear();
            const c = new Date().getFullYear();
            if (!isNaN(y)) setFormData(p => ({ ...p, houseAge: (c - y).toString() }));
        }
    }, [formData.completeDate]);

    // 2. 權利範圍與持分坪數
    useEffect(() => {
        setFormData(prev => {
            let eff = prev.landPing; 
            if (prev.landPing && prev.rightsScope) {
                try {
                    let r = 1;
                    if (prev.rightsScope.includes('/')) { const [n, d] = prev.rightsScope.split('/'); r = Number(n)/Number(d); } 
                    else { r = Number(prev.rightsScope); }
                    if (!isNaN(r)) eff = (Number(prev.landPing) * r).toFixed(2);
                } catch (e) {}
            }
            return { ...prev, effectivePing: eff };
        });
    }, [formData.landPing, formData.rightsScope]);

    // 3. 價格連動 (總價 <-> 單價)
    const handleTotalPriceChange = (val) => {
        const total = parseFloat(val);
        const ping = parseFloat(formData.effectivePing) || parseFloat(formData.landPing);
        let newUnit = formData.unitPrice;
        
        if (!isNaN(total) && !isNaN(ping) && ping > 0) {
            if (isRental) {
                // 出租：總價(元) / 坪 = 單價(元)
                newUnit = Math.round(total / ping).toString();
            } else {
                // 買賣：總價(萬) * 10000 / 坪 = 單價(元)
                const raw = (total * 10000) / ping;
                newUnit = (Math.round(raw / 1000) * 1000).toString();
            }
        } else if (val === '') newUnit = '';
        setFormData(prev => ({ ...prev, totalPrice: val, unitPrice: newUnit }));
    };

    const handleUnitPriceChange = (val) => {
        const unit = parseFloat(val);
        const ping = parseFloat(formData.effectivePing) || parseFloat(formData.landPing);
        let newTotal = formData.totalPrice;

        if (!isNaN(unit) && !isNaN(ping) && ping > 0) {
            if (isRental) {
                newTotal = Math.round(unit * ping).toString();
            } else {
                newTotal = Math.round((unit * ping) / 10000).toString();
            }
        } else if (val === '') newTotal = '';
        setFormData(prev => ({ ...prev, unitPrice: val, totalPrice: newTotal }));
    };

    const handleLandPingChange = (val) => {
        setFormData(prev => ({ ...prev, landPing: val }));
        // 觸發 useEffect 重新計算持分，連帶影響價格，這裡先只更新值
    };

    // 4. 代書款項陣列操作
    const addScribeItem = () => {
        setFormData(prev => ({
            ...prev,
            scribeDetails: [...(prev.scribeDetails || []), { item: '', amount: '', payDate: '', method: '', isPaid: false }]
        }));
    };
    const removeScribeItem = (idx) => {
        setFormData(prev => ({ ...prev, scribeDetails: prev.scribeDetails.filter((_, i) => i !== idx) }));
    };
    const handleScribeChange = (idx, field, val) => {
        const updated = [...(formData.scribeDetails || [])];
        updated[idx] = { ...updated[idx], [field]: val };
        setFormData(prev => ({ ...prev, scribeDetails: updated }));
    };

    // 其他 handlers
    const handleImageUpload = (e) => { const f = e.target.files[0]; if (f) { if (f.size > 500*1024) return alert("圖片太大"); const r = new FileReader(); r.onloadend = () => setFormData(p => ({ ...p, photoUrl: r.result })); r.readAsDataURL(f); } };
    const toggleAgent = (n) => { const a = formData.agents || []; setFormData(p => ({ ...p, agents: a.includes(n) ? a.filter(x => x !== n) : [...a, n] })); };
    const handleChange = (e) => { const { name, value } = e.target; setFormData(p => ({ ...p, [name]: value })); };
    const handleSubmit = (e) => { e.preventDefault(); onSubmit(formData); };

    const caseSources = ["網路", "自行開發", "介紹", "同業", "其他"];
    const caseStatuses = [ { val: "new", label: "新案件" }, { val: "contacting", label: "洽談中" }, { val: "commissioned", label: "已收委託" }, { val: "closed", label: "已成交" }, { val: "lost", label: "已無效" } ];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl my-10 border border-gray-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                
                {/* 標頭 */}
                <div className="flex justify-between items-center p-5 border-b dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-t-2xl">
                    <h2 className="text-xl font-bold flex items-center gap-2 dark:text-white">
                        {initialData ? '編輯資料' : '新增資料'}
                        <span className={`text-xs px-2 py-1 rounded-full ${isCaseMode ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isCaseMode ? '案件模式' : '客戶模式'}
                        </span>
                    </h2>
                    <button onClick={onCancel} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5 dark:text-gray-400"/></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar">
                    <form id="customerForm" onSubmit={handleSubmit} className="space-y-6">
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">分類</label>
                                <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-blue-600 focus:ring-2 focus:ring-blue-500 outline-none">
                                    {(appSettings?.categories || DEFAULT_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">{isCaseMode ? '屋主姓名' : '客戶姓名'}</label>
                                <input required name="name" value={formData.name || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="姓名" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">聯絡電話</label>
                                <input name="phone" value={formData.phone || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="09xx-xxx-xxx" />
                            </div>
                        </div>

                        {/* ★★★ 案件模式區塊 (橘色) ★★★ */}
                        {isCaseMode && (
                            <div className="space-y-6 bg-orange-50 dark:bg-orange-900/10 p-4 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1">案件名稱</label>
                                        <input name="caseName" value={formData.caseName || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white font-bold text-lg" placeholder="例如：美術特區景觀三房" />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-xs font-bold text-gray-500 mb-1"><FolderOpen className="inline w-3 h-3"/> 指定歸檔地區資料夾</label>
                                        <select name="assignedRegion" value={formData.assignedRegion || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white">
                                            <option value="">(不歸檔)</option>
                                            {projectRegions.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">地號或門牌</label><input name="landNo" value={formData.landNo || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">建號</label><input name="buildNo" value={formData.buildNo || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border dark:border-slate-700 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2"><Calculator className="w-4 h-4"/> 價格與坪數試算</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div><label className="block text-xs font-bold text-blue-500 mb-1">總價 ({isRental?'元':'萬'})</label><input type="number" name="totalPrice" value={formData.totalPrice || ''} onChange={(e) => handleTotalPriceChange(e.target.value)} className="w-full p-2 rounded-lg border border-blue-200 dark:bg-slate-900 dark:border-blue-900 dark:text-white font-bold text-lg" /></div>
                                        <div><label className="block text-xs font-bold text-green-500 mb-1">單價 (元/坪)</label><input type="number" name="unitPrice" value={formData.unitPrice || ''} onChange={(e) => handleUnitPriceChange(e.target.value)} className="w-full p-2 rounded-lg border border-green-200 dark:bg-slate-900 dark:border-green-900 dark:text-white font-bold" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">土地坪數</label><input type="number" step="0.01" name="landPing" value={formData.landPing || ''} onChange={(e) => handleLandPingChange(e.target.value)} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">建物坪數</label><input type="number" step="0.01" name="buildPing" value={formData.buildPing || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4 mt-3">
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">權利範圍</label><input name="rightsScope" value={formData.rightsScope || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-purple-500 mb-1">持分後坪數</label><input readOnly value={formData.effectivePing || ''} className="w-full p-2 rounded-lg bg-gray-100 dark:bg-slate-700 border-none text-purple-600 font-bold" /></div>
                                    </div>
                                </div>

                                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-100 dark:border-yellow-900/30">
                                    <h3 className="text-sm font-bold text-yellow-700 mb-3 flex items-center gap-2"><Calendar className="w-4 h-4"/> 委託期間 (時效監控用)</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">委託開始日</label><input type="date" name="commissionStartDate" value={formData.commissionStartDate || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                        <div><label className="block text-xs font-bold text-gray-500 mb-1">委託結束日</label><input type="date" name="commissionEndDate" value={formData.commissionEndDate || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-900 dark:border-slate-700 dark:text-white" /></div>
                                    </div>
                                </div>

                                {/* 其他案件欄位 (略為簡化，保留重要) */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">使用樓層</label><input name="floor" value={formData.floor || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">完工日期</label><input type="date" name="completeDate" value={formData.completeDate || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                    <div><label className="block text-xs font-bold text-orange-500 mb-1">屋齡 (年)</label><input readOnly value={formData.houseAge || ''} className="w-full p-2 rounded-lg bg-orange-50 dark:bg-orange-900/30 border-none text-orange-600 font-bold" /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1">學區</label><input name="schoolDist" value={formData.schoolDist || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1"><MapPin className="inline w-3 h-3"/> Google 地圖連結</label><input name="googleMapUrl" value={formData.googleMapUrl || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="http://..." /></div>
                                    <div><label className="block text-xs font-bold text-gray-500 mb-1"><ImageIcon className="inline w-3 h-3"/> 現況照片</label><input type="file" accept="image/*" onChange={handleImageUpload} className="w-full text-xs text-gray-500 file:mr-2 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"/>{formData.photoUrl && <img src={formData.photoUrl} alt="Preview" className="mt-2 h-20 w-auto rounded border" />}</div>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">附近機能或優勢</label><textarea name="nearby" value={formData.nearby || ''} onChange={handleChange} rows="3" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="例如：近捷運、公園首排..." /></div>
                            </div>
                        )}

                        {/* ★★★ 客戶模式區塊 (藍色) ★★★ */}
                        {!isCaseMode && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">預算 (萬)</label><input name="value" value={formData.value || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="輸入數字" /></div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">區域</label><input name="reqRegion" value={formData.reqRegion || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="需求區域" /></div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">有興趣的案場</label>
                                    <select name="project" value={formData.project || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">
                                        <option value="">未選擇</option>
                                        {companyProjects && Object.entries(companyProjects).map(([region, projects]) => (
                                            <optgroup key={region} label={region}>
                                                {Array.isArray(projects) && projects.map(p => <option key={p} value={p}>{p}</option>)}
                                            </optgroup>
                                        ))}
                                    </select>
                                </div>
                                <div><label className="block text-xs font-bold text-gray-500 mb-1">次要專員</label><select name="subAgent" value={formData.subAgent || ''} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm"><option value="">無</option>{allUsers.map(u => <option key={u.id || u.name} value={u.name}>{u.name}</option>)}</select></div>
                                
                                {/* 代書作業 (多筆) */}
                                <div className="col-span-2 md:col-span-3 bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                    <div className="flex justify-between items-center mb-3">
                                        <h3 className="text-sm font-bold text-blue-700 flex items-center gap-2"><CreditCard className="w-4 h-4"/> 代書作業款項 (時效監控用)</h3>
                                        <button type="button" onClick={addScribeItem} className="text-xs bg-blue-600 text-white px-2 py-1 rounded flex items-center gap-1 hover:bg-blue-700"><Plus className="w-3 h-3"/> 新增款項</button>
                                    </div>
                                    <div className="space-y-3">
                                        {formData.scribeDetails && formData.scribeDetails.map((item, idx) => (
                                            <div key={idx} className="flex flex-wrap gap-2 items-end border-b border-blue-200 pb-2">
                                                <div className="flex-1 min-w-[80px]"><label className="text-[10px] text-gray-500">項目</label><input value={item.item || ''} onChange={e=>handleScribeChange(idx,'item',e.target.value)} className="w-full p-1 text-sm border rounded" placeholder="如:簽約款" /></div>
                                                <div className="flex-1 min-w-[80px]"><label className="text-[10px] text-gray-500">金額</label><input value={item.amount || ''} onChange={e=>handleScribeChange(idx,'amount',e.target.value)} className="w-full p-1 text-sm border rounded" /></div>
                                                <div className="flex-1 min-w-[120px]"><label className="text-[10px] text-red-500 font-bold">付款期限</label><input type="date" value={item.payDate || ''} onChange={e=>handleScribeChange(idx,'payDate',e.target.value)} className="w-full p-1 text-sm border rounded" /></div>
                                                <button type="button" onClick={() => removeScribeItem(idx)} className="p-1 text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4"/></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div><label className="block text-xs font-bold text-gray-500 mb-1">備註事項</label><textarea name="remarks" value={formData.remarks || ''} onChange={handleChange} rows="3" className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500" placeholder="更多詳細資訊..." /></div>
                        
                        <div className="grid grid-cols-3 gap-4">
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">來源</label><select name="source" value={formData.source} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{isCaseMode ? caseSources.map(s => <option key={s} value={s}>{s}</option>) : (appSettings?.sources || DEFAULT_SOURCES).map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">狀態</label><select name="status" value={formData.status} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{isCaseMode ? caseStatuses.map(s => <option key={s.val} value={s.val}>{s.label}</option>) : <><option value="new">新客戶</option><option value="contacting">接洽中</option><option value="offer">已收斡</option><option value="closed">已成交</option><option value="lost">已無效</option></>}</select></div>
                             <div><label className="block text-xs font-bold text-gray-500 mb-1">等級</label><select name="level" value={formData.level} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm">{(appSettings?.levels || DEFAULT_LEVELS).map(l => <option key={l} value={l}>{l}</option>)}</select></div>
                        </div>

                        {isCaseMode && formData.status === 'commissioned' && (<div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200"><label className="block text-xs font-bold text-yellow-700 mb-1">委託日期 (確認剩餘時間用)</label><input type="date" name="commissionDate" value={formData.commissionDate || ''} onChange={handleChange} className="w-full p-2 rounded border border-yellow-400" /></div>)}
                        <div><label className="block text-xs font-bold text-gray-500 mb-1">{isCaseMode ? '案件日期' : '建檔日期'}</label><input type="date" name={isCaseMode ? "caseDate" : "createdAt"} value={isCaseMode ? formData.caseDate : (typeof formData.createdAt === 'string' ? formData.createdAt.split('T')[0] : '')} onChange={handleChange} className="w-full p-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white" /></div>
                    </form>
                </div>

                <div className="p-5 border-t dark:border-slate-800 bg-gray-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-end gap-3">
                    <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-xl font-bold text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">取消</button>
                    <button type="submit" form="customerForm" className="px-5 py-2.5 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-transform active:scale-95 flex items-center gap-2">
                        <Save className="w-4 h-4" /> 儲存資料
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CustomerForm;