import React from 'react';
import { X, MapPin, LayoutDashboard, BellRing } from 'lucide-react';

const BroadcastOverlay = ({ data, onClose, isPresenter }) => {
    if (!data) return null;
    const isCase = ['賣方', '出租', '出租方'].includes(data.category);
    const isRental = data.category.includes('出租');
    const historyData = (data.notes || data.history || []).sort((a, b) => new Date(b.date) - new Date(a.date));
    const mainAgent = data.ownerName || '未指派';
    let secondaryAgents = [];
    if (data.secondaryAgents) { secondaryAgents = Array.isArray(data.secondaryAgents) ? data.secondaryAgents : [data.secondaryAgents]; } 
    else if (data.agents && Array.isArray(data.agents)) { secondaryAgents = data.agents.filter(a => a !== mainAgent); }

    const handleClose = () => { if (isPresenter) { if(confirm("您是廣播發起人，關閉視窗將結束所有人的廣播，確定嗎？")) onClose(true); } else { onClose(false); } };

    return (
        <div className="fixed inset-0 z-[100] bg-black/80 text-white flex flex-col items-center justify-center p-4 overflow-y-auto animate-in fade-in zoom-in duration-300 backdrop-blur-md">
            <button onClick={handleClose} className="fixed top-5 right-5 p-2 bg-white/10 hover:bg-white/30 rounded-full transition-colors z-[110] border border-white/20"><X className="w-8 h-8"/></button>
            <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl max-w-7xl w-full shadow-2xl relative my-10 overflow-hidden flex flex-col max-h-[90vh]">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 animate-pulse"></div>
                <div className="flex flex-col md:flex-row items-start gap-8 mb-6 border-b border-gray-700 pb-6 flex-shrink-0">
                    <div className="flex-shrink-0">{data.photoUrl ? (<img src={data.photoUrl} alt="Case" className="w-48 h-32 object-cover rounded-xl shadow-lg border border-gray-600" />) : (<div className={`w-32 h-32 rounded-2xl flex items-center justify-center text-5xl font-bold shadow-lg ${isCase ? 'bg-orange-600' : 'bg-blue-600'}`}>{data.name?.[0]}</div>)}</div>
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2"><span className={`px-3 py-1 rounded-full text-sm font-bold ${isCase ? 'bg-orange-500/20 text-orange-400' : 'bg-blue-500/20 text-blue-400'}`}>{data.category}</span><span className="bg-gray-700 px-3 py-1 rounded-full text-sm border border-gray-600">{data.status}</span></div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-2 text-white">{isCase ? (data.caseName || data.name) : data.name}</h1>
                        <div className="text-2xl text-gray-300 font-medium flex items-center gap-2"><MapPin className="w-6 h-6 text-gray-500"/>{isCase ? (data.landNo || data.reqRegion) : data.reqRegion}</div>
                        <div className="mt-4 flex flex-wrap gap-4"><div className="bg-white/5 border border-white/10 px-3 py-1 rounded text-sm flex items-center gap-2"><span className="text-gray-400">來源：</span> {data.source || '未填寫'}</div>{!isCase && (<div className="bg-white/5 border border-white/10 px-3 py-1 rounded text-sm flex items-center gap-2"><span className="text-gray-400">有興趣案場：</span> <span className="text-yellow-400 font-bold">{data.project || '未填寫'}</span></div>)}</div>
                    </div>
                    <div className="text-right bg-slate-800/50 p-4 rounded-xl border border-slate-700"><div className="text-gray-400 text-sm font-bold mb-1">{isCase ? (isRental ? '租金' : '開價') : '預算'}</div><div className="text-5xl font-black text-green-400 font-mono tracking-tighter">{isCase ? data.totalPrice : data.value?.toLocaleString()}<span className="text-2xl ml-1 text-gray-500">{isCase && isRental ? '元' : '萬'}</span></div></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 overflow-y-auto custom-scrollbar pr-2">
                    <div className="md:col-span-7 space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700"><h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><LayoutDashboard className="w-5 h-5"/> 詳情 / 備註</h3><div className="whitespace-pre-wrap leading-relaxed text-gray-300 text-lg max-h-[300px] overflow-y-auto custom-scrollbar pr-2">{data.remarks || "無詳細備註"}</div></div>
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-inner bg-opacity-50"><h3 className="text-xl font-bold text-orange-400 mb-4 border-b border-gray-600 pb-2 flex items-center gap-2"><BellRing className="w-5 h-5"/> 歷史回報 / 追蹤紀錄</h3><div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">{(data.notes || []).length === 0 ? (<div className="text-center py-8 text-gray-600 italic border-2 border-dashed border-gray-700 rounded-xl">尚無任何回報紀錄</div>) : (historyData.map((note, idx) => (<div key={idx} className="bg-slate-700/60 p-4 rounded-xl border border-slate-600 hover:border-orange-500/50 transition-colors"><div className="flex justify-between items-center mb-2"><div className="flex items-center gap-2"><span className="bg-blue-600 text-white px-2 py-0.5 rounded text-xs font-bold shadow-sm">{note.author || note.user || '未知人員'}</span></div><span className="text-gray-400 text-xs font-mono bg-black/20 px-2 py-1 rounded">{note.date}</span></div><div className="text-gray-200 whitespace-pre-wrap leading-relaxed text-base pl-1">{note.content}</div></div>)))}</div></div>
                        {isCase && data.nearby && (<div className="bg-slate-800 p-6 rounded-2xl border border-slate-700"><h3 className="text-xl font-bold text-gray-400 mb-4 border-b border-gray-600 pb-2">附近機能</h3><div className="whitespace-pre-wrap leading-relaxed text-gray-300">{data.nearby}</div></div>)}
                    </div>
                    <div className="md:col-span-5 space-y-6">
                        <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700"><div className="mb-6"><span className="text-gray-400 font-bold text-sm block mb-2 uppercase tracking-wider">主責專員</span><span className="bg-blue-600 text-white px-6 py-3 rounded-xl text-xl font-bold shadow-lg shadow-blue-900/30 inline-block border border-blue-500">{mainAgent}</span></div>{secondaryAgents.length > 0 && (<div className="pt-4 border-t border-slate-600"><span className="text-gray-400 font-bold text-sm block mb-3 uppercase tracking-wider">協辦 / 次要專員</span><div className="flex flex-wrap gap-2">{secondaryAgents.map(a => (<span key={a} className="bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-sm font-bold border border-slate-600">{a}</span>))}</div></div>)}</div>
                        {isCase && data.googleMapUrl && (<a href={data.googleMapUrl} target="_blank" rel="noreferrer" className="block w-full bg-blue-600 hover:bg-blue-500 text-white text-center py-6 rounded-2xl font-bold text-2xl transition-all shadow-lg hover:shadow-blue-900/50 flex items-center justify-center gap-3 transform hover:-translate-y-1"><MapPin className="w-8 h-8"/> 開啟 Google 地圖</a>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BroadcastOverlay;