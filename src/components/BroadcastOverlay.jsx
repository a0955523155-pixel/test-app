// src/components/BroadcastOverlay.jsx
import React, { useState } from 'react';
import { X, Calendar, Users, Briefcase, Tag, LayoutDashboard, StickyNote, MapPin, Maximize2, UserCircle, Building } from 'lucide-react';
import { getSafeDateStr } from '../utils/helpers';

const BroadcastOverlay = ({ data, onClose, isPresenter, onView }) => {
    if (!data) return null;
    const [fullScreenImg, setFullScreenImg] = useState(null); 
    const isCase = ['賣方', '出租', '出租方'].includes(data.category);
    const isRental = data.category.includes('出租');
    
    const formatDate = (val) => {
        const d = getSafeDateStr(val);
        return d || '無紀錄';
    };

    const handleClose = () => { 
        if (isPresenter) { 
            if(confirm("您是廣播發起人，關閉視窗將結束所有人的廣播，確定嗎？")) onClose(true); 
        } else { 
            onClose(false); 
        } 
    };
    
    const coverPos = data.coverImagePosition || 50;
    const statusMap = { 'new': '新案件', 'contacting': '洽談中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    const attachments = [{ label: '地籍圖', src: data.imgCadastral }, { label: '路線圖', src: data.imgRoute }, { label: '位置圖', src: data.imgLocation }, { label: '規劃圖', src: data.imgPlan }].filter(item => item.src);

    return (
        <div className="fixed inset-0 z-[100] bg-black/90 text-white flex flex-col items-center justify-center p-2 sm:p-4 overflow-hidden animate-in fade-in zoom-in duration-300 backdrop-blur-md">
            {fullScreenImg && (<div className="fixed inset-0 z-[200] bg-black flex items-center justify-center p-4 animate-in zoom-in duration-200" onClick={() => setFullScreenImg(null)}><button className="absolute top-4 right-4 p-4 text-white hover:text-gray-300 z-[210]"><X className="w-10 h-10"/></button>{fullScreenImg.startsWith('data:application/pdf') ? <iframe src={fullScreenImg} className="w-full h-full bg-white rounded-lg border-none"></iframe> : <img src={fullScreenImg} className="max-w-full max-h-full object-contain shadow-2xl rounded-sm" onClick={(e) => e.stopPropagation()} />}</div>)}
            <div className="fixed top-4 right-4 z-[110] flex gap-3"><button onClick={handleClose} className="p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors border border-white/20 shadow-lg" title="關閉視窗"><X className="w-6 h-6"/></button></div>
            <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-6xl shadow-2xl relative flex flex-col max-h-[95vh] overflow-hidden">
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row items-start gap-6 border-b border-gray-700 pb-6">
                            <div className="flex-shrink-0 w-full md:w-auto flex justify-center">
                                {data.photoUrl ? ( <img src={data.photoUrl} alt="Case" className="w-48 h-48 sm:w-64 sm:h-48 object-cover rounded-xl shadow-lg border border-gray-600" style={{ objectPosition: `center ${coverPos}%` }} /> ) : ( <div className={`w-32 h-32 sm:w-48 sm:h-48 rounded-2xl flex items-center justify-center text-6xl font-bold shadow-lg ${isCase ? 'bg-orange-600' : 'bg-blue-600'}`}>{data.name?.[0]}</div> )}
                            </div>
                            <div className="flex-1 w-full text-center md:text-left">
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-3">
                                    <span className={`px-4 py-1.5 rounded-full text-base font-bold ${isCase ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{data.category}</span>
                                    <span className="bg-gray-700 px-4 py-1.5 rounded-full text-base border border-gray-600 font-bold">{statusMap[data.status] || data.status}</span>
                                    
                                    <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-sm font-bold border border-green-800">來源: {data.source || '未設定'}</span>
                                    <span className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm font-bold border border-purple-800">等級: {data.level || 'C'}</span>
                                </div>
                                <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-3 text-white break-words">{isCase ? (data.caseName || data.name) : data.name}</h1>
                                
                                {!isCase && data.project && (
                                    <div className="mb-4 flex flex-wrap gap-2 justify-center md:justify-start">
                                        <span className="text-gray-400 text-sm font-bold flex items-center">有興趣：</span>
                                        {(Array.isArray(data.project) ? data.project : [data.project]).map((p, i) => (
                                            <span key={i} className="bg-purple-900/50 text-purple-300 px-3 py-1 rounded-full text-sm font-bold border border-purple-700 flex items-center gap-1"><Building className="w-3 h-3"/> {p}</span>
                                        ))}
                                    </div>
                                )}

                                <div className="text-xl sm:text-2xl text-gray-300 font-medium flex items-center justify-center md:justify-start gap-2 mb-4"><MapPin className="w-6 h-6 text-gray-500 flex-shrink-0"/>{isCase ? (data.landNo || data.reqRegion) : data.reqRegion}</div>
                                <div className="inline-block bg-slate-800/80 px-6 py-3 rounded-2xl border border-slate-600"><div className="text-gray-400 text-sm font-bold mb-1 text-center md:text-left">{isCase ? (isRental ? '租金' : '開價') : '預算'}</div><div className="text-4xl sm:text-5xl font-black text-green-400 font-mono tracking-tighter">{isCase ? data.totalPrice : data.value?.toLocaleString()} <span className="text-xl sm:text-2xl ml-2 text-gray-500">{isCase && isRental ? '元' : '萬'}</span></div></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> 建檔日期</div><div className="text-lg font-bold text-white">{formatDate(data.createdAt)}</div></div>
                            <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Calendar className="w-3 h-3"/> 最新回報</div><div className="text-lg font-bold text-yellow-400">{getSafeDateStr(data.lastContact) || '無'}</div></div>
                            {data.subAgent && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Users className="w-3 h-3"/> 次要專員</div><div className="text-lg font-bold text-pink-300">{data.subAgent}</div></div>}
                            {data.industry && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Briefcase className="w-3 h-3"/> 行業類別</div><div className="text-lg font-bold text-blue-300">{data.industry}</div></div>}
                            {data.serviceItems && <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700 sm:col-span-2 lg:col-span-1"><div className="text-gray-500 text-xs mb-1 flex items-center gap-1"><Tag className="w-3 h-3"/> 服務項目</div><div className="text-lg font-bold text-green-300 truncate">{data.serviceItems}</div></div>}
                        </div>

                        <div className="flex flex-col lg:flex-row gap-6 min-h-[300px]">
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> 詳細備註</h3>
                                <div className="whitespace-pre-wrap leading-relaxed text-gray-200 text-2xl font-medium flex-1 overflow-y-auto max-h-[400px] custom-scrollbar">{data.remarks || "無詳細備註"}</div>
                            </div>
                            <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><StickyNote className="w-5 h-5"/> 回報紀錄 ({data.notes?.length || 0})</h3>
                                <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar max-h-[400px]">
                                    {data.notes && data.notes.length > 0 ? ([...data.notes].reverse().map((note, idx) => (<div key={idx} className="bg-slate-700/50 p-4 rounded-xl border border-slate-600"><div className="flex justify-between items-center mb-2 border-b border-slate-600 pb-2"><span className="text-blue-300 font-bold flex items-center gap-1"><UserCircle className="w-4 h-4"/> {note.author}</span><span className="text-gray-400 text-xs">{note.date}</span></div><div className="text-gray-200 whitespace-pre-wrap text-lg font-medium">{note.content}</div></div>))) : (<div className="text-gray-500 text-center py-10">尚無回報紀錄</div>)}
                                </div>
                            </div>
                        </div>

                        {attachments.length > 0 && (
                            <div className="mt-4 pt-6 border-t border-gray-700">
                                <h3 className="text-xl font-bold text-gray-400 mb-4 flex items-center gap-2"><MapPin className="w-5 h-5"/> 相關圖資 (點擊放大)</h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                                    {attachments.map((img, idx) => (
                                        <div key={idx} className="group relative bg-slate-800 p-2 rounded-xl border border-slate-700 overflow-hidden cursor-pointer hover:border-blue-500 transition-all" onClick={() => setFullScreenImg(img.src)}>
                                            <div className="absolute top-2 left-2 bg-black/60 px-2 py-1 rounded text-xs font-bold text-white z-10">{img.label}</div>
                                            {img.src.startsWith('data:application/pdf') ? ( <div className="w-full h-40 bg-white flex items-center justify-center text-slate-800 text-sm font-bold">PDF 文件</div> ) : ( <img src={img.src} alt={img.label} className="w-full h-40 object-cover rounded-lg group-hover:scale-105 transition-transform duration-300" /> )}
                                            <div className="absolute bottom-2 right-2 bg-blue-600/80 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><Maximize2 className="w-4 h-4 text-white"/></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
                <div className="bg-slate-950 p-3 text-center text-slate-600 text-xs font-mono uppercase tracking-widest border-t border-slate-800 flex-shrink-0">Broadcast Mode • GreenShoot Team</div>
            </div>
        </div>
    );
};

export default BroadcastOverlay;