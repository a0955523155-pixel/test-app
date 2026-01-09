import React, { useState } from 'react';
import { ArrowLeft, Edit, Trash2, FileText, Send, X, AlertTriangle, Users, Clock, AlertOctagon, CheckCircle, XCircle } from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';

// 小元件：狀態標籤 (為了避免依賴循環，直接定義在這裡)
const StatusBadge = ({ status }) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    const Icon = config.icon || Users; // Fallback icon
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${config.color}`}><Icon className="w-3 h-3 mr-1" />{config.label}</span>;
};

const CustomerDetail = ({ customer, currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode }) => {
    const [noteContent, setNoteContent] = useState('');
    const isOwner = customer.owner === currentUser.username;
    const isSuperAdmin = currentUser?.role === 'super_admin';
    const canEdit = isOwner || isSuperAdmin;
    const notes = customer.notes || [];

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    return (
        <div className={`min-h-screen w-full p-4 ${darkMode ? 'dark bg-slate-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
             <div className="w-full space-y-4">
                 <button onClick={onBack} className="flex items-center text-sm text-gray-500 mb-2"><ArrowLeft className="w-4 h-4 mr-1"/> 返回列表</button>
                 <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                     <div className="flex justify-between items-start">
                        <h2 className="text-2xl font-bold">{customer.name}</h2>
                        {canEdit && (
                            <div className="flex gap-2">
                                <button onClick={onEdit} className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 rounded-full"><Edit className="w-5 h-5"/></button>
                                <button onClick={() => setShowDeleteModal(true)} className="p-2 bg-red-50 dark:bg-slate-800 text-red-600 rounded-full"><Trash2 className="w-5 h-5"/></button>
                            </div>
                        )}
                     </div>
                     <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <p><span className="text-gray-400 mr-2">電話:</span> {customer.phone}</p>
                        <p><span className="text-gray-400 mr-2">案場:</span> {customer.project}</p>
                        <p><span className="text-gray-400 mr-2">狀態:</span> <StatusBadge status={customer.status}/></p>
                        <p className="md:col-span-2"><span className="text-gray-400 mr-2">備註:</span> {customer.remarks}</p>
                     </div>
                 </div>
                 <div className="p-6 rounded-2xl border shadow-sm bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-800">
                     <h3 className="font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-blue-500"/> 記事本</h3>
                     <div className="flex gap-2 mb-4">
                        <input value={noteContent} onChange={e=>setNoteContent(e.target.value)} className={`flex-1 px-4 py-2 border rounded-xl outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-800 text-white border-slate-700' : 'bg-white text-gray-900 border-gray-300'}`} placeholder="新增記事..." />
                        <button onClick={() => { onAddNote(customer.id, noteContent); setNoteContent(''); }} className="bg-blue-600 text-white px-4 rounded-xl active:scale-95 transition-transform"><Send className="w-4 h-4"/></button>
                     </div>
                     <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {notes.slice().reverse().map((n, i) => (
                            <div key={i} className="p-3 rounded-xl bg-gray-50 dark:bg-slate-800/50 text-sm border border-gray-100 dark:border-slate-700 relative group">
                                <div className="flex justify-between text-[10px] opacity-60 mb-1 font-bold">
                                    <span>{n.author}</span>
                                    <span>{n.date}</span>
                                </div>
                                <p className="whitespace-pre-wrap pr-6">{n.content}</p>
                                {canEdit && (
                                    <button 
                                        onClick={() => onDeleteNote(customer.id, n)}
                                        className="absolute top-2 right-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                     </div>
                 </div>
             </div>
             {showDeleteModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
                    <div className="w-full max-w-sm p-6 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8"/></div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">確認刪除客戶</h3>
                            <p className="text-sm text-gray-500 mt-1">此操作無法復原，記事內容也將被刪除。</p>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 rounded-xl font-bold">取消</button>
                            <button onClick={onDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-600/30">刪除</button>
                        </div>
                    </div>
                </div>
             )}
        </div>
    );
};

export default CustomerDetail;