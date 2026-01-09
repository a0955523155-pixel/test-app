import React, { useState, useMemo } from 'react';
import { ArrowLeft } from 'lucide-react';
import { DEFAULT_SOURCES, DEFAULT_CATEGORIES, DEFAULT_LEVELS, DEFAULT_PROJECTS, STATUS_CONFIG } from '../config/constants';
import { formatDateString } from '../utils/helpers';

const CustomerForm = ({ onSubmit, onCancel, initialData, appSettings, companyProjects, projectAds, darkMode }) => {
    const processedInitialData = useMemo(() => {
        if (!initialData) return null;
        return {
            ...initialData,
            createdAt: initialData.createdAt ? formatDateString(initialData.createdAt) : formatDateString(new Date()),
            value: initialData.value ? String(initialData.value) : ''
        };
    }, [initialData]);

    const [formData, setFormData] = useState(processedInitialData || { 
        name: '', gender: '男', category: '買方', level: 'C', company: '', 
        phone: '', secondaryAgent: '', value: '', contactTime: '', 
        source: '其他', project: '', address: '', reqRegion: '', reqPing: '', 
        status: 'new', remarks: '', email: '', 
        createdAt: formatDateString(new Date()) 
    });
    
    const [isProcessing, setIsProcessing] = useState(false);
    
    const availableSources = useMemo(() => {
        let sources = [...(appSettings?.sources || DEFAULT_SOURCES)];
        if (formData.project && projectAds && projectAds[formData.project]) {
            const ads = projectAds[formData.project].map(ad => typeof ad === 'string' ? ad : ad.name);
            sources = [...sources, ...ads];
        }
        return [...new Set(sources)];
    }, [formData.project, projectAds, appSettings?.sources]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsProcessing(true);
        const cleanValue = String(formData.value).replace(/,/g, '');
        const finalData = { 
            ...formData, 
            value: cleanValue ? Number(cleanValue) : 0 
        };
        await onSubmit(finalData);
        setIsProcessing(false);
    };

    return (
      <div className={`p-4 min-h-screen w-full ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
        <div className={`w-full ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-100'} rounded-xl shadow-sm border overflow-hidden`}>
          <div className="p-4 border-b dark:border-slate-800 flex items-center"><button onClick={onCancel} className="mr-3"><ArrowLeft className="w-5 h-5" /></button><h2 className="text-lg font-bold">{initialData ? '編輯' : '新增'}客戶</h2></div>
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b pb-2">基本資料</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-lg border border-yellow-200 dark:border-yellow-900/30">
                    <label className="text-xs font-bold text-yellow-600 dark:text-yellow-500 mb-1 block">建檔日期</label>
                    <input type="date" required className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.createdAt} onChange={e => setFormData({...formData, createdAt: e.target.value})} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">姓名</label><input required className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">性別</label><select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}><option>男</option><option>女</option></select></div>
                </div>
                <div><label className="text-xs font-bold text-gray-400 block mb-1">目前狀態</label><select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{Object.entries(STATUS_CONFIG).map(([key, config]) => <option key={key} value={key}>{config.label}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-400 block mb-1">公司名稱</label><input className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} /></div>
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b pb-2 mt-6">聯絡方式</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">電話</label><input className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">Email</label><input className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                </div>
                <div><label className="text-xs font-bold text-gray-400 block mb-1">地址</label><input className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                <h3 className="text-sm font-bold text-blue-500 uppercase tracking-widest border-b pb-2 mt-6">需求與來源</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">需求分類</label>
                        <select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                            <option value="">請選擇...</option>
                            {(appSettings?.categories || DEFAULT_CATEGORIES).map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-400 block mb-1">客戶等級</label>
                        <select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.level} onChange={e => setFormData({...formData, level: e.target.value})}>
                            <option value="">請選擇...</option>
                            {(appSettings?.levels || DEFAULT_LEVELS).map(l => <option key={l} value={l}>{l}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">關注案場</label>
                    <select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.project} onChange={e => setFormData({...formData, project: e.target.value})}>
                        <option value="">請選擇...</option>
                        {Object.entries(companyProjects || DEFAULT_PROJECTS).map(([region, sites]) => (<optgroup key={region} label={region}>{sites.map(site => <option key={site} value={site}>{site}</option>)}</optgroup>))}
                    </select>
                </div>
                <div>
                    <label className="text-xs font-bold text-gray-400 block mb-1">從何得知</label>
                    <select className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.source} onChange={e => setFormData({...formData, source: e.target.value})}>
                        <option value="">請選擇...</option>
                        {availableSources.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">地區</label><input className={`w-full px-2 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.reqRegion} onChange={e => setFormData({...formData, reqRegion: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">坪數</label><input className={`w-full px-2 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.reqPing} onChange={e => setFormData({...formData, reqPing: e.target.value})} /></div>
                    <div><label className="text-xs font-bold text-gray-400 block mb-1">預算</label><input className={`w-full px-2 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} /></div>
                </div>
                <div>
                   <label className="text-xs font-bold text-gray-400 block mb-1">次要專員</label>
                   <input className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.secondaryAgent} onChange={e => setFormData({...formData, secondaryAgent: e.target.value})} />
                </div>
                <div><label className="text-xs font-bold text-gray-400 block mb-1">備註</label><textarea className={`w-full px-3 py-2 border rounded-lg outline-none transition-colors ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`} value={formData.remarks} onChange={e => setFormData({...formData, remarks: e.target.value})} /></div>
            </div>
            <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:opacity-50">{isProcessing ? '處理中...' : '儲存'}</button>
          </form>
        </div>
      </div>
    );
};

export default CustomerForm;