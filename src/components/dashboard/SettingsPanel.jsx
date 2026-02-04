import React, { useState } from 'react';
import { Plus, Trash2, Megaphone, Save, Users, Tag, Phone } from 'lucide-react';

const SettingsPanel = ({ 
    appSettings, 
    onAddOption, 
    onDeleteOption, 
    announcement, 
    onSaveAnnouncement,
    tempAnnouncement,
    setTempAnnouncement
}) => {
    // 本地輸入狀態
    const [newSource, setNewSource] = useState('');
    
    // 代書專用狀態 (姓名 + 電話)
    const [scrivenerName, setScrivenerName] = useState('');
    const [scrivenerPhone, setScrivenerPhone] = useState('');

    // 通用新增 (字串類，如來源)
    const handleAddSource = () => {
        if (!newSource.trim()) return;
        onAddOption('sources', newSource.trim());
        setNewSource('');
    };

    // ★★★ 代書新增 (物件類) ★★★
    const handleAddScrivener = () => {
        if (!scrivenerName.trim()) {
            alert("請輸入代書姓名");
            return;
        }
        // 傳遞物件格式
        onAddOption('scriveners', { 
            name: scrivenerName.trim(), 
            phone: scrivenerPhone.trim() 
        });
        setScrivenerName('');
        setScrivenerPhone('');
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. 系統公告設定 */}
            <div className="md:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-orange-500"/> 系統跑馬燈公告
                </h3>
                <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-3">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">公告內容</label>
                            <input 
                                type="text" 
                                value={tempAnnouncement.content} 
                                onChange={(e) => setTempAnnouncement({...tempAnnouncement, content: e.target.value})}
                                className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-orange-500"
                                placeholder="輸入要顯示在頂部的跑馬燈內容..."
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    checked={tempAnnouncement.active} 
                                    onChange={(e) => setTempAnnouncement({...tempAnnouncement, active: e.target.checked})}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500" 
                                />
                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">啟用公告</span>
                            </label>
                        </div>
                    </div>
                    <button 
                        onClick={onSaveAnnouncement}
                        className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold flex items-center gap-2 transition-colors mt-6"
                    >
                        <Save className="w-4 h-4"/> 儲存
                    </button>
                </div>
            </div>

            {/* 2. 客戶來源管理 (維持字串) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-blue-500"/> 客戶來源選項
                </h3>
                
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={newSource} 
                        onChange={(e) => setNewSource(e.target.value)}
                        placeholder="新增來源 (如: FB, 介紹...)" 
                        className="flex-1 px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddSource()}
                    />
                    <button 
                        onClick={handleAddSource}
                        className="px-4 py-2 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl font-bold transition-colors"
                    >
                        <Plus className="w-5 h-5"/>
                    </button>
                </div>

                <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
                    {appSettings.sources && appSettings.sources.map((item, idx) => (
                        <div key={idx} className="group flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg text-sm font-medium dark:text-gray-300">
                            {item}
                            <button 
                                onClick={() => onDeleteOption('sources', item)}
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <Trash2 className="w-3.5 h-3.5"/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. 代書名單管理 (改為物件：姓名+電話) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500"/> 代書名單 (Scriveners)
                </h3>
                
                {/* 輸入區：改為兩欄 */}
                <div className="flex gap-2 mb-4">
                    <input 
                        type="text" 
                        value={scrivenerName} 
                        onChange={(e) => setScrivenerName(e.target.value)}
                        placeholder="姓名" 
                        className="flex-[2] px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                    />
                    <input 
                        type="text" 
                        value={scrivenerPhone} 
                        onChange={(e) => setScrivenerPhone(e.target.value)}
                        placeholder="電話" 
                        className="flex-[3] px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none"
                        onKeyDown={(e) => e.key === 'Enter' && handleAddScrivener()}
                    />
                    <button 
                        onClick={handleAddScrivener}
                        className="px-3 py-2 bg-purple-100 text-purple-600 hover:bg-purple-200 rounded-xl font-bold transition-colors"
                    >
                        <Plus className="w-5 h-5"/>
                    </button>
                </div>

                {/* 列表區 */}
                <div className="flex flex-col gap-2 max-h-60 overflow-y-auto custom-scrollbar">
                    {appSettings.scriveners && appSettings.scriveners.map((item, idx) => {
                        // 相容性處理：判斷是物件還是舊的字串
                        const isObject = typeof item === 'object' && item !== null;
                        const name = isObject ? item.name : item;
                        const phone = isObject ? item.phone : '';

                        return (
                            <div key={idx} className="flex justify-between items-center px-4 py-3 bg-gray-50 dark:bg-slate-800 border dark:border-slate-700 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{name}</span>
                                    {phone && (
                                        <span className="text-xs flex items-center gap-1 text-gray-500 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border dark:border-slate-600">
                                            <Phone className="w-3 h-3"/> {phone}
                                        </span>
                                    )}
                                </div>
                                <button 
                                    onClick={() => onDeleteOption('scriveners', item)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg transition-colors"
                                >
                                    <Trash2 className="w-4 h-4"/>
                                </button>
                            </div>
                        );
                    })}
                    {(!appSettings.scriveners || appSettings.scriveners.length === 0) && (
                        <p className="text-gray-400 text-sm italic text-center py-4">尚無代書名單</p>
                    )}
                </div>
            </div>

            <div className="md:col-span-2 text-center text-gray-400 text-xs mt-4">
                系統設定將會即時同步給所有使用者。代書資料設定後，成交報告可自動帶入。
            </div>
        </div>
    );
};

export default SettingsPanel;