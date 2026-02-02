import React from 'react';
import { UserPlus, User, Edit, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

const UsersPanel = ({ users, isSuperAdmin, onToggleUser, onDeleteUser, onEditUser }) => {
    if (!isSuperAdmin) return <div className="text-center py-10 text-red-500">權限不足</div>;

    return (
        <div className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 rounded-2xl border bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold dark:text-white">人員與權限管理 ({users.length})</h3>
                    <button onClick={() => onEditUser(null)} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 hover:bg-green-700">
                        <UserPlus className="w-4 h-4"/> 新增人員
                    </button>
                </div>
                <div className="space-y-2">
                    {users.map(user => (
                        <div key={user.id} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${user.status === 'suspended' ? 'bg-red-50 border-red-200 dark:bg-red-900/10 dark:border-red-900' : 'bg-gray-50 border-gray-200 dark:bg-slate-900 dark:border-slate-700'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden border border-gray-300">
                                    {user.photoUrl ? <img src={user.photoUrl} className="w-full h-full object-cover"/> : <User className="w-full h-full p-2 text-gray-400"/>}
                                </div>
                                <div>
                                    <div className="font-bold text-sm flex items-center gap-2 dark:text-white">
                                        {user.name} 
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>{user.role}</span>
                                    </div>
                                    <div className="text-xs text-gray-500 font-mono">@{user.username}</div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onEditUser(user)} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg transition-colors" title="編輯資料"><Edit className="w-4 h-4"/></button>
                                <button onClick={() => onToggleUser(user)} className="p-1.5 bg-gray-100 dark:bg-slate-800 rounded hover:bg-gray-200 dark:hover:bg-slate-700" title={user.status==='suspended'?'啟用':'停權'}>{user.status==='suspended'?<ToggleLeft className="text-red-500"/>:<ToggleRight className="text-green-500"/>}</button>
                                <button onClick={() => onDeleteUser(user)} className="p-1.5 bg-red-50 text-red-500 rounded hover:bg-red-100"><Trash2 className="w-4 h-4"/></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default UsersPanel;