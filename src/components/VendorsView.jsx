import React, { useState, useMemo } from 'react';
import { Search, Phone, MessageSquare, Wrench, ChevronRight } from 'lucide-react';

const VendorsView = ({ 
    customers, 
    onVendorClick // ★★★ 改名：接收專門開啟 Modal 的函式
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');

    const allVendors = useMemo(() => {
        return customers.filter(c => {
            const hasIndustry = c.industry && c.industry.trim().length > 0;
            const hasVendorInfo = c.vendorInfo && c.vendorInfo.trim().length > 0;
            const isCategoryVendor = c.category === '廠商';
            return isCategoryVendor || hasIndustry || hasVendorInfo;
        });
    }, [customers]);

    const filteredVendors = useMemo(() => {
        let data = allVendors;
        if (searchTerm) {
            const lower = searchTerm.toLowerCase();
            data = data.filter(v => 
                (v.name && v.name.toLowerCase().includes(lower)) ||
                (v.phone && v.phone.includes(searchTerm)) ||
                (v.industry && v.industry.includes(searchTerm)) ||
                (v.vendorInfo && v.vendorInfo.includes(searchTerm))
            );
        }
        if (filterType !== 'all') {
            data = data.filter(v => v.industry === filterType);
        }
        return data;
    }, [allVendors, searchTerm, filterType]);

    const industries = useMemo(() => {
        const list = allVendors.map(v => v.industry).filter(Boolean);
        return [...new Set(list)];
    }, [allVendors]);

    return (
        <div className="flex flex-col h-full bg-gray-50 dark:bg-slate-950">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b dark:border-slate-800 p-4 shadow-sm">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Wrench className="w-6 h-6 text-purple-600"/> 我的廠商名冊
                </h1>
                <div className="flex flex-col gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5"/>
                        <input type="text" placeholder="搜尋廠商..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 outline-none focus:ring-2 focus:ring-purple-500 transition-all"/>
                    </div>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        <button onClick={() => setFilterType('all')} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterType === 'all' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'}`}>全部</button>
                        {industries.map(ind => (
                            <button key={ind} onClick={() => setFilterType(ind)} className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${filterType === ind ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-white border border-gray-200 text-gray-600 dark:bg-slate-800 dark:border-slate-700 dark:text-gray-400'}`}>{ind}</button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
                {filteredVendors.length === 0 ? (
                    <div className="text-center py-20 text-gray-400"><Wrench className="w-16 h-16 mx-auto mb-4 opacity-20"/><p>找不到符合的廠商資料</p></div>
                ) : (
                    filteredVendors.map(vendor => {
                        // 只計算廠商記事數量
                        const vendorNotes = (vendor.notes || []).filter(n => n.type === 'vendor');
                        
                        return (
                            <div 
                                key={vendor.id} 
                                // ★★★ 這裡改成呼叫 onVendorClick
                                onClick={() => onVendorClick(vendor)}
                                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100">{vendor.name}</h3>
                                        {vendor.industry && <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs font-bold border border-purple-100 dark:bg-purple-900/20 dark:border-purple-800">{vendor.industry}</span>}
                                    </div>
                                    {vendor.reqRegion && <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-500 px-2 py-1 rounded">{vendor.reqRegion.split(',')[0]}</span>}
                                </div>
                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 font-mono font-bold"><Phone className="w-4 h-4 text-blue-500"/>{vendor.phone || '無電話'}</div>
                                    {vendor.vendorInfo && <div className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-800/50 p-2 rounded-lg"><span className="text-xs text-gray-400 block mb-1">服務項目</span>{vendor.vendorInfo}</div>}
                                </div>
                                <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1.5 text-sm font-bold text-gray-400"><MessageSquare className="w-4 h-4"/> 記事本 ({vendorNotes.length})</div>
                                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-purple-500 transition-colors"/>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};

export default VendorsView;