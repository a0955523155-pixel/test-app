import React, { useState, useMemo } from 'react';
import { 
  X, Phone, MapPin, Trash2, Edit, Printer, 
  StickyNote, Briefcase, CheckCircle, Plus, Target
} from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';

const StatusBadge = ({ status }) => {
    const labelMap = { 'new': '新案件', 'contacting': '洽談中', 'commissioned': '已委託', 'offer': '已收斡', 'closed': '已成交', 'lost': '已無效' };
    const label = labelMap[status] || (STATUS_CONFIG[status] || STATUS_CONFIG['new']).label;
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{label}</span>;
};

const CustomerDetail = ({ customer, allCustomers = [], currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode, allUsers = [] }) => {
    const [noteContent, setNoteContent] = useState('');
    const [activeTab, setActiveTab] = useState('info'); 

    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);
    const isRental = customer.category && customer.category.includes('出租');
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

    const typeStr = customer.propertyType || customer.type || '';
    const isLand = typeStr.includes('土地') || typeStr.includes('農地') || typeStr.includes('建地') || typeStr.includes('工業地');

    // 地址格式化
    const formatAddress = (addr) => {
        if (!addr) return '';
        if (addr.includes('段') || addr.includes('地號')) return addr;
        const parts = addr.split('號');
        if (parts.length > 1) return parts[0] + '號 (詳細地址請洽專員)';
        return addr;
    };

    // ★★★ 核心功能：列印 (手機版優化 + 關閉按鈕) ★★★
    const handlePrint = () => {
        const win = window.open('', '_blank'); // 改用 _blank 確保手機開啟新分頁
        if (!win) { alert("請允許開啟彈出視窗以進行列印"); return; }
        
        let finalAgent = currentUser; 
        if (customer.assignedAgent) {
            const foundAgent = (allUsers || []).find(u => u.name === customer.assignedAgent);
            if (foundAgent) {
                finalAgent = foundAgent;
            }
        }

        const agentName = finalAgent?.name || '專案經紀人';
        const agentPhone = finalAgent?.phone || '09xx-xxx-xxx';
        const agentLine = finalAgent?.lineId || ''; 
        
        const photoHtml = customer.photoUrl 
            ? `<div class="photo-container"><img src="${customer.photoUrl}" alt="物件照片" /></div>`
            : `<div class="photo-container no-photo"><span>暫無照片</span></div>`;

        const displayCity = customer.city || '高雄市'; 
        const displayArea = customer.reqRegion || customer.area || '';
        const displayAddress = formatAddress(customer.landNo || customer.address || '');

        let specsHtml = '';
        if (isLand) {
            specsHtml = `
                <div class="spec-item"><div class="spec-label">總地坪</div><div class="spec-value">${customer.landPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">使用分區</div><div class="spec-value">${customer.usageZone || '-'}</div></div>
                <div class="spec-item"><div class="spec-label">單價</div><div class="spec-value">${customer.unitPrice ? customer.unitPrice + ' 萬/坪' : '-'}</div></div>
                <div class="spec-item mt-3"><div class="spec-label">面寬</div><div class="spec-value">${customer.faceWidth || '-'} 米</div></div>
                <div class="spec-item mt-3"><div class="spec-label">臨路</div><div class="spec-value">${customer.roadWidth || '-'} 米</div></div>
                <div class="spec-item mt-3"><div class="spec-label">座向</div><div class="spec-value">${customer.direction || '-'}</div></div>
            `;
        } else {
            specsHtml = `
                <div class="spec-item"><div class="spec-label">建物坪數</div><div class="spec-value">${customer.buildPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">土地坪數</div><div class="spec-value">${customer.landPing || '-'} 坪</div></div>
                <div class="spec-item"><div class="spec-label">格局</div><div class="spec-value">${customer.room || '-'}房 ${customer.hall || '-'}廳 ${customer.bath || '-'}衛</div></div>
                <div class="spec-item mt-3"><div class="spec-label">屋齡</div><div class="spec-value">${customer.age || '-'} 年</div></div>
                <div class="spec-item mt-3"><div class="spec-label">樓層</div><div class="spec-value">${customer.floor || '-'} / ${customer.totalFloor || '-'} 樓</div></div>
                <div class="spec-item mt-3"><div class="spec-label">型態</div><div class="spec-value">${customer.type || '電梯大樓'}</div></div>
            `;
        }

        win.document.write('<html><head><title>' + (customer.caseName || customer.name) + ' - 物件介紹</title>');
        // ★★★ 加入 viewport meta 標籤優化手機顯示 ★★★
        win.document.write('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
        win.document.write('<style>');
        win.document.write(`
            @page { size: A4 portrait; margin: 0; }
            body { font-family: "Microsoft JhengHei", "Heiti TC", sans-serif; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            
            /* ★★★ 關鍵修改：A4 容器與縮放邏輯 ★★★ */
            .page-container { 
                width: 210mm; 
                min-height: 296mm; /* 確保至少一頁高度 */
                padding: 10mm 12mm; /* 稍微縮小邊距 */
                box-sizing: border-box; 
                margin: 0 auto; 
                display: flex; 
                flex-direction: column; 
                position: relative;
            }

            /* 手機版強制縮放，確保塞進一頁 */
            @media print {
                body { transform: scale(0.95); transform-origin: top center; } /* 整體縮小 */
                .page-container { height: auto; overflow: hidden; page-break-after: avoid; page-break-inside: avoid; }
                .no-print { display: none !important; } /* 列印時隱藏按鈕 */
            }

            /* Header: 深墨綠色底 + 金色字 */
            .header { border-bottom: 4px solid #14532d; padding-bottom: 8px; margin-bottom: 15px; display: flex; justify-content: space-between; align-items: flex-end; flex-shrink: 0; }
            .header h1 { margin: 0; font-size: 24px; color: #14532d; letter-spacing: 2px; font-weight: 900; }
            .header span { font-size: 12px; font-weight: bold; color: #15803d; letter-spacing: 1px; text-transform: uppercase; }

            .photo-container { width: 100%; height: 400px; background: #f3f4f6; border-radius: 8px; overflow: hidden; border: 1px solid #d1d5db; margin-bottom: 15px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
            .photo-container img { width: 100%; height: 100%; object-fit: cover; }
            .no-photo span { font-size: 20px; color: #9ca3af; font-weight: bold; }

            .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 15px; flex-shrink: 0; }
            .title-info { width: 60%; }
            .status-tag { display: inline-block; padding: 4px 10px; background: #fffbeb; color: #b45309; font-size: 12px; font-weight: bold; border-radius: 4px; margin-bottom: 6px; border: 1px solid #fcd34d; }
            .case-name { font-size: 28px; font-weight: 900; color: #111827; margin: 0 0 6px 0; line-height: 1.2; }
            .address { font-size: 14px; color: #4b5563; font-weight: bold; display: flex; align-items: center; }
            
            .price-info { width: 40%; text-align: right; }
            .price-label { font-size: 12px; color: #6b7280; font-weight: bold; margin-bottom: 2px; }
            .price-val { font-size: 48px; font-weight: 900; color: #15803d; font-family: Arial, sans-serif; letter-spacing: -1px; line-height: 1; }
            .price-unit { font-size: 18px; color: #374151; margin-left: 2px; }

            .specs-box { background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 15px; margin-bottom: 15px; flex-shrink: 0; }
            .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 15px; row-gap: 0; }
            .spec-item { border-right: 1px solid #d1d5db; padding-right: 10px; }
            .spec-item:nth-child(3n) { border-right: none; }
            .spec-label { font-size: 11px; color: #6b7280; margin-bottom: 4px; }
            .spec-value { font-size: 16px; font-weight: bold; color: #1f2937; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
            .mt-3 { margin-top: 10px; }

            .highlight-box { background: #fdfbf7; border: 1px solid #e5e7eb; padding: 12px; border-radius: 6px; margin-top: auto; margin-bottom: 15px; flex-shrink: 0; }
            .highlight-title { color: #b45309; font-weight: bold; margin-bottom: 4px; font-size: 13px; }
            .highlight-text { font-size: 13px; color: #374151; line-height: 1.4; }

            .footer { background: #14532d; color: white; padding: 12px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; flex-shrink: 0; margin-top: auto; -webkit-print-color-adjust: exact; border-top: 4px solid #22c55e; }
            .agent-info h3 { margin: 0 0 2px 0; font-size: 20px; font-weight: 900; letter-spacing: 1px; }
            .agent-title { color: #86efac; font-size: 10px; font-weight: bold; letter-spacing: 1px; margin-bottom: 2px; }
            .agent-slogan { color: #d1fae5; font-size: 10px; }
            .contact-info { text-align: right; }
            .phone { font-size: 24px; font-weight: 900; margin-bottom: 0px; display: flex; align-items: center; justify-content: flex-end; gap: 8px; color: #fff; }
            .line-id { font-size: 12px; color: #ecfdf5; font-weight: bold; background: #166534; padding: 2px 8px; border-radius: 4px; display: inline-block; margin-top: 4px;}

            /* 關閉按鈕樣式 */
            .close-btn-container {
                position: fixed; top: 10px; right: 10px; z-index: 9999;
                display: flex; gap: 10px;
            }
            .action-btn {
                background: #ef4444; color: white; border: none; padding: 10px 20px; 
                border-radius: 50px; font-weight: bold; cursor: pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            .print-btn { background: #3b82f6; }
        `);
        win.document.write('</style></head><body>');
        
        // ★★★ 加入操作按鈕 (列印時會隱藏) ★★★
        win.document.write(`
            <div class="close-btn-container no-print">
                <button class="action-btn print-btn" onclick="window.print()">🖨️ 列印/儲存</button>
                <button class="action-btn" onclick="window.close()">❌ 關閉視窗</button>
            </div>
        `);

        win.document.write(`
            <div class="page-container">
                <div class="header">
                    <h1>綠芽團隊</h1>
                    <span>GreenShootTeam</span>
                </div>

                ${photoHtml}

                <div class="title-section">
                    <div class="title-info">
                        <span class="status-tag">${customer.status === 'closed' ? '已成交' : (isRental ? '出租' : '出售')}物件</span>
                        <h2 class="case-name">${customer.caseName || customer.name}</h2>
                        <div class="address">📍 ${displayCity} ${displayArea} ${displayAddress}</div>
                    </div>
                    <div class="price-info">
                        <div class="price-label">${isRental ? '月租金' : '總價'}</div>
                        <div class="price-val">${customer.totalPrice} <span class="price-unit">${isRental ? '元' : '萬'}</span></div>
                    </div>
                </div>

                <div class="specs-box">
                    <div class="specs-grid">
                        ${specsHtml}
                    </div>
                </div>

                ${customer.nearby ? `
                <div class="highlight-box">
                    <div class="highlight-title">🌟 周邊機能與優勢</div>
                    <div class="highlight-text">${customer.nearby}</div>
                </div>` : '<div style="flex-grow:1"></div>'} 

                <div class="footer">
                    <div class="agent-info">
                        <div class="agent-title">專屬承辦經紀人</div>
                        <h3>${agentName}</h3>
                        <div class="agent-slogan">誠信服務 • 專業熱忱 • 用心經營</div>
                    </div>
                    <div class="contact-info">
                        <div class="phone">☎ ${agentPhone}</div>
                        ${agentLine ? `<div class="line-id">LINE ID: ${agentLine}</div>` : ''}
                    </div>
                </div>
            </div>
        `);

        win.document.write('</body></html>');
        win.document.close();
        
        // 手機版不自動列印，讓使用者自己點按鈕，體驗較好
        // setTimeout(() => { win.print(); }, 500); 
    };

    const matchedObjects = useMemo(() => {
        const safeFloat = (v) => { if (!v) return 0; const num = parseFloat(String(v).replace(/,/g, '')); return isNaN(num) ? 0 : num; };
        return allCustomers.filter(item => {
            if (!isAdmin) {
                const itemIsCase = ['賣方', '出租', '出租方'].includes(item.category);
                const itemIsMine = item.owner === currentUser?.username;
                if (!itemIsCase && !itemIsMine) return false;
            }
            const itemIsSeller = ['賣方', '出租', '出租方'].includes(item.category);
            if (!isSeller) {
                if (!itemIsSeller) return false; 
                if (customer.category.includes('買') && !item.category.includes('賣') && !item.category.includes('售')) return false;
                if (customer.category.includes('租') && !item.category.includes('租')) return false;
                if (customer.reqRegion) {
                    const buyerRegion = customer.reqRegion.trim();
                    const itemRealRegion = item.reqRegion ? item.reqRegion.trim() : '';
                    const itemFolderRegion = item.assignedRegion ? item.assignedRegion.trim() : '';
                    if (!buyerRegion.includes(itemRealRegion) && !buyerRegion.includes(itemFolderRegion)) return false; 
                }
                const minPing = safeFloat(customer.minPing);
                const maxPing = safeFloat(customer.maxPing);
                if (minPing > 0 || maxPing > 0) {
                    const itemLand = safeFloat(item.landPing);
                    const itemBuild = safeFloat(item.buildPing);
                    const itemSize = Math.max(itemLand, itemBuild);
                    if (minPing > 0 && itemSize < minPing) return false;
                    if (maxPing > 0 && itemSize > maxPing) return false;
                }
                return true;
            } else {
                if (itemIsSeller) return false; 
                if (customer.category.includes('賣') && !item.category.includes('買')) return false;
                if (customer.category.includes('租') && !item.category.includes('租')) return false;
                if (item.reqRegion) {
                    const buyerWantRegion = item.reqRegion.trim();
                    const myRealRegion = customer.reqRegion ? customer.reqRegion.trim() : '';
                    const myFolderRegion = customer.assignedRegion ? customer.assignedRegion.trim() : '';
                    if (!buyerWantRegion.includes(myRealRegion) && !buyerWantRegion.includes(myFolderRegion)) return false;
                }
                const buyerMin = safeFloat(item.minPing);
                const buyerMax = safeFloat(item.maxPing);
                if (buyerMin > 0 || buyerMax > 0) {
                    const myLand = safeFloat(customer.landPing);
                    const myBuild = safeFloat(customer.buildPing);
                    const mySize = Math.max(myLand, myBuild);
                    if (buyerMin > 0 && mySize < buyerMin) return false;
                    if (buyerMax > 0 && mySize > buyerMax) return false;
                }
                return true;
            }
        });
    }, [customer, allCustomers, isSeller, isAdmin, currentUser]);

    const handleAddNoteSubmit = (e) => {
        e.preventDefault();
        if (!noteContent.trim()) return;
        onAddNote(customer.id, noteContent);
        setNoteContent('');
    };

    return (
        <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className={`sticky top-0 z-20 px-4 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold truncate max-w-[200px]">{customer.name}</h1>
                    <StatusBadge status={customer.status} />
                </div>
                <div className="flex gap-2">
                    {isSeller && (
                        <button 
                            onClick={handlePrint}
                            className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1 font-bold shadow-sm" 
                            title="匯出 PDF"
                        >
                            <Printer className="w-5 h-5"/> 
                            <span className="hidden sm:inline text-xs">匯出 PDF</span>
                        </button>
                    )}

                    <button onClick={onEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"><Edit className="w-5 h-5"/></button>
                    <button onClick={onDelete} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5"/></button>
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>基本資料</button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>回報紀錄 ({customer.notes?.length || 0})</button>
                    <button onClick={() => setActiveTab('match')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow' : 'text-gray-500'}`}>智慧配對 ({matchedObjects.length})</button>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">承辦專員</label>
                                    <div className="flex items-center gap-2 font-bold text-blue-600">
                                        <Briefcase className="w-4 h-4"/> 
                                        {customer.assignedAgent || customer.ownerName || '未指定'}
                                    </div>
                                </div>

                                <div><label className="text-xs text-gray-400 block mb-1">聯絡電話</label><div className="flex items-center gap-2 font-mono text-lg font-bold"><Phone className="w-4 h-4 text-blue-500"/> {customer.phone || '未填寫'} <a href={`tel:${customer.phone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">撥打</a></div></div>
                                <div>
                                    <label className="text-xs text-gray-400 block mb-1">{isSeller ? (isRental ? '租金' : '開價') : '需求預算'}</label>
                                    <div className="text-2xl font-black text-green-500">{isSeller ? customer.totalPrice : customer.value || 0} <span className="text-sm text-gray-500 ml-1">{isRental ? '元' : '萬'}</span></div>
                                </div>
                                {!isSeller && (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求區域</label><div className="font-bold">{customer.reqRegion || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求類型</label><div className="font-bold">{customer.targetPropertyType || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求坪數</label><div className="font-bold">{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</div></div>
                                    </>
                                )}
                                {isSeller && (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">物件類型</label><div className="font-bold">{customer.propertyType || '未指定'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">地坪/建坪</label><div className="font-bold">{customer.landPing || 0} / {customer.buildPing || 0} 坪</div></div>
                                        <div className="md:col-span-2"><label className="text-xs text-gray-400 block mb-1">地址</label><div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> {customer.landNo || '未填寫'}</div></div>
                                    </>
                                )}
                                <div className="md:col-span-2 pt-4 border-t dark:border-slate-700">
                                    <label className="text-xs text-gray-400 block mb-2 flex items-center gap-1"><StickyNote className="w-3 h-3"/> 備註事項</label>
                                    <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{customer.remarks || "無備註內容"}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddNoteSubmit} className="flex gap-2 mb-4"><input value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="輸入回報內容..." className={`flex-1 px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"><Plus className="w-5 h-5"/></button></form>
                        <div className="space-y-3">
                            {(customer.notes || []).length === 0 ? <p className="text-center text-gray-400 py-10">尚無紀錄</p> : 
                            [...customer.notes].reverse().map((note, idx) => (
                                <div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}>
                                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-500">{note.author}</span><span className="text-xs text-gray-400">{note.date}</span></div>
                                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                                    <div className="flex justify-end mt-2"><button onClick={() => { if(confirm("刪除此紀錄？")) onDeleteNote(customer.id, note); }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {activeTab === 'match' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-200 text-sm mb-4">
                            <h3 className="font-bold flex items-center gap-2 mb-1"><Target className="w-4 h-4"/> 配對條件 ({isSeller ? '本案條件' : '需求條件'})</h3>
                            <ul className="list-disc list-inside opacity-80 text-xs">
                                {isSeller ? (
                                    <>
                                        <li>本案區域：{customer.reqRegion || customer.assignedRegion}</li>
                                        <li>本案類型：{customer.propertyType || '未指定'}</li>
                                        <li>本案坪數：地 {customer.landPing} / 建 {customer.buildPing}</li>
                                    </>
                                ) : (
                                    <>
                                        <li>需求區域：{customer.reqRegion || '不限'} (含歸檔區)</li>
                                        <li>需求類型：{customer.targetPropertyType || '不限'}</li>
                                        <li>需求坪數：{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</li>
                                    </>
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
                                            <div className="font-bold flex items-center gap-2">
                                                {obj.name || obj.caseName} 
                                                <span className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded flex items-center gap-1">
                                                    <Briefcase className="w-3 h-3"/> {obj.ownerName}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CustomerDetail;