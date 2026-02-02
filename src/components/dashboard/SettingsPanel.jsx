import React from 'react';
import { Settings, Save, Plus, Trash2, GripVertical, Megaphone, Sparkles } from 'lucide-react';

const SettingsPanel = ({ 
    appSettings, 
    onAddOption, 
    onDeleteOption, 
    onReorderOption, 
    announcement, 
    onSaveAnnouncement,
    tempAnnouncement,    
    setTempAnnouncement  
}) => {
    
    // 處理公告輸入變更
    const handleAnnouncementChange = (field, value) => {
        setTempAnnouncement(prev => ({ ...prev, [field]: value }));
    };

    // AI 產生勉勵語功能
    const generateAiQuote = () => {
        const quotes = [
            "每一筆成交，都源自於不放棄的堅持。",
            "專業是最好的品牌，誠信是最好的行銷。",
            "今天的努力，是為了遇見更好的自己。",
            "不要等待機會，而要創造機會。",
            "服務不是口號，而是每一個細節的用心。",
            "心態決定高度，行動決定未來。",
            "成功的路上並不擁擠，因為堅持的人不多。",
            "唯有熱愛，能抵歲月漫長。",
            "業績治百病，成交解千愁。",
            "想，都是問題；做，才是答案。"
        ];
        // 隨機選一句
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        // 填入內容
        handleAnnouncementChange('content', randomQuote);
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            
            {/* 1. 系統跑馬燈設定 */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-blue-500"/> 系統跑馬燈設定
                </h3>
                
                <div className="space-y-4">
                    {/* 只有內容編輯區塊 */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-gray-500">跑馬燈內容</label>
                            
                            {/* AI 按鈕 */}
                            <button 
                                onClick={generateAiQuote}
                                className="text-xs flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-bold transition-colors"
                            >
                                <Sparkles className="w-3 h-3"/> AI 填入勉勵語
                            </button>
                        </div>
                        
                        <textarea 
                            rows="3"
                            value={tempAnnouncement?.content || ''} 
                            onChange={(e) => handleAnnouncementChange('content', e.target.value)}
                            className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            placeholder="輸入要捲動顯示的文字內容..."
                        />
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={tempAnnouncement?.active || false} 
                                onChange={(e) => handleAnnouncementChange('active', e.target.checked)}
                                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">啟用跑馬燈</span>
                        </label>
                        <div className="flex-1"></div>
                        <button 
                            onClick={onSaveAnnouncement}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg transition-all flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" /> 儲存設定
                        </button>
                    </div>
                </div>
            </div>

            {/* 2. 系統選項管理 (保持不變) */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-6 flex items-center gap-2">
                    <Settings className="w-5 h-5"/> 系統選項管理
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {appSettings && Object.entries(appSettings).map(([key, options]) => (
                        <div key={key} className="space-y-3">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-600 dark:text-gray-400 capitalize">
                                    {key === 'scriveners' ? '承辦代書' : 
                                     key === 'sources' ? '客源管道' : 
                                     key === 'houseTypes' ? '物件型態' : key}
                                </h4>
                                <button 
                                    onClick={() => onAddOption(key)}
                                    className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                                    title="新增選項"
                                >
                                    <Plus className="w-4 h-4"/>
                                </button>
                            </div>
                            <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-2 max-h-60 overflow-y-auto custom-scrollbar space-y-2">
                                {Array.isArray(options) && options.map((opt, idx) => (
                                    <div key={idx} className="group flex items-center gap-2 bg-white dark:bg-slate-700 p-2 rounded-lg border border-gray-100 dark:border-slate-600 shadow-sm">
                                        <GripVertical className="w-4 h-4 text-gray-300 cursor-move" />
                                        <span className="flex-1 text-sm font-bold text-gray-700 dark:text-gray-200">{opt}</span>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => onReorderOption(key, idx, -1)}
                                                disabled={idx === 0}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-gray-400 disabled:opacity-30"
                                            >
                                                ↑
                                            </button>
                                            <button 
                                                onClick={() => onReorderOption(key, idx, 1)}
                                                disabled={idx === options.length - 1}
                                                className="p-1 hover:bg-gray-100 dark:hover:bg-slate-600 rounded text-gray-400 disabled:opacity-30"
                                            >
                                                ↓
                                            </button>
                                            <button 
                                                onClick={() => onDeleteOption(key, opt)}
                                                className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors"
                                            >
                                                <Trash2 className="w-3.5 h-3.5"/>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                {(!options || options.length === 0) && (
                                    <div className="text-center text-gray-400 text-xs py-4">尚無選項</div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;