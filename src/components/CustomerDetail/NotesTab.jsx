import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, XCircle, FileText, AlertTriangle } from 'lucide-react';

const NotesTab = ({ 
    customer, 
    currentUser, 
    isAdmin, 
    onAddNote, 
    onDeleteNote, 
    onEditNote, 
    darkMode, 
    activeNoteTab, 
    setActiveNoteTab,
    isVendorIdentity,
    viewMode // 這是從 App.js 傳來的最高指令：'client' 或 'vendor'
}) => {
    const [noteContent, setNoteContent] = useState('');
    const [editNoteId, setEditNoteId] = useState(null);
    const [editNoteText, setEditNoteText] = useState('');
    const [deleteTarget, setDeleteTarget] = useState(null);

    // ★★★ 1. 強制鎖定邏輯 ★★★
    // 確保介面狀態跟隨 viewMode
    useEffect(() => {
        if (viewMode === 'vendor') {
            setActiveNoteTab('vendor');
        }
    }, [viewMode, setActiveNoteTab]);

    // ★★★ 2. 嚴格過濾邏輯 (修正關鍵) ★★★
    const notesDisplay = (customer.notes || []).filter(note => {
        // [最高指導原則]
        // 如果是從「廠商名冊」進來的 (viewMode === 'vendor')
        // 無論 activeNoteTab 狀態為何，強制只回傳 type 為 'vendor' 的資料
        if (viewMode === 'vendor') {
            return note.type === 'vendor';
        }

        // 以下是「客戶名冊」進來的邏輯
        if (activeNoteTab === 'vendor') {
            // 在客戶名冊切換到廠商分頁時
            return note.type === 'vendor';
        } else {
            // 在客戶名冊的客戶回報分頁 (預設)
            // 顯示 type 不是 vendor 的 (包含 client 和 舊資料)
            return note.type !== 'vendor';
        }
    });

    // 新增
    const handleAddNoteSubmit = (e) => { 
        e.preventDefault(); 
        if (!noteContent.trim()) return; 
        
        // 確保新增時的 type 也是正確的
        // 如果是廠商模式，強制 type 為 'vendor'
        const finalType = viewMode === 'vendor' ? 'vendor' : activeNoteTab;
        
        onAddNote(customer.id, noteContent, finalType); 
        setNoteContent(''); 
    };
    
    // 編輯
    const startEditNote = (note) => { setEditNoteId(note.id); setEditNoteText(note.content); };
    const saveEditNote = (note) => { 
        if (!editNoteText.trim()) return; 
        // 編輯時同樣確保 type 正確
        const finalType = viewMode === 'vendor' ? 'vendor' : activeNoteTab;
        onEditNote(customer.id, note, editNoteText, finalType); 
        setEditNoteId(null); 
        setEditNoteText(''); 
    };
    const cancelEditNote = () => { setEditNoteId(null); setEditNoteText(''); };
    
    // 刪除
    const promptDelete = (note) => { setDeleteTarget(note); };
    const confirmDelete = () => {
        if (deleteTarget) {
            const finalType = viewMode === 'vendor' ? 'vendor' : activeNoteTab;
            onDeleteNote(customer.id, deleteTarget, finalType);
            setDeleteTarget(null);
        }
    };

    return (
        <div className="space-y-4 relative">
            <div className="flex items-center justify-between">
                <h3 className="font-bold flex items-center gap-2 text-gray-700 dark:text-gray-300">
                    <FileText className={`w-5 h-5 ${activeNoteTab === 'vendor' ? 'text-purple-600' : 'text-blue-500'}`}/>
                    {/* 標題根據 viewMode 顯示，避免混淆 */}
                    {viewMode === 'vendor' ? '廠商工作紀錄' : (activeNoteTab === 'client' ? '客戶回報紀錄' : '廠商工作紀錄')}
                </h3>
                
                {/* 切換按鈕：只有在「客戶列表」模式下，且該客戶有廠商身分時才顯示 */}
                {/* 廠商列表模式下這裡會隱藏，因為 viewMode === 'vendor' */}
                {viewMode === 'client' && isVendorIdentity && (
                    <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-lg">
                        <button 
                            onClick={() => setActiveNoteTab('client')} 
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeNoteTab === 'client' ? 'bg-white dark:bg-slate-700 shadow text-blue-600 dark:text-white' : 'text-gray-500'}`}
                        >
                            客戶回報
                        </button>
                        <button 
                            onClick={() => setActiveNoteTab('vendor')} 
                            className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${activeNoteTab === 'vendor' ? 'bg-white dark:bg-slate-700 shadow text-purple-600 dark:text-white' : 'text-gray-500'}`}
                        >
                            廠商紀錄
                        </button>
                    </div>
                )}
            </div>

            <form onSubmit={handleAddNoteSubmit} className="flex gap-2 mb-4">
                <input 
                    value={noteContent} 
                    onChange={e => setNoteContent(e.target.value)} 
                    placeholder={viewMode === 'vendor' ? "輸入廠商工作紀錄..." : (activeNoteTab === 'client' ? "輸入客戶回報內容..." : "輸入廠商工作紀錄...")}
                    className={`flex-1 px-4 py-3 rounded-xl border outline-none transition-colors 
                        ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}
                        ${activeNoteTab === 'vendor' || viewMode === 'vendor' ? 'focus:border-purple-500' : 'focus:border-blue-500'}
                    `} 
                />
                <button 
                    type="submit" 
                    className={`px-4 py-2 rounded-xl font-bold text-white transition-colors ${activeNoteTab === 'vendor' || viewMode === 'vendor' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                    <Plus className="w-5 h-5"/>
                </button>
            </form>
            
            <div className="space-y-3">
                {notesDisplay.length === 0 ? (
                    <p className="text-center text-gray-400 py-10 bg-gray-50 dark:bg-slate-800/50 rounded-xl border border-dashed dark:border-slate-700">
                        尚無{viewMode === 'vendor' ? '廠商' : (activeNoteTab === 'client' ? '回報' : '廠商')}紀錄
                    </p>
                ) : (
                    [...notesDisplay].reverse().map((note, idx) => (
                        <div key={note.id || idx} className={`p-4 rounded-xl border ${note.type === 'vendor' ? 'bg-purple-50/30 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800' : (darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200')}`}>
                            {editNoteId === note.id ? (
                                <div>
                                    <textarea value={editNoteText} onChange={(e) => setEditNoteText(e.target.value)} className="w-full p-2 border rounded mb-2 dark:bg-slate-800 dark:text-white" rows={3}/>
                                    <div className="flex justify-end gap-2">
                                        <button onClick={cancelEditNote} className="px-3 py-1 bg-gray-200 rounded text-sm text-gray-700 hover:bg-gray-300"><XCircle className="w-4 h-4"/></button>
                                        <button onClick={() => saveEditNote(note)} className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center gap-1 hover:bg-green-700"><Save className="w-4 h-4"/> 儲存</button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between mb-2">
                                        <span className={`text-xs font-bold ${note.type === 'vendor' ? 'text-purple-600' : 'text-blue-500'}`}>{note.author}</span>
                                        <span className="text-xs text-gray-400">{note.date}</span>
                                    </div>
                                    <p className="text-sm whitespace-pre-wrap dark:text-gray-200">{note.content}</p>
                                    {(currentUser?.name === note.author || isAdmin) && (
                                        <div className="flex justify-end mt-3 gap-3 border-t pt-2 dark:border-slate-700">
                                            <button onClick={() => startEditNote(note)} className="text-gray-400 hover:text-blue-500 p-1 flex items-center gap-1 text-xs transition-colors"><Edit className="w-4 h-4"/> 編輯</button>
                                            <button onClick={() => promptDelete(note)} className="text-gray-400 hover:text-red-500 p-1 flex items-center gap-1 text-xs transition-colors"><Trash2 className="w-4 h-4"/> 刪除</button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            {deleteTarget && (
                <div className="fixed inset-0 z-[60] bg-black/60 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-xs shadow-2xl border-2 border-red-500 transform scale-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-3"><AlertTriangle className="w-8 h-8 text-red-600" /></div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">確定刪除此紀錄？</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 bg-gray-50 dark:bg-slate-800 p-2 rounded w-full">"{deleteTarget.content.substring(0, 20)}..."</p>
                            <div className="flex gap-2 w-full">
                                <button onClick={() => setDeleteTarget(null)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300">取消</button>
                                <button onClick={confirmDelete} className="flex-1 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 shadow-md">確認刪除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotesTab;