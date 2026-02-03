import React from 'react';
import { Target, MapPin, User, Briefcase } from 'lucide-react';

const MatchTab = ({ matchedObjects, isSeller, customer, darkMode }) => {
    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-200 text-sm mb-4">
                <h3 className="font-bold flex items-center gap-2 mb-1"><Target className="w-4 h-4"/> 配對條件 ({isSeller ? '本案條件' : '需求條件'})</h3>
                <ul className="list-disc list-inside opacity-80 text-xs">
                    {isSeller ? (
                        <><li>本案區域：{customer.reqRegion || customer.assignedRegion}</li><li>本案類型：{customer.propertyType || '未指定'}</li><li>本案坪數：地 {customer.landPing} / 建 {customer.buildPing}</li></>
                    ) : (
                        <><li>需求區域：{customer.reqRegion || '不限'} (含歸檔區)</li><li>需求類型：{customer.targetPropertyType || '不限'}</li><li>需求坪數：{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</li></>
                    )}
                </ul>
            </div>
            {matchedObjects.length === 0 ? (
                <div className="text-center py-20 opacity-50"><p>{isSeller ? '目前沒有符合需求的買方' : '目前沒有符合條件的物件'}</p></div>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {matchedObjects.map(obj => (
                        <div key={obj.id} className={`flex justify-between p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} hover:border-purple-400 transition-colors`}>
                            <div>
                                <div className="font-bold flex flex-col gap-1">
                                    {['賣方', '出租', '出租方'].includes(obj.category) ? (
                                        <>
                                            <span className="text-lg text-gray-800 dark:text-white">{obj.caseName || obj.name}</span>
                                            <div className="flex flex-wrap gap-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/> {obj.city}{obj.reqRegion || obj.assignedRegion}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><User className="w-3 h-3"/> 屋主: {obj.name}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><Briefcase className="w-3 h-3"/> 承辦: {obj.assignedAgent || obj.ownerName}</span>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-lg text-gray-800 dark:text-white">{obj.name}</span>
                                            <div className="flex flex-wrap gap-2 text-xs font-normal text-gray-500 dark:text-gray-400">
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><MapPin className="w-3 h-3"/> {obj.reqRegion || '不限'}</span>
                                                <span className="bg-gray-100 dark:bg-slate-800 px-2 py-0.5 rounded flex items-center gap-1"><Briefcase className="w-3 h-3"/> 承辦: {obj.ownerName}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MatchTab;