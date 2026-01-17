import React, { useState, useMemo } from 'react';
import { 
  X, User, Phone, MapPin, Building2, Calendar, FileText, Trash2, Edit, Plus, ExternalLink, 
  MessageCircle, StickyNote, CheckCircle, Clock, Home, DollarSign, Target, Warehouse, Briefcase
} from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';
import { formatDateString } from '../utils/helpers';

const StatusBadge = ({ status }) => {
    const labelMap = { 'new': '新案件/客戶', 'contacting': '洽談/接洽', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    const label = labelMap[status] || (STATUS_CONFIG[status] || STATUS_CONFIG['new']).label;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{label}</span>;
};

const CustomerDetail = ({ customer, allCustomers = [], currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode, onQuickUpdate }) => {
    const [noteContent, setNoteContent] = useState('');
    const [activeTab, setActiveTab] = useState('info'); 

    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);

    // ★★★ 雙向智慧配對邏輯 (買找案 / 案找人) ★★★
    const matchedObjects = useMemo(() => {
        const safeFloat = (v) => {
            if (!v) return 0;
            const num = parseFloat(String(v).replace(/,/g, ''));
            return isNaN(num) ? 0 : num;
        };

        return allCustomers.filter(item => {
            const itemIsSeller = ['賣方', '出租', '出租方'].includes(item.category);

            // ==========================================
            // 模式 A: 我是買方，我要找案件 (item 是賣方)
            // ==========================================
            if (!isSeller) {
                if (!itemIsSeller) return false; // 只找案件

                // 1. 類別
                if (customer.category.includes('買') && !item.category.includes('賣') && !item.category.includes('售')) return false;
                if (customer.category.includes('租') && !item.category.includes('租')) return false;

                // 2. 區域
                if (customer.reqRegion) {
                    const buyerRegion = customer.reqRegion.trim();
                    const itemRealRegion = item.reqRegion ? item.reqRegion.trim() : '';
                    const itemFolderRegion = item.assignedRegion ? item.assignedRegion.trim() : '';
                    if (itemRealRegion !== buyerRegion && itemFolderRegion !== buyerRegion) return false; 
                }

                // 3. 類型
                if (customer.targetPropertyType && customer.targetPropertyType !== '不限') {
                    if (item.propertyType && item.propertyType !== customer.targetPropertyType) return false;
                    if (!item.propertyType) return false; 
                }

                // 4. 坪數 (案件要在買方需求範圍內)
                const minPing = safeFloat(customer.minPing);
                const maxPing = safeFloat(customer.maxPing);
                if (minPing > 0 || maxPing > 0) {
                    const itemLand = safeFloat(item.landPing);
                    const itemBuild = safeFloat(item.buildPing);
                    const itemSize = Math.max(itemLand, itemBuild);
                    if (minPing > 0 && itemSize < minPing) return false;
                    if (maxPing > 0 && itemSize > maxPing) return false;
                }

                return true;
            }

            // ==========================================
            // 模式 B: 我是賣方(案件)，我要找買方 (item 是買方)
            // ==========================================
            else {
                if (itemIsSeller) return false; // 只找買方

                // 1. 類別
                if (customer.category.includes('賣') && !item.category.includes('買')) return false;
                if (customer.category.includes('租') && !item.category.includes('租')) return false;

                // 2. 區域 (買方想找的區域 必須包含 我的區域)
                if (item.reqRegion) {
                    const buyerWantRegion = item.reqRegion.trim();
                    const myRealRegion = customer.reqRegion ? customer.reqRegion.trim() : '';
                    const myFolderRegion = customer.assignedRegion ? customer.assignedRegion.trim() : '';
                    // 如果買方指定的區域 跟我的實際區域或歸檔區域都不一樣，就不配對
                    if (buyerWantRegion !== myRealRegion && buyerWantRegion !== myFolderRegion) return false;
                }

                // 3. 類型 (買方想找的類型 必須包含 我的類型)
                if (item.targetPropertyType && item.targetPropertyType !== '不限') {
                    if (customer.propertyType && customer.propertyType !== item.targetPropertyType) return false;
                }

                // 4. 坪數 (我的坪數要在買方需求範圍內)
                const buyerMin = safeFloat(item.minPing);
                const buyerMax = safeFloat(item.maxPing);
                if (buyerMin > 0 || buyerMax > 0) {
                    const myLand = safeFloat(customer.landPing);
                    const myBuild = safeFloat(customer.buildPing);
                    const mySize = Math.max(myLand, myBuild);
                    if (buyerMin > 0 && mySize < buyerMin) return false;
                    if (buyerMax > 0 && mySize > buyerMax) return false;
                }

                return true;
            }
        });
    }, [customer, allCustomers, isSeller]);

    const handleAddNoteSubmit = (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        onAddNote(customer.id, noteContent);
        setNoteContent('');
    };

    return (
        <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className={`sticky top-0 z-20 px-4 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold truncate max-w-[200px]">{customer.name}</h1>
                    <StatusBadge status={customer.status} />
                </div>
                <div className="flex gap-2">
                    <button onClick={onEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"><Edit className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>基本資料</button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>回報紀錄 ({customer.notes?.length || 0})</button>
                    <button onClick={() => setActiveTab('match')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow' : 'text-gray-500'}`}>智慧配對 ({matchedObjects.length})</button>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs text-gray-400 block mb-1">聯絡電話</label><div className="flex items-center gap-2 font-mono text-lg font-bold"><Phone className="w-4 h-4 text-blue-500"/> {customer.phone || '未填寫'} <a href={`tel:${customer.phone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">撥打</a></div></div>
                                <div><label className="text-xs text-gray-400 block mb-1">{isSeller ? '案件名稱' : '需求預算'}</label><div className="font-bold text-lg">{isSeller ? customer.caseName : `${customer.value || 0} 萬`}</div></div>
                                
                                {!isSeller && (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求區域</label><div className="font-bold">{customer.reqRegion || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求類型</label><div className="font-bold">{customer.targetPropertyType || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求坪數</label><div className="font-bold">{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</div></div>
                                    </>
                                )}

                                {isSeller && (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">開價</label><div className="text-2xl font-black text-green-500">{customer.totalPrice} <span className="text-sm text-gray-500">萬</span></div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">物件類型</label><div className="font-bold">{customer.propertyType || '未指定'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">地坪/建坪</label><div className="font-bold">{customer.landPing || 0} / {customer.buildPing || 0} 坪</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">所在區域</label><div className="font-bold">{customer.reqRegion || customer.assignedRegion}</div></div>
                                        <div className="md:col-span-2"><label className="text-xs text-gray-400 block mb-1">地址</label><div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> {customer.landNo || '未填寫'}</div></div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddNoteSubmit} className="flex gap-2 mb-4"><input value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="輸入回報內容..." className={`flex-1 px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"><Plus/></button></form>
                        <div className="space-y-3">
                            {(customer.notes || []).length === 0 ? <p className="text-center text-gray-400 py-10">尚無紀錄</p> : 
                            [...customer.notes].reverse().map((note, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-500">{note.author}</span><span className="text-xs text-gray-400">{note.date}</span></div>
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex justify-end mt-2"><button onClick={() => { if(confirm("刪除此紀錄？")) onDeleteNote(customer.id, note); }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'match' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-200 text-sm mb-4">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><Target className="w-4 h-4"/> 配對條件 ({isSeller ? '本案條件' : '需求條件'})</h3>
                            <ul className="list-disc list-inside opacity-80 text-xs">
                                {isSeller ? (
                                    <>
                                        <li>本案區域：{customer.reqRegion || customer.assignedRegion}</li>
                                        <li>本案類型：{customer.propertyType || '未指定'}</li>
                                        <li>本案坪數：地 {customer.landPing} / 建 {customer.buildPing}</li>
                                    </>
                                ) : (
                                    <>
                                        <li>需求區域：{customer.reqRegion || '不限'} (含歸檔區)</li>
                                        <li>需求類型：{customer.targetPropertyType || '不限'}</li>
                                        <li>需求坪數：{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</li>
                                    </>
                                )}
                            </ul>
                        </div>

                        {matchedObjects.length === 0 ? (
                            <div className="text-center py-20 opacity-50">
                                {isSeller ? <User className="w-16 h-16 mx-auto mb-4 text-gray-300"/> : <Home className="w-16 h-16 mx-auto mb-4 text-gray-300"/>}
                                <p>{isSeller ? '目前沒有符合需求的買方' : '目前沒有符合條件的物件'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {matchedObjects.map(obj => (
                                    <div key={obj.id} className={`flex justify-between p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} hover:border-purple-400 transition-colors`}>
                                        {/* 渲染邏輯：根據找到的是「買方」還是「案件」顯示不同內容 */}
                                        {isSeller ? (
                                            // 賣方模式：顯示找到的買方
                                            <>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-blue-100 text-blue-600 px-2 py-0.5 rounded text-xs font-bold">{obj.category}</span>
                                                        <h4 className="font-bold">{obj.name}</h4>
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                                                        <span className="bg-gray-100 dark:bg-slate-800 px-1.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/> {obj.reqRegion || '不限'}</span>
                                                        <span className="bg-gray-100 dark:bg-slate-800 px-1.5 rounded">{obj.targetPropertyType || '不限類型'}</span>
                                                        <span className="flex items-center gap-1"><Briefcase className="w-3 h-3"/> {obj.ownerName}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-blue-500">{obj.value ? `${obj.value}` : '未填'} <span className="text-xs text-gray-400">萬</span></div>
                                                    <div className="text-xs text-gray-400 mt-1">預算</div>
                                                </div>
                                            </>
                                        ) : (
                                            // 買方模式：顯示找到的案件
                                            <>
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="bg-orange-100 text-orange-600 px-2 py-0.5 rounded text-xs font-bold">{obj.category}</span>
                                                        <h4 className="font-bold">{obj.caseName}</h4>
                                                    </div>
                                                    <div className="text-xs text-gray-500 flex flex-wrap gap-2">
                                                        <span className="bg-gray-100 dark:bg-slate-800 px-1.5 rounded">{obj.reqRegion || obj.assignedRegion}</span>
                                                        <span className="bg-gray-100 dark:bg-slate-800 px-1.5 rounded">{obj.propertyType || '未分類'}</span>
                                                        <span>地{obj.landPing} / 建{obj.buildPing}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xl font-black text-green-500">{obj.totalPrice} <span className="text-xs text-gray-400">萬</span></div>
                                                    <div className="text-xs text-gray-400 mt-1">{obj.unitPrice} 萬/坪</div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;