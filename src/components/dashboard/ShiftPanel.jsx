// 檔案路徑：src/components/dashboard/ShiftPanel.jsx

import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Users, ArrowUp, ArrowDown, Save, Download, RefreshCw, CheckCircle } from 'lucide-react';
import { generateSchedule } from '../../utils/shiftHelper';

const WEEKDAYS = [
    { val: 1, label: '週一' }, { val: 2, label: '週二' }, { val: 3, label: '週三' },
    { val: 4, label: '週四' }, { val: 5, label: '週五' }, { val: 6, label: '週六' },
    { val: 0, label: '週日' }
];

const ShiftPanel = ({ allUsers, shiftSettings, onSaveSettings }) => {
    const [roster, setRoster] = useState([]);
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [workDays, setWorkDays] = useState([1, 2, 3, 4, 5, 6, 0]); 
    const [previewDays, setPreviewDays] = useState(30);

    useEffect(() => {
        if (allUsers && allUsers.length > 0) {
            if (shiftSettings?.roster && shiftSettings.roster.length > 0) {
                const savedRoster = shiftSettings.roster.filter(name => allUsers.find(u => u.name === name));
                const newUsers = allUsers.filter(u => !savedRoster.includes(u.name)).map(u => u.name);
                setRoster([...savedRoster, ...newUsers]);
            } else {
                setRoster(allUsers.map(u => u.name));
            }

            if (shiftSettings?.startDate) setStartDate(shiftSettings.startDate);
            if (shiftSettings?.workDays) setWorkDays(shiftSettings.workDays);
        }
    }, [allUsers, shiftSettings]);

    const moveUser = (index, direction) => {
        const newRoster = [...roster];
        if (direction === 'up' && index > 0) {
            [newRoster[index], newRoster[index - 1]] = [newRoster[index - 1], newRoster[index]];
        } else if (direction === 'down' && index < newRoster.length - 1) {
            [newRoster[index], newRoster[index + 1]] = [newRoster[index + 1], newRoster[index]];
        }
        setRoster(newRoster);
    };

    const toggleWorkDay = (dayVal) => {
        setWorkDays(prev => prev.includes(dayVal) ? prev.filter(d => d !== dayVal) : [...prev, dayVal]);
    };

    const handleSave = () => {
        onSaveSettings({ roster, startDate, workDays });
    };

    const schedulePreview = useMemo(() => {
        return generateSchedule(roster, startDate, previewDays, workDays);
    }, [roster, startDate, previewDays, workDays]);

    const exportToCSV = () => {
        const headers = "日期,星期,值班人員\n";
        const rows = schedulePreview.map(item => {
            const dayName = WEEKDAYS.find(w => w.val === item.dayOfWeek)?.label || '';
            return `${item.date},${dayName},${item.agent || '休假'}`;
        }).join("\n");
        
        const blob = new Blob(["\uFEFF" + headers + rows], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `排班表_${startDate}.csv`;
        link.click();
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
            {/* 左側：設定區 */}
            <div className="lg:col-span-1 space-y-6">
                
                {/* 1. 排班規則 */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-orange-500"/> 排班規則設定
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">循環起始日期</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-4 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white outline-none" />
                            <p className="text-xs text-gray-400 mt-1">系統將從這天開始，依下方人員順序進行循環。</p>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-2 block">每週排班日 (打勾代表要排人)</label>
                            <div className="flex flex-wrap gap-2">
                                {WEEKDAYS.map(day => (
                                    <button key={day.val} onClick={() => toggleWorkDay(day.val)} className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all border ${workDays.includes(day.val) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-gray-50 text-gray-400 border-gray-200 dark:bg-slate-800 dark:border-slate-700'}`}>
                                        {day.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. 人員順序 */}
                <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col max-h-[500px]">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-500"/> 值班順序調整
                    </h3>
                    <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1">
                        {roster.map((name, idx) => (
                            <div key={name} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
                                <span className="font-bold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                                    <span className="bg-gray-200 text-gray-600 dark:bg-slate-700 dark:text-gray-300 w-6 h-6 rounded-full flex items-center justify-center text-xs">{idx + 1}</span>
                                    {name}
                                </span>
                                <div className="flex gap-1">
                                    <button onClick={() => moveUser(idx, 'up')} disabled={idx === 0} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-gray-500 disabled:opacity-30"><ArrowUp className="w-4 h-4"/></button>
                                    <button onClick={() => moveUser(idx, 'down')} disabled={idx === roster.length - 1} className="p-1 hover:bg-white dark:hover:bg-slate-700 rounded text-gray-500 disabled:opacity-30"><ArrowDown className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                        {roster.length === 0 && <p className="text-gray-400 text-sm text-center py-4">無人員資料</p>}
                    </div>
                    <div className="mt-4 pt-4 border-t dark:border-slate-700">
                        <button onClick={handleSave} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg transition-all">
                            <Save className="w-4 h-4"/> 儲存設定
                        </button>
                    </div>
                </div>
            </div>

            {/* 右側：預覽與匯出 */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-800 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <RefreshCw className="w-5 h-5 text-green-500"/> 班表預覽
                    </h3>
                    <div className="flex gap-2">
                        <select value={previewDays} onChange={(e) => setPreviewDays(Number(e.target.value))} className="px-3 py-2 rounded-xl border bg-gray-50 dark:bg-slate-800 dark:border-slate-700 dark:text-white text-sm outline-none">
                            <option value="30">未來 30 天</option><option value="60">未來 60 天</option><option value="90">未來 90 天</option>
                        </select>
                        <button onClick={exportToCSV} className="px-4 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-xl font-bold text-sm flex items-center gap-2 transition-colors">
                            <Download className="w-4 h-4"/> 匯出 CSV
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar border rounded-2xl border-gray-100 dark:border-slate-700">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-gray-400 sticky top-0 z-10">
                            <tr><th className="px-6 py-4">日期</th><th className="px-6 py-4">星期</th><th className="px-6 py-4">值班人員</th><th className="px-6 py-4 text-center">狀態</th></tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                            {schedulePreview.map((item, idx) => {
                                const isToday = item.date === new Date().toISOString().split('T')[0];
                                const weekLabel = WEEKDAYS.find(w => w.val === item.dayOfWeek)?.label;
                                const isWeekend = item.dayOfWeek === 0 || item.dayOfWeek === 6;

                                return (
                                    <tr key={idx} className={`hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors ${isToday ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                        <td className="px-6 py-4 font-mono text-gray-600 dark:text-gray-300">{item.date}</td>
                                        <td className={`px-6 py-4 font-bold ${isWeekend ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>{weekLabel}</td>
                                        <td className="px-6 py-4">
                                            {item.agent ? (
                                                <span className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-mono">{item.agent[0]}</div>{item.agent}
                                                </span>
                                            ) : <span className="text-gray-400 italic">-- 休假 --</span>}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {isToday && item.agent && <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold"><CheckCircle className="w-3 h-3"/> 當值</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ShiftPanel;