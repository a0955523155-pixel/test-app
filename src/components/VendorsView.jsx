import React, { useState, useMemo } from 'react';
import { Search, Briefcase, Phone, MapPin, Tag, ChevronDown, ChevronRight, Plus, Trash2, MessageCircle } from 'lucide-react';

const VendorsView = ({ customers, currentUser, isAdmin, onAddNote, onDeleteNote }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    
    // 控制哪個廠商卡片展開
    const [expandedVendorId, setExpandedVendorId] = useState(null);
    // 筆記輸入內容
    const [noteInput, setNoteInput] = useState('');

    const myVendors = useMemo(() => {
        return customers.filter(c => {
            const hasIndustry = c.industry && c.industry.trim() !== '';
            if (!hasIndustry) return false;
            // 只能看到自己建立的廠商 (管理員除外)
            return isAdmin || c.owner === currentUser?.username;
        });
    }, [customers, currentUser, isAdmin]);

    const filteredVendors = useMemo(() => {
        return myVendors.filter(v => {
            const matchSearch = (v.name + v.phone + v.serviceItems + v.vendorDistrict).includes(searchTerm);
            const matchInd = selectedIndustry === 'all' || (v.industry && v.industry.includes(selectedIndustry));
            return matchSearch && matchInd;
        });
    }, [myVendors, searchTerm, selectedIndustry]);

    const industryOptions = useMemo(() => {
        const set = new Set();
        myVendors.forEach(v => {
            if (v.industry) v.industry.split(',').forEach(i => set.add(i.trim()));
        });
        return Array.from(set);
    }, [myVendors]);

    const handleAddNoteClick = (vendorId) => {
        if (!noteInput.trim()) return;
        if (onAddNote) {
            onAddNote(vendorId, noteInput); // 呼叫 App.jsx 的函式
            setNoteInput(''); // 清空輸入框
        } else {
            console.error("onAddNote function not provided to VendorsView");
        }
    };

    return (
        <div className="pb-20">
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-950 p-4 border-b dark:border-slate-800">
                <h2 className="text-2xl font-black mb-4 dark:text-white flex items-center gap-2"><Briefcase/> 我的廠商名冊</h2>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center bg-gray-100 dark:bg-slate-800 rounded-xl px-3 py-2">
                        <Search className="w-5 h-5 text-gray-400 mr-2"/>
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="搜尋廠商、電話、服務項目..." className="bg-transparent w-full outline-none text-sm dark:text-white"/>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setSelectedIndustry('all')} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${selectedIndustry === 'all' ? 'bg-black text-white dark:bg-white dark:text-black' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'}`}>全部</button>
                        {industryOptions.map(ind => (
                            <button key={ind} onClick={() => setSelectedIndustry(ind)} className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${selectedIndustry === ind ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600 dark:bg-slate-800 dark:text-blue-400'}`}>{ind}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="p-4 grid grid-cols-1 gap-3">
                {filteredVendors.length === 0 ? <div className="text-center text-gray-400 py-10">沒有符合的廠商資料</div> : filteredVendors.map(vendor => (
                    <div key={vendor.id} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-100 dark:border-slate-800 shadow-sm transition-all">
                        <div className="flex justify-between items-start mb-2">
                            <h3 className="font-bold text-lg dark:text-white">{vendor.name}</h3>
                            <div className="flex flex-col items-end">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold mb-1">{vendor.vendorCity}{vendor.vendorDistrict}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mb-2 text-blue-600 dark:text-blue-400 font-bold font-mono bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg">
                            <Phone className="w-4 h-4"/> <a href={`tel:${vendor.phone}`}>{vendor.phone}</a>
                        </div>
                        <div className="flex flex-wrap gap-1 mb-2">
                            {(vendor.industry || '').split(',').map((ind, idx) => (<span key={idx} className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded flex items-center gap-1"><Tag className="w-3 h-3"/> {ind}</span>))}
                        </div>
                        {vendor.serviceItems && <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg mb-2"><span className="font-bold text-xs text-gray-400 block mb-1">服務項目</span>{vendor.serviceItems}</div>}
                        
                        {/* 廠商記事本區域 */}
                        <div className="border-t border-gray-100 dark:border-slate-800 pt-2 mt-2">
                            <button onClick={() => setExpandedVendorId(expandedVendorId === vendor.id ? null : vendor.id)} className="w-full flex justify-between items-center text-xs text-gray-500 font-bold hover:bg-gray-50 dark:hover:bg-slate-800 p-1 rounded">
                                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3"/> 記事本 ({vendor.notes?.length || 0})</span>
                                {expandedVendorId === vendor.id ? <ChevronDown className="w-3 h-3"/> : <ChevronRight className="w-3 h-3"/>}
                            </button>
                            
                            {expandedVendorId === vendor.id && (
                                <div className="mt-2 animate-in slide-in-from-top-2">
                                    <div className="flex gap-2 mb-2">
                                        <input 
                                            value={noteInput} 
                                            onChange={e => setNoteInput(e.target.value)} 
                                            placeholder="新增記事..." 
                                            className="flex-1 text-xs p-2 border rounded dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                                            onKeyDown={(e) => e.key === 'Enter' && handleAddNoteClick(vendor.id)}
                                        />
                                        <button onClick={() => handleAddNoteClick(vendor.id)} className="bg-blue-600 text-white p-2 rounded"><Plus className="w-3 h-3"/></button>
                                    </div>
                                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                                        {vendor.notes && [...vendor.notes].reverse().map((n, i) => (
                                            <div key={i} className="bg-gray-50 dark:bg-slate-800 p-2 rounded text-xs flex justify-between group">
                                                <div>
                                                    <div className="font-bold text-gray-700 dark:text-gray-300">{n.author} <span className="font-normal text-gray-400">({n.date})</span></div>
                                                    <div className="text-gray-600 dark:text-gray-400">{n.content}</div>
                                                </div>
                                                {onDeleteNote && (
                                                    <button onClick={() => onDeleteNote(vendor.id, n)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Trash2 className="w-3 h-3"/>
                                                    </button>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VendorsView;