import React, { useState } from 'react';
import { X, Phone, MapPin, Wrench, Plus, Trash2, Edit, Save, XCircle, FileText } from 'lucide-react';

const VendorDetailModal = ({ 
    vendor, 
    onClose, 
    onAddNote, 
    onDeleteNote, 
    onEditNote,
    currentUser,
    isAdmin 
}) => {
    const [noteContent, setNoteContent] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editText, setEditText] = useState('');

    // ★★★ 核心：只抓取廠商記事 ★★★
    const vendorNotes = (vendor.notes || []).filter(n => n.type === 'vendor');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        // 強制帶入 'vendor' 類型
        onAddNote(vendor.id, noteContent, 'vendor');
        setNoteContent('');
    };

    const startEdit = (note) => { setEditingId(note.id); setEditText(note.content); };
    const saveEdit = (note) => {
        if (!editText.trim()) return;
        onEditNote(vendor.id, note, editText, 'vendor');
        setEditingId(null);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
                
                {/* Header */}
                <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-black text-gray-800 dark:text-white">{vendor.name}</h2>
                        {vendor.industry && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{vendor.industry}</span>}
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500"/></button>
                </div>

                {/* Body - Scrollable */}
                <div className="p-5 overflow-y-auto flex-1 space-y-6">
                    
                    {/* 1. 廠商基本資料區 */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-lg font-mono font-bold text-blue-600">
                            <Phone className="w-5 h-5"/>
                            {vendor.phone || '無電話'}
                            {vendor.phone && <a href={`tel:${vendor.phone}`} className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded ml-auto">撥打</a>}
                        </div>
                        <div className="flex items-start gap-3 text-gray-600 dark:text-gray-300 text-sm">
                            <MapPin className="w-5 h-5 mt-0.5 flex-shrink-0"/>
                            {vendor.reqRegion || vendor.address || '無地址資訊'}
                        </div>
                        
                        {/* ★★★ 服務項目顯示區 ★★★ */}
                        <div className="bg-purple-50 dark:bg-purple-900/10 p-3 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <div className="text-xs font-bold text-purple-600 mb-1 flex items-center gap-1">
                                <Wrench className="w-3.5 h-3.5"/> 服務項目 / 廠商資訊
                            </div>
                            <div className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-wrap leading-relaxed">
                                {vendor.vendorInfo || "未填寫服務項目"}
                            </div>
                        </div>
                    </div>

                    {/* 2. 記事本區 */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-500 mb-3 flex items-center gap-2">
                            <FileText className="w-4 h-4"/> 廠商工作紀錄 ({vendorNotes.length})
                        </h3>

                        {/* 輸入框 */}
                        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
                            <input 
                                value={noteContent} 
                                onChange={e => setNoteContent(e.target.value)} 
                                placeholder="新增廠商紀錄..." 
                                className="flex-1 px-3 py-2 rounded-lg border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <button type="submit" className="bg-purple-600 text-white p-2 rounded-lg hover:bg-purple-700 transition-colors"><Plus className="w-5 h-5"/></button>
                        </form>

                        {/* 列表 */}
                        <div className="space-y-3">
                            {vendorNotes.length === 0 ? (
                                <div className="text-center py-8 text-gray-400 text-sm bg-gray-50 dark:bg-slate-800/50 rounded-lg border border-dashed dark:border-slate-700">
                                    尚無紀錄
                                </div>
                            ) : (
                                [...vendorNotes].reverse().map((note) => (
                                    <div key={note.id} className="p-3 rounded-xl border border-purple-100 bg-white dark:bg-slate-900 dark:border-slate-700 shadow-sm group">
                                        {editingId === note.id ? (
                                            <div className="space-y-2">
                                                <textarea 
                                                    value={editText} 
                                                    onChange={e => setEditText(e.target.value)} 
                                                    className="w-full p-2 text-sm border rounded bg-gray-50 dark:bg-slate-800 dark:text-white"
                                                    rows={2}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => setEditingId(null)} className="p-1 text-gray-500 hover:bg-gray-100 rounded"><XCircle className="w-4 h-4"/></button>
                                                    <button onClick={() => saveEdit(note)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4"/></button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="text-xs font-bold text-purple-600">{note.author}</span>
                                                    <span className="text-[10px] text-gray-400">{note.date}</span>
                                                </div>
                                                <p className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.content}</p>
                                                
                                                {(currentUser?.name === note.author || isAdmin) && (
                                                    <div className="flex justify-end gap-2 mt-2 pt-2 border-t border-dashed border-gray-100 dark:border-slate-800 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                        <button onClick={() => startEdit(note)} className="text-gray-400 hover:text-blue-500"><Edit className="w-3.5 h-3.5"/></button>
                                                        <button onClick={() => { if(confirm('刪除此紀錄？')) onDeleteNote(vendor.id, note, 'vendor'); }} className="text-gray-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5"/></button>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VendorDetailModal;