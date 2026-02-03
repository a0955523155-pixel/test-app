import React from 'react';
import { Phone, MapPin, Briefcase, StickyNote, Image as ImageIcon, Map, Navigation, Layout, Wrench, Maximize2 } from 'lucide-react';

const InfoTab = ({ customer, isSeller, canEdit, formatAddress, renderDocument, darkMode }) => {
    const isRental = customer.category && customer.category.includes('出租');

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">承辦專員</label>
                        <div className="flex items-center gap-2 font-bold text-blue-600">
                            <Briefcase className="w-4 h-4"/> {customer.assignedAgent || customer.ownerName || '未指定'}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">聯絡電話</label>
                        <div className="flex items-center gap-2 font-mono text-lg font-bold">
                            <Phone className="w-4 h-4 text-blue-500"/> {customer.phone || '未填寫'} 
                            <a href={`tel:${customer.phone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">撥打</a>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 block mb-1">{isSeller ? (isRental ? '租金' : '開價') : '需求預算'}</label>
                        <div className="text-2xl font-black text-green-500">
                            {isSeller ? customer.totalPrice : customer.value || 0} <span className="text-sm text-gray-500 ml-1">{isRental ? '元' : '萬'}</span>
                        </div>
                    </div>

                    {isSeller ? (
                        <>
                            <div><label className="text-xs text-gray-400 block mb-1">物件類型</label><div className="font-bold">{customer.propertyType || '未指定'}</div></div>
                            <div><label className="text-xs text-gray-400 block mb-1">地坪/建坪</label><div className="font-bold">{customer.landPing || 0} / {customer.buildPing || 0} 坪</div></div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-400 block mb-1">地址資訊</label>
                                <div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> {customer.city} {customer.reqRegion} {formatAddress()}</div>
                                {(customer.landSection || customer.landNumber) && canEdit && <div className="text-sm text-gray-500 mt-1 pl-6">段號：{customer.landSection} {customer.landNumber}</div>}
                            </div>
                        </>
                    ) : (
                        <>
                            <div><label className="text-xs text-gray-400 block mb-1">需求區域</label><div className="font-bold">{customer.reqRegion || '不限'}</div></div>
                            <div><label className="text-xs text-gray-400 block mb-1">需求類型</label><div className="font-bold">{customer.targetPropertyType || '不限'}</div></div>
                            <div><label className="text-xs text-gray-400 block mb-1">需求坪數</label><div className="font-bold">{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</div></div>
                        </>
                    )}

                    {customer.industry && (
                        <div className="col-span-full pt-2 border-t dark:border-slate-800">
                            <label className="text-xs text-gray-400 block mb-1">行業別</label>
                            <div className="font-bold text-blue-600 flex items-center gap-2"><Briefcase className="w-4 h-4"/> {customer.industry}</div>
                        </div>
                    )}

                    {customer.vendorInfo && (
                        <div className="col-span-full pt-2 border-t dark:border-slate-800">
                            <label className="text-xs text-gray-400 block mb-1">配合廠商資訊</label>
                            <div className="font-bold text-purple-600 flex items-center gap-2"><Wrench className="w-4 h-4"/> {customer.vendorInfo}</div>
                        </div>
                    )}

                    <div className="md:col-span-2 pt-4 border-t dark:border-slate-700">
                        <label className="text-xs text-gray-400 block mb-2 flex items-center gap-1"><StickyNote className="w-3 h-3"/> 備註事項</label>
                        <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{customer.remarks || "無備註內容"}</div>
                    </div>
                </div>
            </div>

            {/* 圖片與文件列表 */}
            {isSeller && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {renderDocument(customer.photoUrl, "現況封面", <ImageIcon className="w-4 h-4 text-blue-500"/>)}
                    {renderDocument(customer.imgCadastral, "地籍圖", <Map className="w-4 h-4 text-green-500"/>)}
                    {renderDocument(customer.imgRoute, "路線圖", <Navigation className="w-4 h-4 text-purple-500"/>)}
                    {renderDocument(customer.imgLocation, "位置圖", <MapPin className="w-4 h-4 text-red-500"/>)}
                    {renderDocument(customer.imgPlan, "規劃圖", <Layout className="w-4 h-4 text-orange-500"/>)}
                </div>
            )}
        </div>
    );
};

export default InfoTab;