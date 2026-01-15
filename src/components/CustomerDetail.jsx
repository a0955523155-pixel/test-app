import React from 'react';
import { X, UserCircle, Phone, Building2, MapPin, Edit, Trash2, StickyNote, Plus, Trash, CheckCircle, Calculator, Clock, Calendar, CreditCard } from 'lucide-react';
import { formatDateString } from '../utils/helpers';

const CustomerDetail = ({ customer, currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode, onQuickUpdate }) => {
    const [noteInput, setNoteInput] = React.useState('');
    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);

    const handleSubmitNote = (e) => { e.preventDefault(); if (!noteInput.trim()) return; onAddNote(customer.id, noteInput); setNoteInput(''); };

    // 處理狀態切換 (委託續約)
    const handleToggleStatus = (field) => { if(onQuickUpdate) { onQuickUpdate(customer.id, { [field]: !customer[field] }); } };

    // 處理代書款項狀態切換 (陣列)
    const handleTogglePayment = (idx) => {
        if(onQuickUpdate && customer.scribeDetails) {
            const updated = [...customer.scribeDetails];
            updated[idx].isPaid = !updated[idx].isPaid;
            onQuickUpdate(customer.id, { scribeDetails: updated });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
            <div className={`rounded-2xl shadow-2xl w-full max-w-5xl my-10 flex flex-col max-h-[90vh] ${darkMode ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}>
                <div className={`flex justify-between items-start p-6 border-b ${darkMode ? 'border-slate-800 bg-slate-900' : 'bg-gray-50 border-gray-100'} rounded-t-2xl`}>
                    <div className="flex gap-5 items-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold ${isSeller ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>{customer.name?.[0]}</div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-gray-900'}`}>{isSeller ? (customer.caseName || customer.name) : customer.name}</h2>
                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${isSeller ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>{customer.category}</span>
                                <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded text-xs font-bold">{customer.status}</span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                <span className="flex items-center gap-1"><UserCircle className="w-4 h-4"/> {customer.ownerName}</span>
                                <span className="flex items-center gap-1"><Phone className="w-4 h-4"/> {customer.phone}</span>
                                {isSeller ? (<span className="flex items-center gap-1 font-bold text-orange-500"><MapPin className="w-4 h-4"/> {customer.landNo || customer.reqRegion}</span>) : (<span className="flex items-center gap-1"><Building2 className="w-4 h-4"/> {customer.project || customer.company || '未指定案場'}</span>)}
                            </div>
                        </div>
                    </div>
                    <button onClick={onBack} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-800 rounded-full"><X className="w-6 h-6 dark:text-gray-400"/></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className="flex justify-between items-center mb-4">
                                <span className="text-gray-400 font-bold text-sm uppercase tracking-wider">{isSeller ? (customer.category.includes('出租') ? '租金' : '開價') : '預算'}</span>
                                {isSeller && <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">單價: {customer.unitPrice || '-'} 元/坪</span>}
                            </div>
                            <div className="text-4xl font-black text-blue-600">
                                {isSeller ? customer.totalPrice : customer.value?.toLocaleString()} 
                                <span className="text-lg text-gray-400 ml-1">{isSeller && customer.category.includes('出租') ? '元' : '萬'}</span>
                            </div>
                            
                            {/* 委託/代書資訊區 */}
                            <div className="mt-4 pt-4 border-t dark:border-slate-600 space-y-4">
                                {isSeller && customer.commissionEndDate && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                                        <div className="text-xs font-bold text-yellow-700 mb-2 flex items-center gap-1"><Calendar className="w-3 h-3"/> 委託期限</div>
                                        <div className="text-sm mb-1">{customer.commissionStartDate || '?'} ~ {customer.commissionEndDate}</div>
                                        <label className="flex items-center gap-2 cursor-pointer mt-2"><input type="checkbox" checked={customer.isRenewed || false} onChange={() => handleToggleStatus('isRenewed')} className="w-4 h-4 text-yellow-600 rounded"/><span className="text-sm font-bold text-gray-600 dark:text-gray-300">已續約</span></label>
                                    </div>
                                )}
                                {!isSeller && customer.scribeDetails && customer.scribeDetails.length > 0 && (
                                    <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-900/30">
                                        <div className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><CreditCard className="w-3 h-3"/> 代書款項列表</div>
                                        <div className="space-y-2">
                                            {customer.scribeDetails.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-blue-200 pb-1 last:border-0">
                                                    <div>
                                                        <span className="font-bold">{item.item}</span> <span className="text-gray-500">({item.method})</span>
                                                        <div className="text-xs text-red-500">期限: {item.payDate}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold mb-1">{item.amount}</div>
                                                        <label className="flex items-center gap-1 cursor-pointer justify-end"><input type="checkbox" checked={item.isPaid || false} onChange={() => handleTogglePayment(idx)} className="w-3 h-3 text-blue-600 rounded"/><span className="text-xs text-gray-500">已付</span></label>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {isSeller && (
                                <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t dark:border-slate-700">
                                    <div><div className="text-xs text-gray-400 mb-1">土地坪數</div><div className={`text-lg font-bold ${darkMode?'text-white':'text-gray-800'}`}>{customer.landPing || '-'}</div></div>
                                    <div><div className="text-xs text-gray-400 mb-1">建物坪數</div><div className={`text-lg font-bold ${darkMode?'text-white':'text-gray-800'}`}>{customer.buildPing || '-'}</div></div>
                                    <div><div className="text-xs text-gray-400 mb-1">持分坪數</div><div className="text-lg font-bold text-purple-500">{customer.effectivePing || '-'}</div></div>
                                    <div><div className="text-xs text-gray-400 mb-1">屋齡</div><div className="text-lg font-bold text-orange-500">{customer.houseAge || '-'} 年</div></div>
                                    <div><div className="text-xs text-gray-400 mb-1">樓層</div><div className={`text-lg font-bold ${darkMode?'text-white':'text-gray-800'}`}>{customer.floor || '-'}</div></div>
                                    <div><div className="text-xs text-gray-400 mb-1">面寬/深度</div><div className={`text-lg font-bold ${darkMode?'text-white':'text-gray-800'}`}>{customer.faceWidth || '?'} / {customer.depth || '?'}</div></div>
                                </div>
                            )}
                        </div>

                        <div className={`p-6 rounded-2xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-gray-50 border-gray-100'}`}>
                            <h3 className="font-bold text-gray-500 mb-4 flex items-center gap-2"><StickyNote className="w-4 h-4"/> 詳細資料</h3>
                            <div className="whitespace-pre-wrap leading-relaxed text-gray-600 dark:text-gray-300 text-lg">{customer.remarks || "無備註資料"}</div>
                            {isSeller && customer.nearby && (<div className="mt-4 pt-4 border-t dark:border-slate-700"><div className="text-xs font-bold text-gray-400 mb-1">附近機能</div><div className="text-gray-600 dark:text-gray-300">{customer.nearby}</div></div>)}
                            {customer.googleMapUrl && (<a href={customer.googleMapUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 text-blue-500 hover:underline"><MapPin className="w-4 h-4"/> 開啟 Google 地圖</a>)}
                        </div>
                        {customer.photoUrl && (<div className="rounded-2xl overflow-hidden border dark:border-slate-700"><img src={customer.photoUrl} alt="Case" className="w-full h-auto object-cover" /></div>)}
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={onEdit} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors"><Edit className="w-4 h-4"/> 編輯</button>
                            <button onClick={onDelete} className="flex items-center justify-center gap-2 py-3 rounded-xl bg-red-100 text-red-600 font-bold hover:bg-red-200 transition-colors"><Trash2 className="w-4 h-4"/> 刪除</button>
                        </div>
                        <div className={`flex-1 rounded-2xl border flex flex-col overflow-hidden ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-gray-200'}`}>
                            <div className="p-4 border-b dark:border-slate-700 font-bold bg-gray-50 dark:bg-slate-800 text-gray-500">活動紀錄</div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[400px]">
                                {(customer.notes || []).length === 0 ? <p className="text-center text-gray-400 text-sm py-10">尚無紀錄</p> : 
                                    customer.notes.sort((a,b)=>b.id-a.id).map(note => (
                                        <div key={note.id} className="relative pl-4 border-l-2 border-blue-200 dark:border-slate-600 pb-2">
                                            <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-blue-500"></div>
                                            <div className="text-xs text-gray-400 mb-1 flex justify-between"><span>{note.date} · {note.author}</span><button onClick={() => onDeleteNote(customer.id, note)} className="text-red-300 hover:text-red-500"><Trash className="w-3 h-3"/></button></div>
                                            <div className="text-sm dark:text-gray-300">{note.content}</div>
                                        </div>
                                    ))
                                }
                            </div>
                            <form onSubmit={handleSubmitNote} className="p-3 border-t dark:border-slate-700 bg-gray-50 dark:bg-slate-900 flex gap-2"><input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="新增紀錄..." className="flex-1 px-3 py-2 rounded-lg border dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:border-blue-500 text-sm" /><button type="submit" className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5"/></button></form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetail;