import React, { useState, useMemo } from 'react';
import { 
  X, Phone, MapPin, Trash2, Edit, Printer, 
  StickyNote, Briefcase, CheckCircle, Plus, Target, CheckSquare, 
  Image as ImageIcon, FileText, Map, Navigation, Layout
} from 'lucide-react';
import { STATUS_CONFIG } from '../config/constants';

const StatusBadge = ({ status, category }) => {
    const isCase = ['賣方', '出租', '出租方'].includes(category);
    const config = STATUS_CONFIG[status] || STATUS_CONFIG['new'];
    
    const labelMap = {
        'new': isCase ? '新案件' : '新客戶',
        // ★★★ 修正這裡 ★★★
        'contacting': isCase ? '洽談中' : '接洽中',
        'commissioned': '已委託',
        'offer': '已收斡',
        'closed': '已成交',
        'lost': '已無效'
    };

    return <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>{labelMap[status] || config.label}</span>;
};

// Base64 轉 Blob
const base64ToBlob = (base64) => {
    try {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) { u8arr[n] = bstr.charCodeAt(n); }
        return new Blob([u8arr], { type: mime });
    } catch (e) { return null; }
};

const CustomerDetail = ({ customer, allCustomers = [], currentUser, onEdit, onDelete, onAddNote, onDeleteNote, onBack, darkMode, allUsers = [] }) => {
    const [noteContent, setNoteContent] = useState('');
    const [activeTab, setActiveTab] = useState('info'); 
    
    // Modal
    const [showPrintModal, setShowPrintModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    
    const [printOptions, setPrintOptions] = useState({
        cover: true, cadastral: true, route: true, location: true, plan: true
    });

    const isSeller = ['賣方', '出租', '出租方'].includes(customer.category);
    const isRental = customer.category && customer.category.includes('出租');
    
    const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';
    const isOwner = currentUser?.username === customer.owner;
    const canEdit = isAdmin || isOwner; 

    const typeStr = customer.propertyType || customer.type || '';
    const isLand = typeStr.includes('土地') || typeStr.includes('農地') || typeStr.includes('建地') || typeStr.includes('工業地');

    const formatAddress = () => {
        if (canEdit) {
            if (customer.road) return customer.road + (customer.houseNumber ? ` ${customer.houseNumber}` : '');
            if (customer.landSection) return customer.landSection + (customer.landNumber ? ` ${customer.landNumber}` : '');
            return customer.landNo || customer.address || '';
        }
        if (customer.road) return customer.road; 
        if (customer.landSection) return customer.landSection; 
        const addr = customer.landNo || customer.address || '';
        if (addr.includes('段')) return addr.split('段')[0] + '段';
        return "詳洽專員"; 
    };

    const handlePrintClick = () => { setShowPrintModal(true); };

    const executePrint = () => {
        const win = window.open('', '', 'height=800,width=1200');
        let finalAgent = currentUser; 
        if (customer.assignedAgent) {
            const foundAgent = (allUsers || []).find(u => u.name === customer.assignedAgent);
            if (foundAgent) { finalAgent = foundAgent; }
        }
        const agentName = finalAgent?.name || '專案經紀人';
        const agentPhone = finalAgent?.phone || '09xx-xxx-xxx';
        const agentLine = finalAgent?.lineId || ''; 
        
        const generateContentHtml = (src, title, id) => {
            if (!src) return '';
            const isPdf = src.startsWith('data:application/pdf');
            if (isPdf) {
                const blob = base64ToBlob(src);
                const blobUrl = blob ? URL.createObjectURL(blob) : '';
                return `
                    <div class="page-break">
                        <div class="header-small"><span>${customer.caseName || customer.name} - ${title}</span></div>
                        <div class="pdf-wrapper">
                            <div class="pdf-controls no-print">
                                <span class="pdf-alert">⚠️ 注意：PDF 無法隨主頁面列印</span>
                                <button onclick="printPdfFrame('${id}')">🖨️ 單獨列印此圖</button>
                            </div>
                            <iframe id="${id}" src="${blobUrl}" class="pdf-frame"></iframe>
                        </div>
                    </div>`;
            } else {
                return `
                    <div class="page-break">
                        <div class="header-small"><span>${customer.caseName || customer.name} - ${title}</span></div>
                        <div class="img-full-page"><img src="${src}" /></div>
                    </div>`;
            }
        };
        
        let coverHtml = '';
        if (printOptions.cover && customer.photoUrl) {
            const isPdf = customer.photoUrl.startsWith('data:application/pdf');
            if (isPdf) {
                const blob = base64ToBlob(customer.photoUrl);
                const blobUrl = blob ? URL.createObjectURL(blob) : '';
                coverHtml = `
                    <div class="img-box pdf-wrapper-inline">
                        <div class="pdf-controls no-print"><span class="pdf-alert">⚠️ PDF 需單獨列印</span><button onclick="printPdfFrame('cover-pdf')">🖨️ 列印</button></div>
                        <iframe id="cover-pdf" src="${blobUrl}" style="width:100%; height:400px; border:1px solid #ddd;"></iframe>
                    </div>`;
            } else {
                coverHtml = `<div class="img-box"><div class="img-title">現況封面</div><img src="${customer.photoUrl}" /></div>`;
            }
        }

        let attachmentsHtml = '';
        if (printOptions.cadastral) attachmentsHtml += generateContentHtml(customer.imgCadastral, "地籍圖", "pdf-cadastral");
        if (printOptions.route) attachmentsHtml += generateContentHtml(customer.imgRoute, "路線圖", "pdf-route");
        if (printOptions.location) attachmentsHtml += generateContentHtml(customer.imgLocation, "位置圖", "pdf-location");
        if (printOptions.plan) attachmentsHtml += generateContentHtml(customer.imgPlan, "規劃圖", "pdf-plan");

        const displayCity = customer.city || customer.vendorCity || '高雄市'; 
        const displayArea = customer.reqRegion || customer.vendorDistrict || customer.area || '';
        const displayAddress = formatAddress();

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
                <div class="spec-item mt-3"><div class="spec-label">型態</div><div class="spec-value">${customer.propertyType || '電梯大樓'}</div></div>
            `;
        }

        win.document.write('<html><head><title>' + (customer.caseName || customer.name) + ' - 物件介紹</title>');
        win.document.write('<style>');
        win.document.write(`
            @page { size: A4 portrait; margin: 0; }
            body { font-family: "Microsoft JhengHei", sans-serif; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            @media print { .no-print { display: none !important; } .pdf-wrapper { border: 1px dashed #ccc; height: 900px; display: flex; align-items: center; justify-content: center; } .pdf-wrapper:after { content: "此頁為 PDF 文件，請使用網頁上的按鈕單獨列印。"; color: #999; } .pdf-frame { display: none; } }
            .control-bar { padding: 12px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; text-align: right; position: sticky; top: 0; z-index: 999; display: flex; justify-content: space-between; align-items: center; }
            .btn { padding: 8px 16px; border-radius: 6px; font-weight: bold; cursor: pointer; border: none; margin-left: 10px; font-size: 14px; }
            .btn-print { background: #2563eb; color: white; }
            .btn-close { background: #4b5563; color: white; }
            .hint { font-size: 12px; color: #64748b; }
            .page-container { width: 210mm; min-height: 296mm; padding: 10mm 15mm; box-sizing: border-box; margin: 0 auto; display: flex; flex-direction: column; position: relative; background: white; }
            .page-break { page-break-before: always; width: 210mm; height: 296mm; padding: 10mm 15mm; box-sizing: border-box; display: flex; flex-direction: column; background: white; margin: 0 auto; }
            .header { border-bottom: 4px solid #14532d; padding-bottom: 10px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header-small { border-bottom: 2px solid #ccc; padding-bottom: 5px; margin-bottom: 15px; font-weight: bold; color: #555; }
            .header h1 { margin: 0; font-size: 28px; color: #14532d; font-weight: 900; }
            .header span { font-size: 14px; font-weight: bold; color: #15803d; }
            .img-box { margin-bottom: 15px; }
            .img-title { font-size: 12px; color: #15803d; font-weight: bold; margin-bottom: 2px; }
            .img-box img { width: 100%; height: auto; max-height: 350px; object-fit: contain; border-radius: 6px; border: 1px solid #d1d5db; }
            .pdf-wrapper { width: 100%; flex: 1; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; display: flex; flex-direction: column; }
            .pdf-controls { background: #f1f5f9; padding: 8px; text-align: center; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
            .pdf-controls button { background: #0f172a; color: white; border: none; padding: 5px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
            .pdf-alert { font-size: 12px; color: #ef4444; font-weight: bold; }
            .pdf-frame { width: 100%; height: 100%; border: none; }
            .img-full-page { flex: 1; display: flex; align-items: center; justify-content: center; }
            .img-full-page img { max-width: 100%; max-height: 260mm; object-fit: contain; }
            .title-section { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 20px; }
            .title-info { width: 65%; }
            .case-name { font-size: 32px; font-weight: 900; color: #111827; margin: 0 0 6px 0; line-height: 1.2; }
            .address { font-size: 16px; color: #4b5563; font-weight: bold; }
            .price-info { width: 35%; text-align: right; }
            .price-val { font-size: 52px; font-weight: 900; color: #15803d; line-height: 1; }
            .price-unit { font-size: 20px; color: #374151; }
            .specs-box { background: #ffffff; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
            .specs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr; column-gap: 20px; row-gap: 10px; }
            .spec-label { font-size: 12px; color: #6b7280; }
            .spec-value { font-size: 18px; font-weight: bold; color: #1f2937; }
            .highlight-box { background: #fdfbf7; border: 1px solid #e5e7eb; padding: 15px; border-radius: 6px; margin-top: auto; margin-bottom: 20px; }
            .highlight-title { color: #b45309; font-weight: bold; margin-bottom: 5px; }
            .footer { background: #14532d; color: white; padding: 15px 20px; border-radius: 10px; display: flex; justify-content: space-between; align-items: center; margin-top: auto; border-top: 4px solid #22c55e; }
            .agent-info h3 { margin: 0; font-size: 22px; font-weight: 900; }
            .phone { font-size: 26px; font-weight: 900; color: #fff; }
        `);
        win.document.write('</style></head><body>');
        
        win.document.write(`
            <div class="control-bar no-print">
                <span class="hint">系統提示：若有 PDF 檔案，請使用下方的「單獨列印此圖」按鈕進行列印。</span>
                <div>
                    <button class="btn btn-print" onclick="window.print()">🖨️ 列印本頁 (HTML/圖片)</button>
                    <button class="btn btn-close" onclick="window.close()">關閉</button>
                </div>
            </div>
        `);

        win.document.write(`
            <div class="page-container">
                <div class="header"><h1>綠芽團隊</h1><span>GreenShootTeam</span></div>
                ${coverHtml}
                <div class="title-section">
                    <div class="title-info"><h2 class="case-name">${customer.caseName || customer.name}</h2><div class="address">📍 ${displayCity} ${displayArea} ${displayAddress}</div></div>
                    <div class="price-info"><div class="price-val">${customer.totalPrice} <span class="price-unit">${isRental ? '元' : '萬'}</span></div></div>
                </div>
                <div class="specs-box"><div class="specs-grid">${specsHtml}</div></div>
                ${customer.nearby ? `<div class="highlight-box"><div class="highlight-title">🌟 物件優勢</div><div>${customer.nearby}</div></div>` : '<div style="flex-grow:1"></div>'} 
                <div class="footer">
                    <div class="agent-info"><h3>${agentName}</h3><div>誠信服務 • 專業熱忱</div></div>
                    <div class="contact-info"><div class="phone">☎ ${agentPhone}</div>${agentLine ? `<div>LINE ID: ${agentLine}</div>` : ''}</div>
                </div>
            </div>
        `);

        win.document.write(attachmentsHtml);

        win.document.write(`
            <script>
                function printPdfFrame(id) {
                    const iframe = document.getElementById(id);
                    if (iframe) {
                        iframe.contentWindow.focus();
                        iframe.contentWindow.print();
                    } else {
                        alert("找不到 PDF 檔案");
                    }
                }
                window.onload = function() { setTimeout(function() { window.print(); }, 1200); }
            </script>
        `);

        win.document.write('</body></html>');
        win.document.close();
        setShowPrintModal(false);
    };

    // 文件預覽 (網頁版)
    const renderDocument = (src, title, icon) => {
        if (!src) return null;
        const isPdf = src.startsWith('data:application/pdf');
        return (
            <div className="bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <div className="bg-gray-50 dark:bg-slate-800 p-3 border-b dark:border-slate-700 flex justify-between items-center">
                    <span className="font-bold text-sm flex items-center gap-2 text-gray-700 dark:text-gray-300">{icon} {title}</span>
                    <button onClick={() => {
                        const w = window.open("");
                        w.document.write(isPdf ? `<iframe width="100%" height="100%" src="${src}"></iframe>` : `<img src="${src}" style="max-width:100%"/>`);
                    }} className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded hover:bg-blue-200">全螢幕</button>
                </div>
                <div className="p-0">
                    {isPdf ? (
                        <div className="w-full h-64 bg-gray-100 relative group">
                            <iframe src={`${src}#toolbar=0&navpanes=0&scrollbar=0`} className="w-full h-full border-none" title={title}/>
                            <div className="absolute inset-0 bg-transparent"></div>
                        </div>
                    ) : (<img src={src} className="w-full h-64 object-contain bg-gray-50" alt={title} />)}
                </div>
            </div>
        );
    };

    const matchedObjects = useMemo(() => {
        const safeFloat = (v) => { if (!v) return 0; const num = parseFloat(String(v).replace(/,/g, '').replace(/[^0-9.]/g, '')); return isNaN(num) ? 0 : num; };
        return allCustomers.filter(target => {
            if (target.id === customer.id) return false;
            if (!isAdmin) {
                const targetIsCase = ['賣方', '出租', '出租方'].includes(target.category);
                const targetIsMine = target.owner === currentUser?.username;
                if (!targetIsCase && !targetIsMine) return false;
            }
            const targetIsSeller = ['賣方', '出租', '出租方'].includes(target.category);
            
            if (!isSeller) {
                if (!targetIsSeller) return false;
                const buyerReqs = (customer.reqRegion || '').split(',').map(s=>s.trim()).filter(Boolean);
                const targetAddr = [target.city, target.reqRegion, target.assignedRegion, target.road, target.landSection, target.address, target.landNo].join('');
                if (buyerReqs.length > 0 && !buyerReqs.some(req => targetAddr.includes(req))) return false;
                const buyerBudget = safeFloat(customer.value);
                const targetPrice = safeFloat(target.totalPrice);
                if (buyerBudget > 0 && targetPrice > 0) { if (targetPrice > buyerBudget * 1.15) return false; }
                const minPing = safeFloat(customer.minPing);
                const maxPing = safeFloat(customer.maxPing);
                const targetSize = Math.max(safeFloat(target.landPing), safeFloat(target.buildPing));
                if (minPing > 0 && targetSize < minPing) return false;
                if (maxPing > 0 && targetSize > maxPing) return false;
                return true;
            } else {
                if (targetIsSeller) return false;
                const myAddr = [customer.city, customer.reqRegion, customer.assignedRegion, customer.road, customer.landSection].join('');
                const buyerReqs = (target.reqRegion || '').split(',').map(s=>s.trim()).filter(Boolean);
                if (buyerReqs.length > 0 && !buyerReqs.some(req => myAddr.includes(req))) return false;
                const myPrice = safeFloat(customer.totalPrice);
                const buyerBudget = safeFloat(target.value);
                if (myPrice > 0 && buyerBudget > 0) { if (myPrice > buyerBudget * 1.15) return false; }
                const buyerMin = safeFloat(target.minPing);
                const buyerMax = safeFloat(target.maxPing);
                const mySize = Math.max(safeFloat(customer.landPing), safeFloat(customer.buildPing));
                if (buyerMin > 0 && mySize < buyerMin) return false;
                if (buyerMax > 0 && mySize > buyerMax) return false;
                return true;
            }
        });
    }, [customer, allCustomers, isSeller, isAdmin, currentUser]);

    const handleAddNoteSubmit = (e) => { e.preventDefault(); if (!noteContent.trim()) return; onAddNote(customer.id, noteContent); setNoteContent(''); };

    return (
        <div className={`min-h-screen w-full ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-800'}`}>
            <div className={`sticky top-0 z-20 px-4 py-4 border-b flex justify-between items-center ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'} shadow-sm`}>
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800"><X className="w-6 h-6" /></button>
                    <h1 className="text-xl font-bold truncate max-w-[200px]">{customer.name}</h1>
                    <StatusBadge status={customer.status} category={customer.category} />
                </div>
                <div className="flex gap-2">
                    {isSeller && (
                        <button onClick={handlePrintClick} className="p-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full transition-colors flex items-center gap-1 font-bold shadow-sm" title="匯出 PDF">
                            <Printer className="w-5 h-5"/> <span className="hidden sm:inline text-xs">匯出 PDF</span>
                        </button>
                    )}
                    {canEdit && (
                        <>
                            <button onClick={onEdit} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full"><Edit className="w-5 h-5"/></button>
                            <button onClick={() => setShowDeleteModal(true)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-full"><Trash2 className="w-5 h-5"/></button>
                        </>
                    )}
                </div>
            </div>

            <div className="p-4 max-w-3xl mx-auto space-y-6 pb-24">
                <div className="flex p-1 bg-gray-200 dark:bg-slate-800 rounded-xl">
                    <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'info' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>基本資料</button>
                    <button onClick={() => setActiveTab('documents')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'documents' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>相關圖資</button>
                    <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'notes' ? 'bg-white dark:bg-slate-600 text-blue-600 shadow' : 'text-gray-500'}`}>回報紀錄 ({customer.notes?.length || 0})</button>
                    <button onClick={() => setActiveTab('match')} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${activeTab === 'match' ? 'bg-white dark:bg-slate-600 text-purple-600 shadow' : 'text-gray-500'}`}>智慧配對 ({matchedObjects.length})</button>
                </div>

                {activeTab === 'info' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-100'} shadow-sm`}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div><label className="text-xs text-gray-400 block mb-1">承辦專員</label><div className="flex items-center gap-2 font-bold text-blue-600"><Briefcase className="w-4 h-4"/> {customer.assignedAgent || customer.ownerName || '未指定'}</div></div>
                                <div><label className="text-xs text-gray-400 block mb-1">聯絡電話</label><div className="flex items-center gap-2 font-mono text-lg font-bold"><Phone className="w-4 h-4 text-blue-500"/> {customer.phone || '未填寫'} <a href={`tel:${customer.phone}`} className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">撥打</a></div></div>
                                <div><label className="text-xs text-gray-400 block mb-1">{isSeller ? (isRental ? '租金' : '開價') : '需求預算'}</label><div className="text-2xl font-black text-green-500">{isSeller ? customer.totalPrice : customer.value || 0} <span className="text-sm text-gray-500 ml-1">{isRental ? '元' : '萬'}</span></div></div>
                                {isSeller ? (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">物件類型</label><div className="font-bold">{customer.propertyType || '未指定'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">地坪/建坪</label><div className="font-bold">{customer.landPing || 0} / {customer.buildPing || 0} 坪</div></div>
                                        <div className="md:col-span-2"><label className="text-xs text-gray-400 block mb-1">地址資訊</label><div className="font-bold flex items-center gap-2"><MapPin className="w-4 h-4"/> {customer.city} {customer.reqRegion} {formatAddress()}</div>{(customer.landSection || customer.landNumber) && canEdit && <div className="text-sm text-gray-500 mt-1 pl-6">段號：{customer.landSection} {customer.landNumber}</div>}</div>
                                    </>
                                ) : (
                                    <>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求區域</label><div className="font-bold">{customer.reqRegion || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求類型</label><div className="font-bold">{customer.targetPropertyType || '不限'}</div></div>
                                        <div><label className="text-xs text-gray-400 block mb-1">需求坪數</label><div className="font-bold">{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</div></div>
                                    </>
                                )}
                                <div className="md:col-span-2 pt-4 border-t dark:border-slate-700"><label className="text-xs text-gray-400 block mb-2 flex items-center gap-1"><StickyNote className="w-3 h-3"/> 備註事項</label><div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg text-sm whitespace-pre-wrap leading-relaxed">{customer.remarks || "無備註內容"}</div></div>
                            </div>
                        </div>

                        {/* 封面現況圖 (只顯示這張) */}
                        {isSeller && customer.photoUrl && (
                            <div className="p-4 bg-white dark:bg-slate-900 border dark:border-slate-700 rounded-xl">
                                <h3 className="font-bold mb-3 flex items-center gap-2 text-gray-700 dark:text-gray-300"><ImageIcon className="w-4 h-4"/> 現況封面</h3>
                                {renderDocument(customer.photoUrl, "現況封面", <ImageIcon className="w-4 h-4"/>)}
                            </div>
                        )}
                    </div>
                )}

                {/* 相關圖資分頁 */}
                {activeTab === 'documents' && isSeller && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        {(!customer.imgCadastral && !customer.imgRoute && !customer.imgLocation && !customer.imgPlan) && (
                            <div className="text-center py-20 text-gray-400 bg-gray-50 dark:bg-slate-900 rounded-xl border border-dashed">
                                <Map className="w-12 h-12 mx-auto mb-2 opacity-30"/>
                                <p>尚未上傳任何圖資</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 gap-6">
                            {renderDocument(customer.imgCadastral, "地籍圖", <Map className="w-4 h-4 text-blue-500"/>)}
                            {renderDocument(customer.imgRoute, "路線圖", <Navigation className="w-4 h-4 text-green-500"/>)}
                            {renderDocument(customer.imgLocation, "位置圖", <MapPin className="w-4 h-4 text-red-500"/>)}
                            {renderDocument(customer.imgPlan, "規劃圖", <Layout className="w-4 h-4 text-purple-500"/>)}
                        </div>
                    </div>
                )}

                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddNoteSubmit} className="flex gap-2 mb-4"><input value={noteContent} onChange={e => setNoteContent(e.target.value)} placeholder="輸入回報內容..." className={`flex-1 px-4 py-3 rounded-xl border outline-none ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white'}`} /><button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold"><Plus className="w-5 h-5"/></button></form>
                        <div className="space-y-3">{(customer.notes || []).length === 0 ? <p className="text-center text-gray-400 py-10">尚無紀錄</p> : [...customer.notes].reverse().map((note, idx) => (<div key={idx} className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}`}><div className="flex justify-between mb-2"><span className="text-xs font-bold text-blue-500">{note.author}</span><span className="text-xs text-gray-400">{note.date}</span></div><p className="text-sm whitespace-pre-wrap">{note.content}</p><div className="flex justify-end mt-2"><button onClick={() => { if(confirm("刪除此紀錄？")) onDeleteNote(customer.id, note); }} className="text-gray-300 hover:text-red-500"><Trash2 className="w-3 h-3"/></button></div></div>))}</div>
                    </div>
                )}

                {activeTab === 'match' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl text-purple-800 dark:text-purple-200 text-sm mb-4"><h3 className="font-bold flex items-center gap-2 mb-1"><Target className="w-4 h-4"/> 配對條件 ({isSeller ? '本案條件' : '需求條件'})</h3><ul className="list-disc list-inside opacity-80 text-xs">{isSeller ? (<><li>本案區域：{customer.reqRegion || customer.assignedRegion}</li><li>本案類型：{customer.propertyType || '未指定'}</li><li>本案坪數：地 {customer.landPing} / 建 {customer.buildPing}</li></>) : (<><li>需求區域：{customer.reqRegion || '不限'} (含歸檔區)</li><li>需求類型：{customer.targetPropertyType || '不限'}</li><li>需求坪數：{customer.minPing || 0} ~ {customer.maxPing || '不限'} 坪</li></>)}</ul></div>
                        {matchedObjects.length === 0 ? (<div className="text-center py-20 opacity-50"><p>{isSeller ? '目前沒有符合需求的買方' : '目前沒有符合條件的物件'}</p></div>) : (<div className="grid grid-cols-1 gap-3">{matchedObjects.map(obj => (<div key={obj.id} className={`flex justify-between p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'} hover:border-purple-400 transition-colors`}><div><div className="font-bold flex items-center gap-2">{obj.name || obj.caseName} <span className="text-xs bg-gray-100 dark:bg-slate-800 px-1 rounded flex items-center gap-1"><Briefcase className="w-3 h-3"/> {obj.ownerName}</span></div></div></div>))}</div>)}
                    </div>
                )}
            </div>

            {/* 列印選項 Modal */}
            {showPrintModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl">
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Printer className="w-5 h-5"/> 選擇列印內容</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.cover} onChange={e => setPrintOptions({...printOptions, cover: e.target.checked})} className="w-4 h-4"/> <span>封面現況照片</span></label>
                            {customer.imgCadastral && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.cadastral} onChange={e => setPrintOptions({...printOptions, cadastral: e.target.checked})} className="w-4 h-4"/> <span>地籍圖</span></label>}
                            {customer.imgRoute && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.route} onChange={e => setPrintOptions({...printOptions, route: e.target.checked})} className="w-4 h-4"/> <span>路線圖</span></label>}
                            {customer.imgLocation && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.location} onChange={e => setPrintOptions({...printOptions, location: e.target.checked})} className="w-4 h-4"/> <span>位置圖</span></label>}
                            {customer.imgPlan && <label className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800"><input type="checkbox" checked={printOptions.plan} onChange={e => setPrintOptions({...printOptions, plan: e.target.checked})} className="w-4 h-4"/> <span>規劃圖</span></label>}
                        </div>
                        <div className="flex gap-3 mt-6"><button onClick={() => setShowPrintModal(false)} className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold">取消</button><button onClick={executePrint} className="flex-1 py-2 bg-blue-600 text-white rounded-lg font-bold">確認列印</button></div>
                    </div>
                </div>
            )}

            {/* 刪除確認 Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 w-full max-w-sm shadow-xl border-2 border-red-500">
                        <div className="flex flex-col items-center text-center">
                            <div className="bg-red-100 p-3 rounded-full mb-4"><Trash2 className="w-8 h-8 text-red-600"/></div>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">確認刪除資料？</h3>
                            <p className="text-gray-500 dark:text-gray-400 mb-6">此操作無法復原，您確定要永久刪除此筆資料嗎？</p>
                            <div className="flex gap-3 w-full">
                                <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-300 transition-colors">取消</button>
                                <button onClick={onDelete} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg transition-colors">確認刪除</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerDetail;